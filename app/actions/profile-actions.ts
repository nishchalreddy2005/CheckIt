"use server"

import { redis } from "@/lib/redis"
import type { User } from "@/lib/types"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import {
  hashPassword,
  verifyPassword,
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  invalidateAllUserSessions,
  checkRateLimit,
} from "@/lib/security"
import { headers } from "next/headers"
import { uploadProfilePicture as uploadProfilePictureAction } from "./profile-actions-upload"

// Update user profile (Update operation)
export async function updateProfile(formData: FormData): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile" }
    }

    // Check rate limit
    const ipAddress = headers().get("x-forwarded-for") || "unknown"
    const rateLimitCheck = await checkRateLimit(`user:${currentUser.id}:${ipAddress}`, "profileUpdate")
    if (!rateLimitCheck.success) {
      return { success: false, message: rateLimitCheck.message || "Too many update attempts" }
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const bio = formData.get("bio") as string
    const theme = formData.get("theme") as string
    const language = formData.get("language") as string
    const timezone = formData.get("timezone") as string

    // Validate input
    if (!name || !email) {
      return { success: false, message: "Name and email are required" }
    }

    // Check if email is being changed
    if (email !== currentUser.email) {
      // Check if the new email is already in use
      const existingUserId = await redis.get(`email:${email}`)
      if (existingUserId && existingUserId !== currentUser.id) {
        return { success: false, message: "Email is already in use" }
      }

      // Update email mapping in Redis
      await redis.del(`email:${currentUser.email}`)
      await redis.set(`email:${email}`, currentUser.id)
    }

    // Update user data
    const updatedUser: User = {
      ...currentUser,
      name,
      email,
      bio: bio || "",
      theme: theme || "light",
      language: language || "en",
      timezone: timezone || "UTC",
      calendarBackground: (formData.get("calendarBackground") as string) || currentUser.calendarBackground,
      updatedAt: Date.now(),
    }

    // Create a clean user object without any null/undefined values
    const cleanUserData = { ...updatedUser }
    Object.keys(cleanUserData).forEach((key) => {
      if (cleanUserData[key] === null || cleanUserData[key] === undefined) {
        delete cleanUserData[key]
      }
    })

    // Save the cleaned data to Redis
    await redis.hset(`user:${currentUser.id}`, cleanUserData)

    // Revalidate all relevant paths
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")

    return { success: true, message: "Profile updated successfully", user: updatedUser }
  } catch (error) {
    console.error("Failed to update profile:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Get user profile (Read operation)
export async function getProfile(): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to view your profile" }
    }

    return { success: true, message: "Profile retrieved successfully", user: currentUser }
  } catch (error) {
    console.error("Failed to get profile:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Delete user account (Delete operation)
export async function deleteAccount(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to delete your account" }
    }

    // Verify password for sensitive operation
    const password = formData.get("password") as string

    if (!password) {
      return { success: false, message: "Password is required to delete your account" }
    }

    const isPasswordValid = await verifyPassword(password, currentUser.password || "")

    if (!isPasswordValid) {
      return { success: false, message: "Incorrect password" }
    }

    // Get all tasks for the user
    const taskIds = await redis.smembers(`user:${currentUser.id}:tasks`)

    // Delete all tasks
    for (const taskId of taskIds) {
      await redis.del(`task:${taskId}`)
    }

    // Delete task set
    await redis.del(`user:${currentUser.id}:tasks`)

    // Delete email mapping
    await redis.del(`email:${currentUser.email}`)

    // Invalidate all sessions
    await invalidateAllUserSessions(currentUser.id)

    // Delete user data
    await redis.del(`user:${currentUser.id}`)

    // Clear authentication cookie
    cookies().delete("sessionId")

    return { success: true, message: "Account deleted successfully" }
  } catch (error) {
    console.error("Failed to delete account:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Change password (Update operation) - No password verification required
export async function changePassword(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to change your password" }
    }

    // Check rate limit
    const ipAddress = headers().get("x-forwarded-for") || "unknown"
    const rateLimitCheck = await checkRateLimit(`user:${currentUser.id}:${ipAddress}`, "passwordReset")
    if (!rateLimitCheck.success) {
      return { success: false, message: rateLimitCheck.message || "Too many password change attempts" }
    }

    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate input
    if (!newPassword || !confirmPassword) {
      return { success: false, message: "New password and confirmation are required" }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New passwords do not match" }
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user data
    const updatedUser = {
      ...currentUser,
      password: hashedPassword,
      updatedAt: Date.now(),
    }

    // Create a clean user object without any null/undefined values
    const cleanUserData = { ...updatedUser }
    Object.keys(cleanUserData).forEach((key) => {
      if (cleanUserData[key] === null || cleanUserData[key] === undefined) {
        delete cleanUserData[key]
      }
    })

    // Save the cleaned data to Redis
    await redis.hset(`user:${currentUser.id}`, cleanUserData)

    // Get the current session ID
    const currentSessionId = cookies().get("sessionId")?.value

    // Skip session invalidation if there's no current session
    if (!currentSessionId) {
      return { success: true, message: "Password changed successfully" }
    }

    try {
      // Get all sessions for the user
      const sessionsResult = await redis.smembers(`user:${currentUser.id}:sessions`)

      // If sessions is not an array or is empty, skip invalidation
      if (!sessionsResult || typeof sessionsResult.forEach !== "function") {
        console.log("No sessions to invalidate or sessions is not iterable")
        return { success: true, message: "Password changed successfully" }
      }

      // Invalidate all other sessions one by one
      for (let i = 0; i < sessionsResult.length; i++) {
        const sessionId = sessionsResult[i]
        if (sessionId && sessionId !== currentSessionId) {
          try {
            await redis.del(`session:${sessionId}`)
            await redis.srem(`user:${currentUser.id}:sessions`, sessionId)
          } catch (sessionError) {
            console.error(`Error invalidating session ${sessionId}:`, sessionError)
            // Continue with other sessions even if one fails
          }
        }
      }
    } catch (sessionError) {
      console.error("Error during session invalidation:", sessionError)
      // Continue even if session invalidation fails
    }

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Failed to change password:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Enable two-factor authentication
export async function enableTwoFactor(): Promise<{
  success: boolean
  message: string
  secret?: string
  qrCodeUrl?: string
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to enable two-factor authentication" }
    }

    // Generate 2FA secret
    const { secret, otpAuthUrl, qrCodeUrl } = await generateTwoFactorSecret(currentUser.id)

    // Store secret temporarily
    await redis.set(`2fa-setup:${currentUser.id}`, secret, { ex: 600 }) // 10 minutes

    return {
      success: true,
      message: "Scan the QR code with your authenticator app",
      secret,
      qrCodeUrl,
    }
  } catch (error) {
    console.error("Failed to enable two-factor authentication:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Verify and complete two-factor setup
export async function verifyTwoFactorSetup(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to complete two-factor setup" }
    }

    const token = formData.get("token") as string

    if (!token) {
      return { success: false, message: "Verification code is required" }
    }

    // Get temporary secret
    const secret = await redis.get(`2fa-setup:${currentUser.id}`)

    if (!secret) {
      return { success: false, message: "Setup session expired. Please try again." }
    }

    // Verify token
    const isTokenValid = verifyTwoFactorToken(secret as string, token)

    if (!isTokenValid) {
      return { success: false, message: "Invalid verification code" }
    }

    // Update user with 2FA enabled
    const updatedUser = {
      ...currentUser,
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      updatedAt: Date.now(),
    }

    // Create a clean user object without any null/undefined values
    const cleanUserData = { ...updatedUser }
    Object.keys(cleanUserData).forEach((key) => {
      if (cleanUserData[key] === null || cleanUserData[key] === undefined) {
        delete cleanUserData[key]
      }
    })

    // Save the cleaned data to Redis
    await redis.hset(`user:${currentUser.id}`, cleanUserData)

    // Delete temporary secret
    await redis.del(`2fa-setup:${currentUser.id}`)

    return { success: true, message: "Two-factor authentication enabled successfully" }
  } catch (error) {
    console.error("Failed to verify two-factor setup:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Disable two-factor authentication - No password verification required
export async function disableTwoFactor(): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to disable two-factor authentication" }
    }

    // Update user with 2FA disabled
    const updatedUser = {
      ...currentUser,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      updatedAt: Date.now(),
    }

    // Create a clean user object without any null/undefined values
    const cleanUserData = { ...updatedUser }
    Object.keys(cleanUserData).forEach((key) => {
      if (cleanUserData[key] === null || cleanUserData[key] === undefined) {
        delete cleanUserData[key]
      }
    })

    // Save the cleaned data to Redis
    await redis.hset(`user:${currentUser.id}`, cleanUserData)

    return { success: true, message: "Two-factor authentication disabled successfully" }
  } catch (error) {
    console.error("Failed to disable two-factor authentication:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Get user stats
export async function getUserStats(userId: string): Promise<{
  taskCount: number
  completedTasks: number
  categories: string[]
}> {
  try {
    // Initialize default values
    let taskIds = []

    try {
      // Get task IDs from Redis
      const result = await redis.smembers(`user:${userId}:tasks`)

      // Ensure we have an array
      if (result) {
        // Check if result is already an array
        if (Array.isArray(result)) {
          taskIds = result
        }
        // If it's not an array but has length property, convert to array
        else if (result && typeof result === "object") {
          taskIds = Object.values(result)
        }
        // If it's a single value, wrap in array
        else if (result) {
          taskIds = [result]
        }
      }
    } catch (error) {
      console.error("Error fetching task IDs:", error)
      // Continue with empty array
    }

    let completedCount = 0
    const categorySet = new Set<string>()

    // Process each task
    for (let i = 0; i < taskIds.length; i++) {
      try {
        const taskId = taskIds[i]
        if (!taskId) continue

        const task = await redis.hgetall(`task:${taskId}`)

        if (task) {
          // Check if task is completed
          if (task.completed === "true" || task.completed === true) {
            completedCount++
          }

          // Add category if it exists
          if (task.category) {
            categorySet.add(task.category as string)
          }
        }
      } catch (taskError) {
        console.error(`Error processing task:`, taskError)
        // Continue with next task
      }
    }

    return {
      taskCount: taskIds.length,
      completedTasks: completedCount,
      categories: Array.from(categorySet),
    }
  } catch (error) {
    console.error("Failed to get user stats:", error)
    return { taskCount: 0, completedTasks: 0, categories: [] }
  }
}

// Get user active sessions
export async function getUserSessions(): Promise<{
  success: boolean
  message: string
  sessions?: Array<{
    id: string
    createdAt: number
    userAgent?: string
    ipAddress?: string
    current: boolean
  }>
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to view your sessions" }
    }

    const currentSessionId = cookies().get("sessionId")?.value
    let sessionIds = []

    try {
      sessionIds = (await redis.smembers(`user:${currentUser.id}:sessions`)) || []
    } catch (error) {
      console.error("Error fetching session IDs:", error)
      return { success: true, message: "No active sessions found", sessions: [] }
    }

    // Make sure sessionIds is an array-like object
    if (!sessionIds || typeof sessionIds.length !== "number") {
      return { success: true, message: "No active sessions found", sessions: [] }
    }

    const sessions = []
    for (let i = 0; i < sessionIds.length; i++) {
      try {
        const id = sessionIds[i]
        const session = await redis.hgetall(`session:${id}`)
        if (session) {
          sessions.push({
            id,
            createdAt: Number.parseInt(session.createdAt as string, 10) || Date.now(),
            userAgent: session.userAgent as string,
            ipAddress: session.ipAddress as string,
            current: id === currentSessionId,
          })
        }
      } catch (error) {
        console.error(`Error processing session ${sessionIds[i]}:`, error)
        // Continue with other sessions
      }
    }

    return {
      success: true,
      message: "Sessions retrieved successfully",
      sessions: sessions.sort((a, b) => b.createdAt - a.createdAt),
    }
  } catch (error) {
    console.error("Failed to get user sessions:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Revoke a specific session
export async function revokeSession(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to revoke a session" }
    }

    const sessionId = formData.get("sessionId") as string
    const currentSessionId = cookies().get("sessionId")?.value

    if (!sessionId) {
      return { success: false, message: "Session ID is required" }
    }

    // Check if trying to revoke current session
    if (sessionId === currentSessionId) {
      return { success: false, message: "Cannot revoke your current session" }
    }

    // Check if session belongs to user
    const isMember = await redis.sismember(`user:${currentUser.id}:sessions`, sessionId)

    if (!isMember) {
      return { success: false, message: "Session not found or does not belong to you" }
    }

    // Delete session
    await redis.del(`session:${sessionId}`)
    await redis.srem(`user:${currentUser.id}:sessions`, sessionId)

    return { success: true, message: "Session revoked successfully" }
  } catch (error) {
    console.error("Failed to revoke session:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Also add a new function to specifically update the calendar background
export async function updateCalendarBackground(
  backgroundUrl: string,
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // Validate the input
    if (!backgroundUrl || backgroundUrl.trim() === "") {
      return { success: false, message: "Background URL cannot be empty" }
    }

    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your settings" }
    }

    // Create a clean user object without any null/undefined values
    const updatedUser: Partial<User> = {
      ...currentUser,
      calendarBackground: backgroundUrl,
      updatedAt: Date.now(),
    }

    // Remove any null or undefined values
    Object.keys(updatedUser).forEach((key) => {
      if (updatedUser[key] === null || updatedUser[key] === undefined) {
        delete updatedUser[key]
      }
    })

    // Save to Redis
    await redis.hset(`user:${currentUser.id}`, updatedUser)

    // Revalidate paths
    revalidatePath("/calendar")
    revalidatePath("/settings")

    return {
      success: true,
      message: "Calendar background updated successfully",
      user: { ...currentUser, ...updatedUser } as User,
    }
  } catch (error) {
    console.error("Failed to update calendar background:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// At the end of the file, add this import and export
import { deleteProfilePicture as deleteProfilePictureAction } from "./profile-actions-delete"

// Export the profile picture upload and delete functions
export const uploadProfilePicture = uploadProfilePictureAction
export const deleteProfilePicture = deleteProfilePictureAction
