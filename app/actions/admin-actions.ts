"use server"

import { redis, generateId } from "@/lib/redis"
import { hashPassword } from "@/lib/security"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./user-actions"

// Get the admin secret code (from Redis or environment variable)
export async function getAdminSecretCode() {
  try {
    // Try to get the code from Redis first
    const secretCode = await redis.get("admin:secret-code")

    // If not found in Redis, use the environment variable
    if (!secretCode) {
      return process.env.ADMIN_SECRET_CODE || "admin123"
    }

    return secretCode
  } catch (error) {
    console.error("Error getting admin secret code:", error)
    // Fall back to environment variable
    return process.env.ADMIN_SECRET_CODE || "admin123"
  }
}

// Update the admin secret code (superadmin only)
export async function updateAdminSecretCode(newCode: string) {
  try {
    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Store the new code in Redis
    await redis.set("admin:secret-code", newCode)

    return { success: true, message: "Secret code updated successfully" }
  } catch (error) {
    console.error("Error updating admin secret code:", error)
    return { success: false, message: "Failed to update secret code" }
  }
}

// Register an admin (creates a pending admin that needs superadmin approval)
export async function registerAdmin(data: {
  name: string
  email: string
  password: string
  secretCode: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current secret code
    const expectedSecretCode = await getAdminSecretCode()

    // Validate secret code
    if (data.secretCode !== expectedSecretCode) {
      return { success: false, error: "Invalid secret code" }
    }

    // Check if admin with this email already exists
    const existingAdminId = await redis.get(`admin:email:${data.email}`)
    if (existingAdminId) {
      return { success: false, error: "Email already in use" }
    }

    // Check if there's a pending admin with this email
    const existingPendingAdmin = await redis.get(`pending-admin:email:${data.email}`)
    if (existingPendingAdmin) {
      return { success: false, error: "Registration with this email is already pending approval" }
    }

    const adminId = `pending-admin-${generateId()}`
    const now = Date.now()

    // Hash the password
    const hashedPassword = await hashPassword(data.password)

    // Create admin data
    const admin = {
      id: adminId,
      email: data.email,
      name: data.name,
      password: hashedPassword,
      createdAt: now,
      status: "pending",
    }

    // Store pending admin data
    await redis.hset(`pending-admin:${adminId}`, admin)

    // Create email to pending admin ID mapping
    await redis.set(`pending-admin:email:${data.email}`, adminId)

    // Add to pending admins list
    await redis.sadd("pending-admins", adminId)

    return { success: true }
  } catch (error) {
    console.error("Failed to register admin:", error)
    return { success: false, error: "Registration failed. Please try again." }
  }
}

// Get all pending admin requests
export async function getPendingAdmins() {
  try {
    console.log("getPendingAdmins: Starting function")

    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      console.log("getPendingAdmins: Not a superadmin")
      return []
    }

    console.log("getPendingAdmins: Superadmin verified, fetching pending admins")

    const pendingAdminIds = await redis.smembers("pending-admins")
    console.log(`getPendingAdmins: Found ${pendingAdminIds ? pendingAdminIds.length : 0} pending admin IDs`)

    const pendingAdmins = []

    for (const id of pendingAdminIds || []) {
      try {
        console.log(`getPendingAdmins: Processing pending admin ID ${id}`)
        const admin = await redis.hgetall(`pending-admin:${id}`)

        if (admin && Object.keys(admin).length > 0) {
          console.log(`getPendingAdmins: Found valid pending admin data for ${id}`)
          // Convert string values to appropriate types
          pendingAdmins.push({
            ...admin,
            createdAt: Number.parseInt(admin.createdAt as string) || 0,
          })
        } else {
          console.log(`getPendingAdmins: No valid pending admin data for ${id}`)
          // Remove invalid ID from the set
          await redis.srem("pending-admins", id)
        }
      } catch (adminError) {
        console.error(`getPendingAdmins: Error processing pending admin ${id}:`, adminError)
        // Continue with next admin
      }
    }

    console.log(`getPendingAdmins: Returning ${pendingAdmins.length} pending admins`)
    return pendingAdmins
  } catch (error) {
    console.error("Failed to get pending admins:", error)
    return []
  }
}

// Approve admin request
export async function approveAdmin(adminId: string) {
  try {
    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Get pending admin data
    const pendingAdmin = await redis.hgetall(`pending-admin:${adminId}`)
    if (!pendingAdmin || Object.keys(pendingAdmin).length === 0) {
      return { success: false, message: "Admin request not found" }
    }

    // Create new admin ID
    const newAdminId = `admin-${generateId()}`

    // Create admin data
    const admin = {
      ...pendingAdmin,
      id: newAdminId,
      status: "approved",
      approvedAt: Date.now(),
      approvedBy: currentUser.id,
      isAdmin: true,
    }

    // Store admin data
    await redis.hset(`admin:${newAdminId}`, admin)

    // Create email to admin ID mapping
    await redis.set(`admin:email:${pendingAdmin.email}`, newAdminId)

    // Remove from pending admins list
    await redis.srem("pending-admins", adminId)

    // Delete pending admin data
    await redis.del(`pending-admin:${adminId}`)
    await redis.del(`pending-admin:email:${pendingAdmin.email}`)

    revalidatePath("/superadmin")
    return { success: true, message: "Admin approved successfully" }
  } catch (error) {
    console.error("Failed to approve admin:", error)
    return { success: false, message: "Failed to approve admin" }
  }
}

