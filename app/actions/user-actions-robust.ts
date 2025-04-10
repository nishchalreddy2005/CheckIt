"use server"

import { redis } from "@/lib/redis"
import type { User } from "@/lib/types"
import { cookies } from "next/headers"
import { validateSession } from "@/lib/security"

// Get current user with better error handling
export async function getRobustCurrentUser(): Promise<User | null> {
  try {
    const sessionId = cookies().get("sessionId")?.value
    if (!sessionId) {
      console.log("No session ID found in cookies")
      return null
    }

    console.log(`Getting user for session: ${sessionId}`)

    // Validate session with try/catch
    let userId: string | undefined
    try {
      const sessionResult = await validateSession(sessionId)
      if (!sessionResult.valid || !sessionResult.userId) {
        console.log("Invalid session, clearing cookie")
        cookies().delete("sessionId")
        return null
      }
      userId = sessionResult.userId
    } catch (sessionError) {
      console.error("Session validation error:", sessionError)
      // Continue with null user
      return null
    }

    if (!userId) {
      console.log("No user ID found in session")
      return null
    }

    console.log(`Getting user data for ID: ${userId}`)

    // Get user data with try/catch
    try {
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
    } catch (userError) {
      console.error("Error getting user data:", userError)
      return null
    }
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}
