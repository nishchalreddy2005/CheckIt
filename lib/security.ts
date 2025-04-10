import bcrypt from "bcryptjs"
import { redis } from "./redis"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import { RateLimiter } from "limiter"
import type { User } from "./types"
import { SignJWT, jwtVerify } from "jose"

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const SESSION_TIMEOUT = Number.parseInt(process.env.SESSION_TIMEOUT || "3600", 10) // 1 hour in seconds

// Convert string to Uint8Array for jose
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET)
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12) // 12 rounds is a good balance between security and performance
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT token generation and verification using jose instead of jsonwebtoken
export async function generateToken(userId: string, expiresIn = "1h"): Promise<string> {
  try {
    const expirationTime = expiresIn === "24h" ? "24h" : "1h"

    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(getSecretKey())

    return token
  } catch (error) {
    console.error("Token generation failed:", error)
    throw new Error("Failed to generate token")
  }
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return { userId: payload.userId as string }
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Email verification with EmailJS
export async function sendVerificationEmail(user: User, newEmail: string): Promise<boolean> {
  try {
    // Generate a verification token
    const token = await generateToken(user.id, "24h")

    // Store the token and new email in Redis
    await redis.hset(`email-verification:${token}`, {
      userId: user.id,
      newEmail,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })

    // Create a verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

    // The actual email sending will be handled by the client-side EmailJS integration
    // We'll store the verification data for the frontend to access
    await redis.set(
      `pending-verification:${user.id}`,
      JSON.stringify({
        email: newEmail,
        verificationLink,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }),
      { ex: 86400 },
    ) // 24 hours

    return true
  } catch (error) {
    console.error("Failed to prepare verification email:", error)
    return false
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Verify the token
    const decoded = await verifyToken(token)
    if (!decoded) {
      return { success: false, message: "Invalid verification token" }
    }

    // Get verification data from Redis
    const verification = await redis.hgetall(`email-verification:${token}`)

    if (!verification || !verification.userId || !verification.newEmail) {
      return { success: false, message: "Invalid verification token" }
    }

    // Check if token is expired
    if (Number.parseInt(verification.expiresAt as string, 10) < Date.now()) {
      await redis.del(`email-verification:${token}`)
      return { success: false, message: "Verification token has expired" }
    }

    // Get user
    const user = await redis.hgetall(`user:${verification.userId}`)
    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Update email
    const oldEmail = user.email

    // Update user data
    await redis.hset(`user:${verification.userId}`, {
      ...user,
      email: verification.newEmail,
      emailVerified: true,
      updatedAt: Date.now(),
    })

    // Update email mapping
    await redis.del(`email:${oldEmail}`)
    await redis.set(`email:${verification.newEmail}`, verification.userId)

    // Delete verification token
    await redis.del(`email-verification:${token}`)

    return {
      success: true,
      message: "Email verified successfully",
      userId: verification.userId as string,
    }
  } catch (error) {
    console.error("Failed to verify email:", error)
    return { success: false, message: "Failed to verify email" }
  }
}

// Two-factor authentication
export function generateTwoFactorSecret(
  userId: string,
): Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Generate a secret
      const secret = speakeasy.generateSecret({
        name: `CheckIt:${userId}`,
      })

      // Generate QR code
      QRCode.toDataURL(secret.otpauth_url || "", (err, qrCodeUrl) => {
        if (err) {
          reject(err)
          return
        }

        resolve({
          secret: secret.base32,
          otpAuthUrl: secret.otpauth_url || "",
          qrCodeUrl,
        })
      })
    } catch (error) {
      reject(error)
    }
  })
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  })
}

