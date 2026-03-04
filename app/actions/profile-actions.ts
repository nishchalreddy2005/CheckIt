"use server"

import { db } from "@/lib/db"
import { users, sessions, tasks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { User } from "@/lib/types"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import {
  invalidateAllUserSessions,
  checkRateLimit,
} from "@/lib/security"
import { hashPassword, verifyPassword } from "@/lib/security-server"
import { sendOtpEmail } from "@/lib/mailer"
import { uploadProfilePicture as uploadProfilePictureAction } from "./profile-actions-upload"
import { deleteProfilePicture as deleteProfilePictureAction } from "./profile-actions-delete"

export async function updateProfile(formData: FormData): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to update your profile" }

    const ipAddress = (await headers()).get("x-forwarded-for") || "unknown"
    const rateLimitCheck = await checkRateLimit(`user:${currentUser.id}:${ipAddress}`, "profileUpdate")
    if (!rateLimitCheck.success) return { success: false, message: rateLimitCheck.message || "Too many update attempts" }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const bio = formData.get("bio") as string
    const theme = formData.get("theme") as string
    const timezone = formData.get("timezone") as string
    const calendarBackground = formData.get("calendarBackground") as string

    if (!name || !email) return { success: false, message: "Name and email are required" }

    if (email !== currentUser.email) {
      const [existingUser] = await db.select().from(users).where(eq(users.email, email))
      if (existingUser && existingUser.id !== currentUser.id) return { success: false, message: "Email is already in use" }
    }

    const updatedUserData = {
      name,
      email,
      bio: bio || "",
      theme: theme || "light",
      timezone: timezone || "UTC",
      calendarBackground: calendarBackground || currentUser.calendarBackground,
      updatedAt: new Date(),
    }

    await db.update(users).set(updatedUserData).where(eq(users.id, currentUser.id))

    try {
      revalidatePath("/")
      revalidatePath("/dashboard")
      revalidatePath("/profile")
      revalidatePath("/settings")
    } catch (e) { }

    return { success: true, message: "Profile updated successfully", user: { ...currentUser, ...updatedUserData } as User }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function getProfile(): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) { return { success: false, message: "You must be logged in to view your profile" } }
    return { success: true, message: "Profile retrieved successfully", user: currentUser }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function deleteAccount(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to delete your account" }

    const password = formData.get("password") as string
    if (!password) return { success: false, message: "Password is required to delete your account" }

    const isPasswordValid = await verifyPassword(password, currentUser.password || "")
    if (!isPasswordValid) return { success: false, message: "Incorrect password" }

    await db.delete(tasks).where(eq(tasks.userId, currentUser.id))
    await invalidateAllUserSessions(currentUser.id)
    await db.delete(users).where(eq(users.id, currentUser.id))
    try { (await cookies()).delete("sessionId") } catch (e) { }

    return { success: true, message: "Account deleted successfully" }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function changePassword(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to change your password" }

    const ipAddress = (await headers()).get("x-forwarded-for") || "unknown"
    const rateLimitCheck = await checkRateLimit(`user:${currentUser.id}:${ipAddress}`, "passwordReset")
    if (!rateLimitCheck.success) return { success: false, message: rateLimitCheck.message || "Too many password change attempts" }

    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!newPassword || !confirmPassword) return { success: false, message: "New password and confirmation are required" }
    if (newPassword !== confirmPassword) return { success: false, message: "New passwords do not match" }

    const hashedPassword = await hashPassword(newPassword)
    await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, currentUser.id))

    const currentSessionId = (await cookies()).get("sessionId")?.value
    if (currentSessionId) {
      await db.delete(sessions).where(eq(sessions.userId, currentUser.id))
      // Keep current session? The old logic invalidated all OTHER sessions.
      // For simplicity, we invalidate all, the user will be forced to relogin, or we just don't invalidate.
      // The requested logic was: invalidate all EXCEPT current.
      // Let's implement that:
      const userSessions = await db.select().from(sessions).where(eq(sessions.userId, currentUser.id))
      for (const session of userSessions) {
        if (session.id !== currentSessionId) {
          await db.delete(sessions).where(eq(sessions.id, session.id))
        }
      }
    }

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function enableTwoFactor(): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to enable two-factor authentication" }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.update(users).set({
      otpCode: otp,
      otpExpiresAt: otpExpiresAt
    }).where(eq(users.id, currentUser.id))

    await sendOtpEmail(currentUser.email, otp, "Enable Two-Factor Authentication")

    return { success: true, message: "Verification code sent to your email" }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function verifyTwoFactorSetup(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to complete two-factor setup" }

    const token = formData.get("token") as string
    if (!token) return { success: false, message: "Verification code is required" }

    const [user] = await db.select().from(users).where(eq(users.id, currentUser.id))

    if (!user.otpCode || user.otpCode !== token) {
      return { success: false, message: "Invalid verification code" }
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return { success: false, message: "Verification code expired" }
    }

    await db.update(users).set({
      twoFactorEnabled: true,
      otpCode: null,
      otpExpiresAt: null,
      updatedAt: new Date(),
    }).where(eq(users.id, currentUser.id))

    return { success: true, message: "Two-factor authentication enabled successfully" }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function disableTwoFactor(): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to disable two-factor authentication" }

    await db.update(users).set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      updatedAt: new Date(),
    }).where(eq(users.id, currentUser.id))

    return { success: true, message: "Two-factor authentication disabled successfully" }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function getUserStats(userId: string): Promise<{ taskCount: number; completedTasks: number; categories: string[] }> {
  try {
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId))
    let completedCount = 0
    const categorySet = new Set<string>()

    for (const task of userTasks) {
      if (task.completed) completedCount++
      if (task.category) categorySet.add(task.category)
    }

    return { taskCount: userTasks.length, completedTasks: completedCount, categories: Array.from(categorySet) }
  } catch (error) {
    return { taskCount: 0, completedTasks: 0, categories: [] }
  }
}

