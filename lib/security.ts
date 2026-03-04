// No bcrypt here
import { db } from "./db"
import { users, sessions } from "./db/schema"
import { eq } from "drizzle-orm"
import QRCode from "qrcode"
import type { User } from "./types"
import { SignJWT, jwtVerify } from "jose"
// NOTE: mailer is imported dynamically inside email functions
// to avoid bundling nodemailer into Edge middleware runtime

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const SESSION_TIMEOUT = Number.parseInt(process.env.SESSION_TIMEOUT || "3600", 10) // 1 hour in seconds

// Convert string to Uint8Array for jose
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET)
}

// Password hashing moved to security-server.ts

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

// Email verification — actually sends the email via SMTP
export async function sendVerificationEmail(user: User, newEmail: string): Promise<boolean> {
  try {
    const token = await generateToken(user.id, "24h")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.update(users)
      .set({
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
        pendingNewEmail: newEmail
      })
      .where(eq(users.id, user.id))

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verificationLink = `${appUrl}/verify-email?token=${token}`

    const { sendMail, emailTemplate } = await import("./mailer")
    const html = emailTemplate(
      "Verify Your Email Address",
      `<p style="color:#e2e8f0;">Hi <strong>${user.name}</strong>,</p>
       <p>You've requested to change your email address to <strong style="color:#818cf8;">${newEmail}</strong>.</p>
       <p>Please click the button below to verify this new email address. This link will expire in <strong>24 hours</strong>.</p>`,
      "Verify Email",
      verificationLink
    )

    const sent = await sendMail({
      to: newEmail,
      subject: "Verify your email — CheckIt",
      html,
    })

    if (!sent) {
      console.error("Failed to send verification email")
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to prepare verification email:", error)
    return false
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user) {
      // Return true anyway to not leak whether an email exists
      return true
    }

    const token = await generateToken(user.id, "1h")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.update(users)
      .set({
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id))

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${appUrl}/reset-password?token=${token}`

    const { sendMail, emailTemplate } = await import("./mailer")
    const html = emailTemplate(
      "Reset Your Password",
      `<p style="color:#e2e8f0;">Hi <strong>${user.name}</strong>,</p>
       <p>We received a request to reset your password for your CheckIt account.</p>
       <p>Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.</p>
       <p style="color:#64748b;font-size:13px;">If you didn't request a password reset, you can safely ignore this email.</p>`,
      "Reset Password",
      resetLink
    )

    await sendMail({
      to: email,
      subject: "Reset your password — CheckIt",
      html,
    })

    return true
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return false
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const decoded = await verifyToken(token)
    if (!decoded) {
      return { success: false, message: "Invalid verification token" }
    }

    const [user] = await db.select().from(users).where(eq(users.verificationToken, token))

    if (!user || !user.pendingNewEmail || !user.verificationTokenExpiresAt) {
      return { success: false, message: "Invalid verification token" }
    }

    if (user.verificationTokenExpiresAt.getTime() < Date.now()) {
      await db.update(users).set({ verificationToken: null, verificationTokenExpiresAt: null, pendingNewEmail: null }).where(eq(users.id, user.id))
      return { success: false, message: "Verification token has expired" }
    }

    await db.update(users).set({
      email: user.pendingNewEmail,
      emailVerified: true,
      updatedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
      pendingNewEmail: null
    }).where(eq(users.id, user.id))

    return {
      success: true,
      message: "Email verified successfully",
      userId: user.id,
    }
  } catch (error) {
    console.error("Failed to verify email:", error)
    return { success: false, message: "Failed to verify email" }
  }
}

// Removed Two-factor authentication (Moved to security-server.ts for Node.js runtime)

export async function createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
  try {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT * 1000),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null
    })

    return sessionId
  } catch (error) {
    console.error("Failed to create session:", error)
    return `fallback-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

export async function validateSession(sessionId: string): Promise<{ valid: boolean; userId?: string; isAdmin?: boolean; isSuperadmin?: boolean }> {
  try {
    if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
      return { valid: false }
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))

    if (!session || !session.userId) {
      return { valid: false }
    }

    const now = Date.now()
    const expiresAt = session.expiresAt.getTime()

    if (isNaN(expiresAt) || expiresAt < now) {
      try {
        await db.delete(sessions).where(eq(sessions.id, sessionId))
      } catch (cleanupError) {
        console.error("Error cleaning up expired session:", cleanupError)
      }
      return { valid: false }
    }

    // Identify user roles sequentially instead of using leftJoin to prevent Edge runtime mapping bugs
    let isAdmin = false
    let isSuperadmin = false
    try {
      const [user] = await db.select({
        isAdmin: users.isAdmin,
        isSuperadmin: users.isSuperadmin
      }).from(users).where(eq(users.id, session.userId))

      console.log("DB select result in validateSession:", user)

      if (user) {
        isAdmin = user.isAdmin ?? false
        isSuperadmin = user.isSuperadmin ?? false
      }
    } catch (e) {
      console.error("Failed to fetch user roles in validateSession", e)
    }

    // Only update DB if session has less than half its life left
    // This prevents writing to DB on every single request
    const timeUntilExpiry = expiresAt - now
    const halfTimeout = (SESSION_TIMEOUT / 2) * 1000

    if (timeUntilExpiry < halfTimeout) {
      try {
        await db.update(sessions)
          .set({ expiresAt: new Date(now + SESSION_TIMEOUT * 1000) })
          .where(eq(sessions.id, sessionId))
      } catch (updateError) {
        console.error("Error extending session:", updateError)
      }
    }

    return {
      valid: true,
      userId: session.userId,
      isAdmin,
      isSuperadmin
    }
  } catch (error) {
    console.error("Failed to validate session:", error)
    return { valid: false }
  }
}

export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return true
  } catch (error) {
    console.error("Failed to invalidate session:", error)
    return false
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.userId, userId))
    return true
  } catch (error) {
    console.error("Failed to invalidate all user sessions:", error)
    return false
  }
}

// Rate limiting (To be implemented with Vercel KV / Redis for Serverless compatibility)
export async function checkRateLimit(
  key: string,
  action: "login" | "passwordReset" | "profileUpdate" | "emailVerification",
): Promise<{ success: boolean; message?: string }> {
  // Currently disabled in Edge runtime. In memory limiters fail across distributed serverless nodes.
  return { success: true }
}
