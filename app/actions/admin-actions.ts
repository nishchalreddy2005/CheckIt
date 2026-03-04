"use server"

import { db } from "@/lib/db"
import { users, systemSettings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { hashPassword } from "@/lib/security-server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./user-actions"
import crypto from "crypto"

export async function getAdminSecretCode() {
  try {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, 'ADMIN_SECRET_CODE'))
    if (setting) return setting.value
  } catch (error) {
    console.error("Error fetching admin secret code from db", error)
  }
  return process.env.ADMIN_SECRET_CODE || "admin123"
}

export async function updateAdminSecretCode(newCode: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    await db.insert(systemSettings)
      .values({ key: 'ADMIN_SECRET_CODE', value: newCode, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: newCode, updatedAt: new Date() }
      })

    return { success: true, message: "Admin secret code updated successfully" }
  } catch (error) {
    console.error("Failed to update admin secret", error)
    return { success: false, message: "Failed to update admin secret code" }
  }
}

export async function registerAdmin(data: { name: string; email: string; password: string; secretCode: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const expectedSecretCode = await getAdminSecretCode()
    if (data.secretCode !== expectedSecretCode) return { success: false, error: "Invalid secret code" }

    const [existingAdmin] = await db.select().from(users).where(eq(users.email, data.email))
    if (existingAdmin) return { success: false, error: "Email already in use" }

    const hashedPassword = await hashPassword(data.password)
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      password: hashedPassword,
      createdAt: new Date(),
      isAdmin: false,
      isSuperadmin: false,
      pendingAdmin: true,
      emailVerified: true, // Auto verify for simplicity
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Registration failed." }
  }
}

export async function getPendingAdmins() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return []

    const pendingAdmins = await db.select().from(users).where(eq(users.pendingAdmin, true))
    return pendingAdmins as any[]
  } catch (error) {
    return []
  }
}

export async function approveAdmin(adminId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    await db.update(users).set({ isAdmin: true, pendingAdmin: false, updatedAt: new Date() }).where(eq(users.id, adminId))
    revalidatePath("/superadmin")
    return { success: true, message: "Admin approved successfully" }
  } catch (error) {
    return { success: false, message: "Failed to approve admin" }
  }
}

export async function rejectAdmin(adminId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    await db.update(users).set({ pendingAdmin: false, updatedAt: new Date() }).where(eq(users.id, adminId))
    revalidatePath("/superadmin")
    return { success: true, message: "Admin rejected" }
  } catch (error) {
    return { success: false, message: "Failed to reject admin" }
  }
}

export async function getAllAdmins() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return []

    const allAdmins = await db.select().from(users).where(eq(users.isAdmin, true))
    return allAdmins as any[]
  } catch (error) {
    return []
  }
}

export async function updateAdmin(adminId: string, adminData: any) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    if (adminData.password) {
      adminData.password = await hashPassword(adminData.password)
    }

    await db.update(users).set({ ...adminData, updatedAt: new Date() }).where(eq(users.id, adminId))
    revalidatePath("/superadmin")
    return { success: true, message: "Admin updated successfully" }
  } catch (error) {
    return { success: false, message: "Failed to update admin" }
  }
}

export async function deleteAdmin(adminId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    await db.delete(users).where(eq(users.id, adminId))
    revalidatePath("/superadmin")
    return { success: true, message: "Admin deleted successfully" }
  } catch (error) {
    return { success: false, message: "Failed to delete admin" }
  }
}

export async function createAdmin(adminData: any) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) return { success: false, message: "Unauthorized access" }

    const [existing] = await db.select().from(users).where(eq(users.email, adminData.email))
    if (existing) return { success: false, message: "Email already in use" }

    const hashedPassword = await hashPassword(adminData.password)
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: adminData.email,
      name: adminData.name,
      password: hashedPassword,
      createdAt: new Date(),
      isAdmin: true,
    })

    revalidatePath("/superadmin")
    return { success: true, message: "Admin created successfully" }
  } catch (error) {
    return { success: false, message: "Failed to create admin" }
  }
}
