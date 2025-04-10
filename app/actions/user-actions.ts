"use server"

import { redis, generateId } from "@/lib/redis"
import type { User } from "@/lib/types"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  hashPassword,
  verifyPassword,
  createSession,
  invalidateSession,
  checkRateLimit,
  validateSession,
  verifyTwoFactorToken,
} from "@/lib/security"
import { headers } from "next/headers"
import { initSuperadmin } from "@/lib/init-superadmin" // Fixed import

// Initialize superadmin when this file is first loaded
initSuperadmin().catch((error) => {
  console.error("Failed to initialize superadmin:", error)
})

// Create a new user
export async function createUser(formData: FormData): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Test Redis connection first
    try {
      await redis.set("connection-test", "ok")
      const testResult = await redis.get("connection-test")
      if (testResult !== "ok") {
        console.error("Redis connection test failed: unexpected result", testResult)
        return { success: false, message: "Database connection error. Please try again later." }
      }
    } catch (redisError) {
      console.error("Redis connection test failed:", redisError)
      return { success: false, message: "Database connection error. Please try again later." }
    }

    const email = formData.get("email") as string
    const firstName = formData.get("first-name") as string
    const lastName = formData.get("last-name") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string
    const name = `${firstName} ${lastName}`

    console.log("Creating user with email:", email)

    // Validate input
    if (!email || !firstName || !lastName || !password) {
      return { success: false, message: "Missing required fields" }
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    // Check if user with this email already exists
    const existingUserId = await redis.get(`email:${email}`)
    if (existingUserId) {
      console.log("User already exists with email:", email)
      return { success: false, message: "Email already in use" }
    }

    const id = generateId()
    const now = Date.now()

    // Hash the password
    const hashedPassword = await hashPassword(password)

    const user: User = {
      id,
      email,
      name,
      password: hashedPassword,
      createdAt: now,
      emailVerified: false, // Require email verification
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
    }

    console.log("Storing user data for ID:", id)

    // Store user data
    await redis.hset(`user:${id}`, user)

    // Create email to user ID mapping
    await redis.set(`email:${email}`, id)

    // Create a session
    let sessionId
    try {
      sessionId = await createSession(id)
    } catch (sessionError) {
      console.error("Session creation error:", sessionError)
      // Continue even if session creation fails - we'll handle this on the client side
      sessionId = `fallback-session-${Date.now()}`
    }

    // Set a cookie with the session ID
    try {
      cookies().set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax", // Changed from strict to lax for better cross-site experience
      })
    } catch (cookieError) {
      console.error("Cookie setting error:", cookieError)
      // Continue even if cookie setting fails
    }

    console.log("User created successfully:", id)

    try {
      revalidatePath("/dashboard")
    } catch (revalidateError) {
      console.error("Path revalidation error:", revalidateError)
      // Continue even if revalidation fails
    }

    return { success: true, message: "User created successfully", userId: id }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, message: "Registration failed. Please try again later." }
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await redis.hgetall(`user:${id}`)
    return Object.keys(user).length > 0 ? (user as User) : null
  } catch (error) {
    console.error("Failed to get user:", error)
    return null
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const userId = await redis.get(`email:${email}`)
    if (!userId) return null

    return getUserById(userId as string)
  } catch (error) {
    console.error("Failed to get user by email:", error)
    return null
  }
}

