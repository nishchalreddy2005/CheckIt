"use server"

import { redis } from "@/lib/redis"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"

export async function forceDeleteProfilePicture() {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.error("No user found when trying to delete profile picture")
      return { success: false, message: "User not found" }
    }

    const userId = currentUser.id
    console.log("Starting profile picture deletion for user:", userId)

    // Log the current user data
    console.log("Current user data:", currentUser)

    // Check if Redis is connected
    const ping = await redis.ping()
    console.log("Redis connection check:", ping)

    // Get the current user data directly from Redis to verify
    const userData = await redis.hgetall(`user:${userId}`)
    console.log("User data from Redis before deletion:", userData)

    // Try multiple approaches to ensure deletion works

    // Approach 1: Use hdel to remove the field
    console.log("Attempting to delete profile picture using hdel...")
    const hdelResult = await redis.hdel(`user:${userId}`, "profilePicture")
    console.log("hdel result:", hdelResult)

    // Approach 2: Set the field to an empty string
    console.log("Attempting to set profile picture to empty string...")
    const hsetResult = await redis.hset(`user:${userId}`, "profilePicture", "")
    console.log("hset result:", hsetResult)

    // Approach 3: Update the entire user object
    console.log("Attempting to update entire user object...")
    const updatedUser = {
      ...currentUser,
      profilePicture: "",
      updatedAt: Date.now(),
    }
    delete updatedUser.profilePicture // Remove the field entirely
    const hmsetResult = await redis.hmset(`user:${userId}`, updatedUser)
    console.log("hmset result:", hmsetResult)

    // Verify the deletion worked
    const updatedUserData = await redis.hgetall(`user:${userId}`)
    console.log("User data from Redis after deletion:", updatedUserData)

    // Revalidate all paths to refresh the UI
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")
    revalidatePath("/profile/manage-picture")

    return {
      success: true,
      message: "Profile picture deletion attempted with multiple methods",
    }
  } catch (error) {
    console.error("Failed to delete profile picture:", error)
    return {
      success: false,
      message: `Error deleting profile picture: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Simple function to test Redis connection
export async function testRedisConnection() {
  try {
    const ping = await redis.ping()
    return { success: true, message: `Redis connection successful: ${ping}` }
  } catch (error) {
    return {
      success: false,
      message: `Redis connection failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
