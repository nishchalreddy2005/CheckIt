"use server"

import { redis } from "@/lib/redis"
import type { User } from "@/lib/types"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createSession, invalidateSession } from "@/lib/security"
import { verifyTwoFactorToken } from "@/lib/security"

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