// Get current user from session
export async function getCurrentUser() {
  try {
    const sessionId = cookies().get("sessionId")?.value
    if (!sessionId) {
      console.log("No session ID found in cookies")
      return null
    }

    console.log(`Validating session: ${sessionId}`)
    // Validate session
    const { valid, userId } = await validateSession(sessionId)

    if (!valid || !userId) {
      console.log("Invalid session, clearing cookie")
      cookies().delete("sessionId")
      return null
    }

    console.log(`Session valid, getting user: ${userId}`)

    // Check if this is a superadmin ID
    if (userId.startsWith("superadmin-")) {
      const superadminId = userId
      const superadminData = await redis.hgetall(`superadmin:${superadminId}`)

      if (!superadminData || Object.keys(superadminData).length === 0) {
        console.log("Superadmin not found for valid session, clearing cookie")
        cookies().delete("sessionId")
        return null
      }

      // Convert superadmin data to user format with isSuperadmin flag
      return {
        ...superadminData,
        isAdmin: true, // Superadmin has all admin privileges
        isSuperadmin: true,
        twoFactorEnabled: false,
        emailVerified: true,
        failedLoginAttempts: 0,
        createdAt: Number.parseInt(superadminData.createdAt as string) || 0,
      } as User
    }

    // Check if this is an admin ID
    if (userId.startsWith("admin-")) {
      const adminId = userId
      const adminData = await redis.hgetall(`admin:${adminId}`)

      if (!adminData || Object.keys(adminData).length === 0) {
        console.log("Admin not found for valid session, clearing cookie")
        cookies().delete("sessionId")
        return null
      }

      // Convert admin data to user format with isAdmin flag
      return {
        ...adminData,
        isAdmin: true,
        twoFactorEnabled: false,
        emailVerified: true,
        failedLoginAttempts: 0,
        createdAt: Number.parseInt(adminData.createdAt as string) || 0,
      } as User
    }

    // Regular user flow
    const userData = await redis.hgetall(`user:${userId}`)

    if (!userData || Object.keys(userData).length === 0) {
      console.log("User not found for valid session, clearing cookie")
      cookies().delete("sessionId")
      return null
    }

    // Convert string boolean values to actual booleans
    const user: User = {
      ...userData,
      twoFactorEnabled: userData.twoFactorEnabled === "true" || userData.twoFactorEnabled === true,
      emailVerified: userData.emailVerified === "true" || userData.emailVerified === true,
      failedLoginAttempts: Number.parseInt(userData.failedLoginAttempts as string) || 0,
      createdAt: Number.parseInt(userData.createdAt as string) || 0,
      updatedAt: userData.updatedAt ? Number.parseInt(userData.updatedAt as string) : undefined,
      lastLogin: userData.lastLogin ? Number.parseInt(userData.lastLogin as string) : undefined,
      lockedUntil: userData.lockedUntil ? Number.parseInt(userData.lockedUntil as string) : undefined,
    }

    return user
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

// Authenticate user
export async function authenticateUser(formData: FormData): Promise<{
  success: boolean
  message: string
  userId?: string
  requireTwoFactor?: boolean
  redirectTo?: string // Added redirectTo property
  isSuperadmin?: boolean // Added isSuperadmin flag
}> {
  try {
    const usernameOrEmail = formData.get("email") as string
    const password = formData.get("password") as string
    const ipAddress = headers().get("x-forwarded-for") || "unknown"

    console.log(`Login attempt for: ${usernameOrEmail}`)

    // Basic validation
    if (!usernameOrEmail || !password) {
      console.log("Missing username/email or password")
      return { success: false, message: "Username/email and password are required" }
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(`ip:${ipAddress}`, "login")
    if (!rateLimitCheck.success) {
      console.log("Rate limit exceeded")
      return { success: false, message: rateLimitCheck.message || "Too many login attempts" }
    }

    // Initialize superadmin if needed
    await initSuperadmin()

    // Check if this is the superadmin by name
    if (usernameOrEmail === "Nishchal Reddy") {
      console.log("Attempting superadmin login by name")
      const superadminId = await redis.get("superadmin:username:Nishchal Reddy")

      if (superadminId) {
        const superadmin = await redis.hgetall(`superadmin:${superadminId}`)

        if (superadmin && (await verifyPassword(password, superadmin.password))) {
          // Create session
          const sessionId = await createSession(superadminId as string)

          // Set session cookie
          cookies().set("sessionId", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
            sameSite: "lax",
          })

          // Return success with redirect info instead of redirecting directly
          return {
            success: true,
            message: "Superadmin login successful",
            userId: superadminId as string,
            redirectTo: "/superadmin",
            isSuperadmin: true,
          }
        }
      }
    }

    // Check if this is the superadmin by email
    if (usernameOrEmail === "nishchal.reddy@example.com") {
      console.log("Attempting superadmin login by email")
      const superadminId = await redis.get("superadmin:email:nishchal.reddy@example.com")

      if (superadminId) {
        const superadmin = await redis.hgetall(`superadmin:${superadminId}`)

        if (superadmin && (await verifyPassword(password, superadmin.password))) {
          // Create session
          const sessionId = await createSession(superadminId as string)

          // Set session cookie
          cookies().set("sessionId", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
            sameSite: "lax",
          })

          // Return success with redirect info instead of redirecting directly
          return {
            success: true,
            message: "Superadmin login successful",
            userId: superadminId as string,
            redirectTo: "/superadmin",
            isSuperadmin: true,
          }
        }
      }
    }

    // Check if this is an admin login by username
    const adminIdByName = await redis.get(`admin:username:${usernameOrEmail}`)
    if (adminIdByName) {
      console.log(`Admin found for username: ${usernameOrEmail}`)
      const admin = await redis.hgetall(`admin:${adminIdByName}`)

      if (!admin || Object.keys(admin).length === 0) {
        console.log(`Admin data not found for ID: ${adminIdByName}`)
        return { success: false, message: "Invalid username or password" }
      }

      // Verify admin password
      let isPasswordValid = false
      try {
        isPasswordValid = await verifyPassword(password, admin.password || "")
      } catch (error) {
        console.error("Password verification error:", error)
        return { success: false, message: "Authentication error. Please try again." }
      }

      if (!isPasswordValid) {
        return { success: false, message: "Invalid username or password" }
      }

      // Create a session for admin
      console.log("Admin authentication successful")
      let sessionId
      try {
        sessionId = await createSession(adminIdByName as string)
        console.log(`Admin session created: ${sessionId}`)
      } catch (error) {
        console.error("Session creation error:", error)
        return { success: false, message: "Failed to create session. Please try again." }
      }

      // Set a cookie with the session ID
      try {
        cookies().set("sessionId", sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
          sameSite: "lax",
        })
        console.log("Admin cookie set")
      } catch (error) {
        console.error("Cookie setting error:", error)
      }

      try {
        revalidatePath("/admin")
      } catch (error) {
        console.error("Path revalidation error:", error)
      }

      return {
        success: true,
        message: "Admin login successful",
        userId: adminIdByName as string,
        redirectTo: "/admin",
      }
    }

    // Check if this is an admin login by email
    const adminIdByEmail = await redis.get(`admin:email:${usernameOrEmail}`)
    if (adminIdByEmail) {
      console.log(`Admin found for email: ${usernameOrEmail}`)
      const admin = await redis.hgetall(`admin:${adminIdByEmail}`)

      if (!admin || Object.keys(admin).length === 0) {
        console.log(`Admin data not found for ID: ${adminIdByEmail}`)
        return { success: false, message: "Invalid username or password" }
      }

      // Verify admin password
      let isPasswordValid = false
      try {
        isPasswordValid = await verifyPassword(password, admin.password || "")
      } catch (error) {
        console.error("Password verification error:", error)
        return { success: false, message: "Authentication error. Please try again." }
      }

      if (!isPasswordValid) {
        return { success: false, message: "Invalid username or password" }
      }

      // Create a session for admin
      console.log("Admin authentication successful")
      let sessionId
      try {
        sessionId = await createSession(adminIdByEmail as string)
        console.log(`Admin session created: ${sessionId}`)
      } catch (error) {
        console.error("Session creation error:", error)
        return { success: false, message: "Failed to create session. Please try again." }
      }

      // Set a cookie with the session ID
      try {
        cookies().set("sessionId", sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
          sameSite: "lax",
        })
        console.log("Admin cookie set")
      } catch (error) {
        console.error("Cookie setting error:", error)
      }

      try {
        revalidatePath("/admin")
      } catch (error) {
        console.error("Path revalidation error:", error)
      }

      return {
        success: true,
        message: "Admin login successful",
        userId: adminIdByEmail as string,
        redirectTo: "/admin",
      }
    }

    // Regular user login flow - try by username first
    const userIdByName = await redis.get(`username:${usernameOrEmail}`)
    if (userIdByName) {
      const user = await redis.hgetall(`user:${userIdByName}`)
      if (user && Object.keys(user).length > 0) {
        // Verify password
        let isPasswordValid = false
        try {
          isPasswordValid = await verifyPassword(password, user.password || "")
        } catch (error) {
          console.error("Password verification error:", error)
          return { success: false, message: "Authentication error. Please try again." }
        }

        if (isPasswordValid) {
          // Handle successful login
          // Reset failed login attempts
          await redis.hset(`user:${user.id}`, {
            ...user,
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLogin: Date.now(),
          })

          // Create a session
          console.log("Creating session")
          let sessionId
          try {
            sessionId = await createSession(user.id as string)
            console.log(`Session created: ${sessionId}`)
          } catch (error) {
            console.error("Session creation error:", error)
            return { success: false, message: "Failed to create session. Please try again." }
          }

          // Set a cookie with the session ID
          try {
            cookies().set("sessionId", sessionId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: "/",
              sameSite: "lax", // Changed from strict to strict to lax for better cross-site experience
            })
            console.log("Cookie set")
          } catch (error) {
            console.error("Cookie setting error:", error)
          }

          try {
            revalidatePath("/dashboard")
          } catch (error) {
            console.error("Path revalidation error:", error)
          }

          return {
            success: true,
            message: "Login successful",
            userId: user.id as string,
            redirectTo: "/dashboard",
          }
        }
      }
    }

    // Try by email
    const userIdByEmail = await redis.get(`email:${usernameOrEmail}`)
    if (!userIdByEmail) {
      console.log(`User not found for: ${usernameOrEmail}`)
      return { success: false, message: "Invalid username or password" }
    }

    const user = await redis.hgetall(`user:${userIdByEmail}`)
    if (!user || Object.keys(user).length === 0) {
      console.log(`User data not found for ID: ${userIdByEmail}`)
      return { success: false, message: "Invalid username or password" }
    }

    console.log(`User found: ${user.id}`)

    // Check if account is locked
    if (user.lockedUntil && Number.parseInt(user.lockedUntil as string) > Date.now()) {
      console.log(`Account locked until: ${new Date(Number.parseInt(user.lockedUntil as string)).toLocaleTimeString()}`)
      return {
        success: false,
        message: `Account is locked. Please try again after ${new Date(
          Number.parseInt(user.lockedUntil as string),
        ).toLocaleTimeString()}`,
      }
    }

    // Verify password
    let isPasswordValid = false
    try {
      isPasswordValid = await verifyPassword(password, user.password || "")
    } catch (error) {
      console.error("Password verification error:", error)
      return { success: false, message: "Authentication error. Please try again." }
    }

    console.log(`Password valid: ${isPasswordValid}`)

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (Number.parseInt(user.failedLoginAttempts as string) || 0) + 1
      console.log(`Failed login attempts: ${failedAttempts}`)

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        const lockUntil = Date.now() + 15 * 60 * 1000 // 15 minutes
        console.log(`Locking account until: ${new Date(lockUntil).toLocaleTimeString()}`)

        await redis.hset(`user:${user.id}`, {
          ...user,
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockUntil,
        })

        return {
          success: false,
          message: "Too many failed login attempts. Account is locked for 15 minutes.",
        }
      }

      // Update failed login attempts
      await redis.hset(`user:${user.id}`, {
        ...user,
        failedLoginAttempts: failedAttempts,
      })

      return { success: false, message: "Invalid username or password" }
    }

    // Reset failed login attempts
    await redis.hset(`user:${user.id}`, {
      ...user,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: Date.now(),
    })

    console.log("Authentication successful")

    // Check if 2FA is enabled
    if (user.twoFactorEnabled === "true" || user.twoFactorEnabled === true) {
      console.log("2FA is enabled, generating token")
      // Generate a temporary token for 2FA verification
      const twoFactorToken = generateId()

      // Store token in Redis with short expiration
      await redis.set(`2fa:${twoFactorToken}`, user.id, { ex: 300 }) // 5 minutes

      return {
        success: true,
        message: "Please enter your two-factor authentication code",
        userId: user.id as string,
        requireTwoFactor: true,
      }
    }

    // Create a session
    console.log("Creating session")
    let sessionId
    try {
      sessionId = await createSession(user.id as string)
      console.log(`Session created: ${sessionId}`)
    } catch (error) {
      console.error("Session creation error:", error)
      return { success: false, message: "Failed to create session. Please try again." }
    }

    // Set a cookie with the session ID
    try {
      cookies().set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax", // Changed from strict to strict to lax for better cross-site experience
      })
      console.log("Cookie set")
    } catch (error) {
      console.error("Cookie setting error:", error)
      // Continue even if cookie setting fails - the session is still valid
    }

    try {
      revalidatePath("/dashboard")
    } catch (error) {
      console.error("Path revalidation error:", error)
      // Continue even if revalidation fails
    }

    return {
      success: true,
      message: "Login successful",
      userId: user.id as string,
      redirectTo: "/dashboard",
    }
  } catch (error) {
    console.error("Failed to authenticate user:", error)
    return { success: false, message: "Authentication error. Please try again." }
  }
}