// Session management
export async function createSession(userId: string): Promise<string> {
  try {
    console.log(`Creating session for user: ${userId}`)
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    const sessionData = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TIMEOUT * 1000,
    }

    console.log(`Session data:`, sessionData)

    // Store session data
    await redis.hset(`session:${sessionId}`, sessionData)

    // Add session to user's sessions
    await redis.sadd(`user:${userId}:sessions`, sessionId)
    console.log(`Session added to user's sessions`)

    return sessionId
  } catch (error) {
    console.error("Failed to create session:", error)
    // Instead of throwing, return a fallback session ID
    // This ensures the function always returns a string
    return `fallback-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

export async function validateSession(sessionId: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    console.log(`Validating session: ${sessionId}`)

    if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
      console.log("Invalid session ID format")
      return { valid: false }
    }

    const session = await redis.hgetall(`session:${sessionId}`)

    if (!session || !session.userId || Object.keys(session).length === 0) {
      console.log("Session not found or missing userId")
      return { valid: false }
    }

    console.log(`Session found for user: ${session.userId}`)

    // Check if session is expired
    const expiresAt = Number.parseInt(session.expiresAt as string, 10)
    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      console.log(`Session expired at: ${new Date(expiresAt).toLocaleTimeString()}`)
      try {
        await redis.del(`session:${sessionId}`)
        // Check if session.userId is a string before using it
        if (session.userId && typeof session.userId === "string") {
          await redis.srem(`user:${session.userId}:sessions`, sessionId)
        }
      } catch (cleanupError) {
        console.error("Error cleaning up expired session:", cleanupError)
        // Continue even if cleanup fails
      }
      return { valid: false }
    }

    // Extend session
    try {
      await redis.hset(`session:${sessionId}`, {
        ...session,
        expiresAt: Date.now() + SESSION_TIMEOUT * 1000,
      })
      console.log("Session extended")
    } catch (updateError) {
      console.error("Error extending session:", updateError)
      // Continue even if extension fails
    }

    return { valid: true, userId: session.userId as string }
  } catch (error) {
    console.error("Failed to validate session:", error)
    return { valid: false }
  }
}

export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    console.log(`Invalidating session: ${sessionId}`)

    // Get the session data first
    const session = await redis.hgetall(`session:${sessionId}`)
    console.log(`Session data:`, session)

    // If we have a userId, remove the session from the user's sessions set
    if (session && session.userId) {
      console.log(`Removing session from user's sessions: ${session.userId}`)
      await redis.srem(`user:${session.userId}:sessions`, sessionId)
    }

    // Delete the session data
    console.log(`Deleting session data`)
    await redis.del(`session:${sessionId}`)

    return true
  } catch (error) {
    console.error("Failed to invalidate session:", error)
    return false
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<boolean> {
  try {
    const sessionIds = await redis.smembers(`user:${userId}:sessions`)

    for (const sessionId of sessionIds) {
      await redis.del(`session:${sessionId}`)
    }

    await redis.del(`user:${userId}:sessions`)

    return true
  } catch (error) {
    console.error("Failed to invalidate all user sessions:", error)
    return false
  }
}

// Rate limiting
const rateLimiters: Record<string, RateLimiter> = {
  login: new RateLimiter({ tokensPerInterval: 5, interval: "minute" }),
  passwordReset: new RateLimiter({ tokensPerInterval: 3, interval: "hour" }),
  profileUpdate: new RateLimiter({ tokensPerInterval: 10, interval: "hour" }),
  emailVerification: new RateLimiter({ tokensPerInterval: 3, interval: "hour" }),
}

export async function checkRateLimit(
  key: string,
  action: "login" | "passwordReset" | "profileUpdate" | "emailVerification",
): Promise<{ success: boolean; message?: string }> {
  try {
    const limiter = rateLimiters[action]

    if (!limiter) {
      return { success: true }
    }

    // Check if user has tokens left
    const hasTokens = await limiter.tryRemoveTokens(1)

    if (!hasTokens) {
      return {
        success: false,
        message: `Too many ${action} attempts. Please try again later.`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error(`Rate limit check failed for ${key}:${action}:`, error)
    return { success: true } // Fail open to prevent blocking legitimate users
  }
}
