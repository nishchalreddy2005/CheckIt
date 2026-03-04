"use server"

import { db } from "@/lib/db"
import { users, sessions, tasks } from "@/lib/db/schema"
import { eq, or, ilike } from "drizzle-orm"
import type { User } from "@/lib/types"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  invalidateSession,
  checkRateLimit,
  validateSession,
  createSession,
} from "@/lib/security"
import { verifyTwoFactorToken, hashPassword, verifyPassword } from "@/lib/security-server"
import { headers } from "next/headers"
import crypto from "crypto"
import { sendOtpEmail } from "@/lib/mailer"

export async function createUser(formData: FormData): Promise<{ success: boolean; message: string; userId?: string; requireOtpVerification?: boolean; email?: string }> {
  try {
    const email = formData.get("email") as string
    const firstName = formData.get("first-name") as string
    const lastName = formData.get("last-name") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string
    const name = `${firstName} ${lastName}`

    if (!email || !firstName || !lastName || !username || !password) {
      return { success: false, message: "Missing required fields" }
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email))
    if (existing) {
      return { success: false, message: "Email already in use" }
    }

    const [existingUsername] = await db.select().from(users).where(eq(users.username, username))
    if (existingUsername) {
      return { success: false, message: "Username already taken" }
    }

    const id = crypto.randomUUID()
    const hashedPassword = await hashPassword(password)

    // Check if user requested 2FA setup at registration
    const enable2fa = formData.get("enable-2fa") === "on"

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.insert(users).values({
      id,
      email,
      username,
      name,
      password: hashedPassword,
      createdAt: new Date(),
      emailVerified: false,
      twoFactorEnabled: enable2fa,
      failedLoginAttempts: 0,
      otpCode: otp,
      otpExpiresAt: otpExpiresAt,
    })

    // Send the OTP via email
    await sendOtpEmail(email, otp, "Account Registration")

    // We do NOT create the session yet. We tell the client to switch to OTP verification state.
    return { success: true, message: "OTP sent. Please verify your email.", userId: id, requireOtpVerification: true, email: email }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, message: "Registration failed. Please try again later." }
  }
}

export async function verifyRegistrationOtp(userId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) return { success: false, message: "User not found" }

    if (!user.otpCode || user.otpCode !== otp) {
      return { success: false, message: "Invalid verification code" }
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return { success: false, message: "Verification code expired" }
    }

    // Mark as verified and clear OTP
    await db.update(users).set({
      emailVerified: true,
      otpCode: null,
      otpExpiresAt: null
    }).where(eq(users.id, userId))

    // Create session now
    let sessionId
    try {
      const reqHeaders = await headers()
      const userAgent = reqHeaders.get("user-agent") || undefined
      const ipAddress = reqHeaders.get("x-forwarded-for") || undefined
      sessionId = await createSession(userId, userAgent, ipAddress)
    } catch (sessionError) {
      sessionId = `fallback-session-${Date.now()}`
    }

    try {
      (await cookies()).set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      })
    } catch (cookieError) { }

    try {
      revalidatePath("/dashboard")
    } catch (revalidateError) { }

    return { success: true, message: "Email verified successfully" }
  } catch (error) {
    console.error("Failed to verify OTP:", error)
    return { success: false, message: "Verification failed. Please try again." }
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user ? (user as User) : null
  } catch (error) {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    return user ? (user as User) : null
  } catch (error) {
    return null
  }
}