// Verify two-factor authentication
export async function verifyTwoFactor(
  formData: FormData,
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const token = formData.get("token") as string
    const twoFactorToken = formData.get("twoFactorToken") as string

    if (!token || !twoFactorToken) {
      return { success: false, message: "Missing required fields" }
    }

    // Get user ID from temporary token
    const userId = await redis.get(`2fa:${twoFactorToken}`)

    if (!userId) {
      return { success: false, message: "Invalid or expired verification session" }
    }

    // Get user
    const user = await getUserById(userId as string)

    if (!user || !user.twoFactorSecret) {
      return { success: false, message: "User not found or 2FA not set up" }
    }

    // Verify token
    const isTokenValid = verifyTwoFactorToken(user.twoFactorSecret, token)

    if (!isTokenValid) {
      return { success: false, message: "Invalid verification code" }
    }

    // Delete temporary token
    await redis.del(`2fa:${twoFactorToken}`)

    // Create a session
    const sessionId = await createSession(user.id)

    // Set a cookie with the session ID
    cookies().set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "strict",
    })

    // Update last login
    await redis.hset(`user:${user.id}`, {
      ...user,
      lastLogin: Date.now(),
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Login successful", userId: user.id }
  } catch (error) {
    console.error("Failed to verify two-factor authentication:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Logout user
export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Logout server action called")
    const sessionId = cookies().get("sessionId")?.value

    console.log(`Session ID from cookie: ${sessionId || "none"}`)

    if (sessionId) {
      const result = await invalidateSession(sessionId)
      console.log(`Session invalidation result: ${result}`)
    }

    // Delete the cookie regardless
    cookies().delete("sessionId")
    console.log("Session cookie deleted")

    revalidatePath("/")
    return { success: true, message: "Logout successful" }
  } catch (error) {
    console.error("Failed to logout user:", error)

    // Try to delete the cookie even if there was an error
    try {
      cookies().delete("sessionId")
    } catch (cookieError) {
      console.error("Failed to delete cookie:", cookieError)
    }

    return { success: false, message: `Error: ${error.message}` }
  }
}

// Admin functions
export async function getAllUsers(): Promise<User[]> {
  try {
    console.log("getAllUsers: Starting function")

    // Get current user to verify admin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      console.log("getAllUsers: Current user is not an admin")
      return []
    }

    console.log("getAllUsers: Admin verified, fetching users")

    // Use a different approach - scan instead of keys
    // This is a safer approach that works better with Redis
    const users: User[] = []

    try {
      // Manually create some test users if none exist
      const testUsers = await redis.keys("user:*")
      console.log(`getAllUsers: Found ${testUsers ? testUsers.length : 0} user keys`)

      if (!testUsers || testUsers.length === 0) {
        console.log("getAllUsers: No users found, returning empty array")
        return []
      }

      // Process each user key
      for (const key of testUsers) {
        // Only process keys that are direct user records (not tasks, sessions, or other related data)
        if (
          typeof key === "string" &&
          key.startsWith("user:") &&
          !key.includes(":sessions") &&
          !key.includes(":tasks") &&
          key.split(":").length === 2
        ) {
          try {
            console.log(`getAllUsers: Processing user key ${key}`)
            const userData = await redis.hgetall(key)

            if (userData && Object.keys(userData).length > 0) {
              console.log(`getAllUsers: Found valid user data for ${key}`)
              users.push({
                ...userData,
                twoFactorEnabled: userData.twoFactorEnabled === "true" || userData.twoFactorEnabled === true,
                emailVerified: userData.emailVerified === "true" || userData.emailVerified === true,
                failedLoginAttempts: Number.parseInt(userData.failedLoginAttempts as string) || 0,
                createdAt: Number.parseInt(userData.createdAt as string) || 0,
              } as User)
            } else {
              console.log(`getAllUsers: No valid user data for ${key}`)
            }
          } catch (userError) {
            console.error(`getAllUsers: Error processing user ${key}:`, userError)
            // Continue with next user
          }
        }
      }
    } catch (scanError) {
      console.error("getAllUsers: Error scanning for users:", scanError)
    }

    console.log(`getAllUsers: Returning ${users.length} users`)
    return users
  } catch (error) {
    console.error("getAllUsers: Failed to get all users:", error)
    return []
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get current user to verify admin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Get user data
    const user = await getUserById(userId)
    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Delete user's sessions
    const sessionIds = await redis.smembers(`user:${userId}:sessions`)
    for (const sessionId of sessionIds) {
      await redis.del(`session:${sessionId}`)
    }
    await redis.del(`user:${userId}:sessions`)

    // Delete email mapping
    await redis.del(`email:${user.email}`)

    // Delete user data
    await redis.del(`user:${userId}`)

    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, message: "Failed to delete user" }
  }
}

export async function updateUser(
  userId: string,
  userData: Partial<User>,
): Promise<{ success: boolean; message: string }> {
  try {
    // Get current user to verify admin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Get existing user data
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      return { success: false, message: "User not found" }
    }

    // Handle email change
    if (userData.email && userData.email !== existingUser.email) {
      // Check if new email is already in use
      const existingUserId = await redis.get(`email:${userData.email}`)
      if (existingUserId && existingUserId !== userId) {
        return { success: false, message: "Email already in use" }
      }

      // Update email mapping
      await redis.del(`email:${existingUser.email}`)
      await redis.set(`email:${userData.email}`, userId)
    }

    // Handle password change
    if (userData.password) {
      userData.password = await hashPassword(userData.password)
    }

    // Update user data
    const updatedUser = {
      ...existingUser,
      ...userData,
      updatedAt: Date.now(),
    }

    await redis.hset(`user:${userId}`, updatedUser)

    return { success: true, message: "User updated successfully" }
  } catch (error) {
    console.error("Failed to update user:", error)
    return { success: false, message: "Failed to update user" }
  }
}
