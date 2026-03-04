"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendPasswordResetEmail, verifyToken } from "@/lib/security"
import { hashPassword } from "@/lib/security-server"

export async function requestPasswordReset(
    formData: FormData
): Promise<{ success: boolean; message: string }> {
    try {
        const email = (formData.get("email") as string)?.trim().toLowerCase()
        if (!email) {
            return { success: false, message: "Please provide an email address" }
        }

        await sendPasswordResetEmail(email)

        // Always return success to avoid leaking whether an email exists
        return {
            success: true,
            message: "If an account with that email exists, we've sent a password reset link.",
        }
    } catch (error) {
        console.error("Password reset request error:", error)
        return { success: false, message: "Something went wrong. Please try again." }
    }
}

export async function resetPassword(
    formData: FormData
): Promise<{ success: boolean; message: string }> {
    try {
        const token = formData.get("token") as string
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (!token) {
            return { success: false, message: "Invalid reset link" }
        }

        if (!password || password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters" }
        }

        if (password !== confirmPassword) {
            return { success: false, message: "Passwords do not match" }
        }

        const decoded = await verifyToken(token)
        if (!decoded) {
            return { success: false, message: "This reset link has expired or is invalid. Please request a new one." }
        }

        const [user] = await db.select().from(users).where(eq(users.id, decoded.userId))
        if (!user) {
            return { success: false, message: "User not found" }
        }

        // verify token matches what's stored
        if (user.verificationToken !== token) {
            return { success: false, message: "This reset link has already been used." }
        }

        // Check expiry
        if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt.getTime() < Date.now()) {
            return { success: false, message: "This reset link has expired. Please request a new one." }
        }

        const hashedPassword = await hashPassword(password)

        await db.update(users).set({
            password: hashedPassword,
            verificationToken: null,
            verificationTokenExpiresAt: null,
            updatedAt: new Date(),
        }).where(eq(users.id, user.id))

        return {
            success: true,
            message: "Password reset successfully! You can now log in with your new password.",
        }
    } catch (error) {
        console.error("Password reset error:", error)
        return { success: false, message: "Something went wrong. Please try again." }
    }
}