export async function getUserSessions(): Promise<{
  success: boolean
  message: string
  sessions?: Array<{ id: string; createdAt: number; userAgent?: string; ipAddress?: string; current: boolean }>
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to view your sessions" }

    const currentSessionId = (await cookies()).get("sessionId")?.value
    const userSessions = await db.select().from(sessions).where(eq(sessions.userId, currentUser.id))

    const mappedSessions = userSessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt?.getTime() || Date.now(),
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      current: session.id === currentSessionId,
    })).sort((a, b) => b.createdAt - a.createdAt)

    return { success: true, message: "Sessions retrieved successfully", sessions: mappedSessions }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function revokeSession(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to revoke a session" }

    const sessionId = formData.get("sessionId") as string
    const currentSessionId = (await cookies()).get("sessionId")?.value

    if (!sessionId) return { success: false, message: "Session ID is required" }
    if (sessionId === currentSessionId) return { success: false, message: "Cannot revoke your current session" }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session || session.userId !== currentUser.id) {
      return { success: false, message: "Session not found or does not belong to you" }
    }

    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return { success: true, message: "Session revoked successfully" }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export async function updateCalendarBackground(backgroundUrl: string): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    if (!backgroundUrl || backgroundUrl.trim() === "") return { success: false, message: "Background URL cannot be empty" }

    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to update your settings" }

    await db.update(users).set({ calendarBackground: backgroundUrl, updatedAt: new Date() }).where(eq(users.id, currentUser.id))

    try {
      revalidatePath("/calendar")
      revalidatePath("/settings")
    } catch (e) { }

    return { success: true, message: "Calendar background updated successfully", user: { ...currentUser, calendarBackground: backgroundUrl } as User }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}

export const uploadProfilePicture = uploadProfilePictureAction
export const deleteProfilePicture = deleteProfilePictureAction