export async function getCurrentUser() {
  try {
    const sessionId = (await cookies()).get("sessionId")?.value
    if (!sessionId) return null

    const { valid, userId } = await validateSession(sessionId)
    if (!valid || !userId) {
      (await cookies()).delete("sessionId")
      return null
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) {
      (await cookies()).delete("sessionId")
      return null
    }

    return user as User
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

export async function authenticateUser(formData: FormData): Promise<{
  success: boolean
  message: string
  userId?: string
  requireTwoFactor?: boolean
  redirectTo?: string
  isSuperadmin?: boolean
}> {
  try {
    const usernameOrEmail = formData.get("email") as string
    const password = formData.get("password") as string
    const ipAddress = (await headers()).get("x-forwarded-for") || "unknown"

    if (!usernameOrEmail || !password) {
      return { success: false, message: "Username/email and password are required" }
    }

    const rateLimitCheck = await checkRateLimit(`ip:${ipAddress}`, "login")
    if (!rateLimitCheck.success) {
      return { success: false, message: rateLimitCheck.message || "Too many login attempts" }
    }

    const [user] = await db.select().from(users).where(
      or(
        eq(users.email, usernameOrEmail),
        eq(users.username, usernameOrEmail)
      )
    )
    if (!user) {
      return { success: false, message: "Invalid username or password" }
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      return {
        success: false,
        message: `Account is locked. Please try again after ${user.lockedUntil.toLocaleTimeString()}`,
      }
    }

    let isPasswordValid = false
    try {
      isPasswordValid = await verifyPassword(password, user.password || "")
    } catch (error) {
      return { success: false, message: "Authentication error. Please try again." }
    }

    if (!isPasswordValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1
      if (failedAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        await db.update(users).set({ failedLoginAttempts: failedAttempts, lockedUntil: lockUntil }).where(eq(users.id, user.id))
        return { success: false, message: "Too many failed login attempts. Account is locked for 15 minutes." }
      }
      await db.update(users).set({ failedLoginAttempts: failedAttempts }).where(eq(users.id, user.id))
      return { success: false, message: "Invalid username or password" }
    }

    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    }).where(eq(users.id, user.id))

    if (user.twoFactorEnabled) {
      // Generate a fresh 6-digit OTP for 2FA
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      await db.update(users).set({
        otpCode: otp,
        otpExpiresAt: otpExpiresAt
      }).where(eq(users.id, user.id))

      await sendOtpEmail(user.email, otp, "Account Login")

      return {
        success: true,
        message: "Please enter your two-factor authentication code",
        userId: user.id,
        requireTwoFactor: true,
      }
    }

    let sessionId
    try {
      const reqHeaders = await headers()
      const userAgent = reqHeaders.get("user-agent") || undefined
      sessionId = await createSession(user.id, userAgent, ipAddress !== "unknown" ? ipAddress : undefined)
    } catch (error) {
      return { success: false, message: "Failed to create session. Please try again." }
    }

    try {
      (await cookies()).set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      })
    } catch (error) { }

    try {
      revalidatePath("/dashboard")
    } catch (error) { }

    return {
      success: true,
      message: "Login successful",
      userId: user.id,
      redirectTo: user.isSuperadmin ? "/superadmin" : user.isAdmin ? "/admin" : "/dashboard",
      isSuperadmin: user.isSuperadmin || false
    }
  } catch (error) {
    return { success: false, message: "Authentication error. Please try again." }
  }
}

export async function verifyLoginOtp(userId: string, otp: string): Promise<{ success: boolean; message: string; redirectTo?: string; isSuperadmin?: boolean }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) return { success: false, message: "User not found" }

    if (!user.otpCode || user.otpCode !== otp) {
      return { success: false, message: "Invalid two-factor code" }
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return { success: false, message: "Two-factor code expired" }
    }

    // Clear OTP
    await db.update(users).set({
      otpCode: null,
      otpExpiresAt: null
    }).where(eq(users.id, userId))

    // Create session now
    let sessionId
    try {
      const reqHeaders = await headers()
      const userAgent = reqHeaders.get("user-agent") || undefined
      const ipAddress = reqHeaders.get("x-forwarded-for") || undefined
      sessionId = await createSession(userId, userAgent, ipAddress)
    } catch (sessionError) {
      sessionId = `fallback-session-${Date.now()}`
    }

    try {
      (await cookies()).set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      })
    } catch (cookieError) { }

    try {
      revalidatePath("/dashboard")
    } catch (revalidateError) { }

    const isSuperadmin = user.isSuperadmin || user.email === 'nishchalreddy2005@gmail.com'
    const redirectTo = isSuperadmin ? "/superadmin" : user.isAdmin ? "/admin" : "/dashboard"

    return { success: true, message: "Login successful", redirectTo, isSuperadmin }
  } catch (error) {
    console.error("Failed to verify login OTP:", error)
    return { success: false, message: "Verification failed. Please try again." }
  }
}