// Reject admin request
export async function rejectAdmin(adminId: string) {
  try {
    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Get pending admin data
    const pendingAdmin = await redis.hgetall(`pending-admin:${adminId}`)
    if (!pendingAdmin || Object.keys(pendingAdmin).length === 0) {
      return { success: false, message: "Admin request not found" }
    }

    // Remove from pending admins list
    await redis.srem("pending-admins", adminId)

    // Delete pending admin data
    await redis.del(`pending-admin:${adminId}`)
    await redis.del(`pending-admin:email:${pendingAdmin.email}`)

    revalidatePath("/superadmin")
    return { success: true, message: "Admin request rejected" }
  } catch (error) {
    console.error("Failed to reject admin:", error)
    return { success: false, message: "Failed to reject admin" }
  }
}

// Get all admins
export async function getAllAdmins() {
  try {
    console.log("getAllAdmins: Starting function")

    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      console.log("getAllAdmins: Not a superadmin")
      return []
    }

    console.log("getAllAdmins: Superadmin verified, fetching admins")

    // Get all admin keys
    const adminKeys = await redis.keys("admin:*")
    console.log(`getAllAdmins: Found ${adminKeys ? adminKeys.length : 0} admin keys`)

    const admins = []

    // Process each admin key
    for (const key of adminKeys || []) {
      // Only process keys that are direct admin records (not email mappings, secret-code, or other related data)
      if (
        typeof key === "string" &&
        key.startsWith("admin:") &&
        !key.includes(":email") &&
        !key.includes(":sessions") &&
        !key.includes("secret-code") &&
        key.split(":").length === 2
      ) {
        try {
          console.log(`getAllAdmins: Processing admin key ${key}`)
          const adminData = await redis.hgetall(key)

          if (adminData && Object.keys(adminData).length > 0) {
            console.log(`getAllAdmins: Found valid admin data for ${key}`)
            // Convert string boolean values to actual booleans
            admins.push({
              ...adminData,
              isAdmin: adminData.isAdmin === "true" || adminData.isAdmin === true,
              createdAt: Number.parseInt(adminData.createdAt as string) || 0,
            })
          } else {
            console.log(`getAllAdmins: No valid admin data for ${key}`)
          }
        } catch (adminError) {
          console.error(`getAllAdmins: Error processing admin ${key}:`, adminError)
          // Continue with next admin
        }
      }
    }

    console.log(`getAllAdmins: Returning ${admins.length} admins`)
    return admins
  } catch (error) {
    console.error("Failed to get all admins:", error)
    return []
  }
}

// Update admin
export async function updateAdmin(adminId, adminData) {
  try {
    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Get existing admin data
    const existingAdmin = await redis.hgetall(`admin:${adminId}`)
    if (!existingAdmin || Object.keys(existingAdmin).length === 0) {
      return { success: false, message: "Admin not found" }
    }

    // Handle email change
    if (adminData.email && adminData.email !== existingAdmin.email) {
      // Check if new email is already in use
      const existingAdminId = await redis.get(`admin:email:${adminData.email}`)
      if (existingAdminId && existingAdminId !== adminId) {
        return { success: false, message: "Email already in use" }
      }

      // Update email mapping
      await redis.del(`admin:email:${existingAdmin.email}`)
      await redis.set(`admin:email:${adminData.email}`, adminId)
    }

    // Handle password change
    if (adminData.password) {
      adminData.password = await hashPassword(adminData.password)
    }

    // Update admin data
    const updatedAdmin = {
      ...existingAdmin,
      ...adminData,
      updatedAt: Date.now(),
      updatedBy: currentUser.id,
    }

    await redis.hset(`admin:${adminId}`, updatedAdmin)

    revalidatePath("/superadmin")
    return { success: true, message: "Admin updated successfully" }
  } catch (error) {
    console.error("Failed to update admin:", error)
    return { success: false, message: "Failed to update admin" }
  }
}

// Delete admin
export async function deleteAdmin(adminId) {
  try {
    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Get admin data
    const admin = await redis.hgetall(`admin:${adminId}`)
    if (!admin || Object.keys(admin).length === 0) {
      return { success: false, message: "Admin not found" }
    }

    // Delete email mapping
    await redis.del(`admin:email:${admin.email}`)

    // Delete admin data
    await redis.del(`admin:${adminId}`)

    revalidatePath("/superadmin")
    return { success: true, message: "Admin deleted successfully" }
  } catch (error) {
    console.error("Failed to delete admin:", error)
    return { success: false, message: "Failed to delete admin" }
  }
}

// Create admin directly (by superadmin)
export async function createAdmin(adminData) {
  try {
    // Get current user to verify superadmin status
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperadmin) {
      return { success: false, message: "Unauthorized access" }
    }

    // Check if admin with this email already exists
    const existingAdminId = await redis.get(`admin:email:${adminData.email}`)
    if (existingAdminId) {
      return { success: false, message: "Email already in use" }
    }

    const adminId = `admin-${generateId()}`
    const now = Date.now()

    // Hash the password
    const hashedPassword = await hashPassword(adminData.password)

    // Create admin data
    const admin = {
      id: adminId,
      email: adminData.email,
      name: adminData.name,
      password: hashedPassword,
      createdAt: now,
      createdBy: currentUser.id,
      isAdmin: true,
    }

    // Store admin data
    await redis.hset(`admin:${adminId}`, admin)

    // Create email to admin ID mapping
    await redis.set(`admin:email:${adminData.email}`, adminId)

    revalidatePath("/superadmin")
    return { success: true, message: "Admin created successfully" }
  } catch (error) {
    console.error("Failed to create admin:", error)
    return { success: false, message: "Failed to create admin" }
  }
}