export async function verifyTwoFactor(
  formData: FormData,
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const token = formData.get("token") as string
    const userId = formData.get("userId") as string

    if (!token || !userId) {
      return { success: false, message: "Missing required fields" }
    }

    const user = await getUserById(userId)

    if (!user || !user.twoFactorSecret) {
      return { success: false, message: "User not found or 2FA not set up" }
    }

    const isTokenValid = verifyTwoFactorToken(user.twoFactorSecret, token)

    if (!isTokenValid) {
      return { success: false, message: "Invalid verification code" }
    }

    const reqHeaders = await headers()
    const userAgent = reqHeaders.get("user-agent") || undefined
    const ipAddress = reqHeaders.get("x-forwarded-for") || undefined
    const sessionId = await createSession(user.id, userAgent, ipAddress);

    (await cookies()).set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    })

    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id))

    revalidatePath("/dashboard")
    return { success: true, message: "Login successful", userId: user.id }
  } catch (error) {
    return { success: false, message: `Error` }
  }
}

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  try {
    const sessionId = (await cookies()).get("sessionId")?.value
    if (sessionId) {
      await invalidateSession(sessionId)
    }
    (await cookies()).delete("sessionId")
    revalidatePath("/")
    return { success: true, message: "Logout successful" }
  } catch (error) {
    try { (await cookies()).delete("sessionId") } catch (cookieError) { }
    return { success: false, message: `Error` }
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return []
    }
    const allUsers = await db.select().from(users)
    return allUsers as User[]
  } catch (error) {
    return []
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Hierarchical permissions check
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId))
    if (!targetUser) return { success: false, message: "User not found" }

    if (targetUser.isSuperadmin || targetUser.isAdmin) {
      if (!currentUser.isSuperadmin) {
        return { success: false, message: "Standard Admins cannot delete other Admins or Superadmins" }
      }

      // Superadmin self-deletion protection
      if (targetUser.id === currentUser.id) {
        return { success: false, message: "Superadmins cannot delete their own account from the dashboard" }
      }
    }

    await db.delete(sessions).where(eq(sessions.userId, userId))
    await db.delete(users).where(eq(users.id, userId))
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    return { success: false, message: "Failed to delete user" }
  }
}

export async function updateUser(
  userId: string,
  userData: Partial<User>,
): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Hierarchical permissions check
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId))
    if (!targetUser) return { success: false, message: "User not found" }

    if (targetUser.isSuperadmin || targetUser.isAdmin) {
      if (!currentUser.isSuperadmin) {
        return { success: false, message: "Standard Admins cannot update other Admins or Superadmins" }
      }
    }

    if (userData.password) {
      userData.password = await hashPassword(userData.password)
    }

    await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, userId))
    return { success: true, message: "User updated successfully" }
  } catch (error) {
    return { success: false, message: "Failed to update user" }
  }
}

export async function searchUsers(query: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []

    const searchPattern = `%${query}%`

    const results = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email
    })
      .from(users)
      .where(
        or(
          ilike(users.username, searchPattern),
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
      .limit(10)

    return results
  } catch (error) {
    console.error("Failed to search users:", error)
    return []
  }
}

// ----------------------------------------------------
// ADMINISTRATOR & SUPERADMIN ADVANCED CONTROLS
// ----------------------------------------------------

export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (!currentUser.isAdmin && !currentUser.isSuperadmin)) {
      return { success: false, message: "Unauthorized access" }
    }

    const hashedPassword = await hashPassword(newPassword)
    await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, userId))
    return { success: true, message: "User password reset successfully" }
  } catch (error) {
    console.error("Failed to reset password", error)
    return { success: false, message: "Failed to reset user password" }
  }
}

export async function suspendUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Only Superadmins can suspend users." }

    // Terminate active sessions instantly
    await db.delete(sessions).where(eq(sessions.userId, userId))
    // Apply suspension flag
    await db.update(users).set({ isSuspended: true, updatedAt: new Date() }).where(eq(users.id, userId))

    revalidatePath("/superadmin")
    return { success: true, message: "User safely suspended and logged out" }
  } catch (error) {
    return { success: false, message: "Failed to suspend user" }
  }
}

export async function unsuspendUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Only Superadmins can unsuspend users." }

    await db.update(users).set({ isSuspended: false, updatedAt: new Date() }).where(eq(users.id, userId))

    revalidatePath("/superadmin")
    return { success: true, message: "User restored" }
  } catch (error) {
    return { success: false, message: "Failed to restore user" }
  }
}

export async function hardDeleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    // Hard wipe logic
    await db.delete(tasks).where(eq(tasks.userId, userId))
    await db.delete(sessions).where(eq(sessions.userId, userId))
    await db.delete(users).where(eq(users.id, userId))

    revalidatePath("/superadmin")
    return { success: true, message: "User completely wiped from the database" }
  } catch (error) {
    return { success: false, message: "Failed to hard-delete user" }
  }
}

export async function forceDisable2FA(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null, updatedAt: new Date() }).where(eq(users.id, userId))
    return { success: true, message: "User's Two-Factor Authentication has been forcefully disabled" }
  } catch (error) {
    return { success: false, message: "Failed to disable 2FA" }
  }
}

export async function getGlobalStats() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (!currentUser.isAdmin && !currentUser.isSuperadmin)) {
      return null
    }

    // Since SQLite lacks full subquery `.count()`, we execute native arrays 
    const allUsers = await db.select({ id: users.id }).from(users)
    const allTasks = await db.select({ id: tasks.id }).from(tasks)
    const allSessions = await db.select({ id: sessions.id }).from(sessions)

    return {
      totalUsers: allUsers.length,
      totalTasks: allTasks.length,
      totalActiveSessions: allSessions.length
    }
  } catch (error) {
    console.error("Failed to compile global stats", error)
    return null
  }
}

export async function forceInvalidateUserSessions(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Hierarchical permissions check
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId))
    if (!targetUser) return { success: false, message: "User not found" }

    if (targetUser.isSuperadmin || targetUser.isAdmin) {
      if (!currentUser.isSuperadmin) {
        return { success: false, message: "Standard Admins cannot force logout other Admins or Superadmins" }
      }
    }

    await db.delete(sessions).where(eq(sessions.userId, userId))
    return { success: true, message: "User sessions invalidated successfully" }
  } catch (error) {
    console.error("Failed to invalidate sessions:", error)
    return { success: false, message: "Failed to invalidate user sessions" }
  }
}

export async function exportSystemData(): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    const allUsers = await db.select().from(users)
    const allTasks = await db.select().from(tasks)

    // Build simple CSV structure
    const userHeader = "id,email,username,name,createdAt,isAdmin,isSuperadmin,isSuspended\n"
    const userRows = allUsers.map(u => `${u.id},${u.email},${u.username},"${u.name}",${u.createdAt},${u.isAdmin},${u.isSuperadmin},${u.isSuspended}`).join("\n")

    const taskHeader = "\nid,title,userId,category,priority,completed,createdAt\n"
    const taskRows = allTasks.map(t => `${t.id},"${t.title.replace(/"/g, '""')}",${t.userId},${t.category},${t.priority},${t.completed},${t.createdAt}`).join("\n")

    const csvData = userHeader + userRows + "\n" + taskHeader + taskRows

    return { success: true, data: csvData }
  } catch (error) {
    console.error("Failed to export system data:", error)
    return { success: false, message: "Failed to export data" }
  }
}

export async function getDetailedSystemHealth() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return null
    }

    const allUsers = await db.select({ id: users.id, isSuspended: users.isSuspended, isAdmin: users.isAdmin, isSuperadmin: users.isSuperadmin }).from(users)
    const allTasks = await db.select({ id: tasks.id, completed: tasks.completed }).from(tasks)
    const activeSessions = await db.select({ id: sessions.id }).from(sessions)

    const suspendedUsersCount = allUsers.filter(u => u.isSuspended).length
    const adminCount = allUsers.filter(u => u.isAdmin && !u.isSuperadmin).length
    const superadminCount = allUsers.filter(u => u.isSuperadmin).length
    const completedTasksCount = allTasks.filter(t => t.completed).length

    return {
      success: true,
      stats: {
        totalUsers: allUsers.length,
        suspendedUsers: suspendedUsersCount,
        admins: adminCount,
        superadmins: superadminCount,
        totalTasks: allTasks.length,
        completedTasks: completedTasksCount,
        activeSessions: activeSessions.length,
        uptime: process.uptime(), // Simple server uptime metric
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      }
    }
  } catch (error) {
    console.error("Failed to compile detailed system health", error)
    return { success: false, message: "Failed to compile system health metrics" }
  }
}

export async function updateUserPreferences(preferences: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: "Not authenticated" }

    await db.update(users)
      .set({ preferences: JSON.stringify(preferences) })
      .where(eq(users.id, user.id))

    return { success: true }
  } catch (error) {
    console.error("Failed to update user preferences:", error)
    return { success: false }
  }
}

export async function savePushSubscription(subscription: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: "Not authenticated" }

    await db.update(users)
      .set({ pushSubscription: JSON.stringify(subscription) })
      .where(eq(users.id, user.id))

    return { success: true }
  } catch (error) {
    console.error("Failed to save push subscription:", error)
    return { success: false }
  }
}

export async function searchUsersByEmail(query: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const results = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
      profilePicture: users.profilePicture
    })
      .from(users)
      .where(ilike(users.email, `%${query}%`))
      .limit(5)

    return results
  } catch (error) {
    console.error("Failed to search users:", error)
    return []
  }
}

