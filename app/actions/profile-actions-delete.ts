"use server"

import { redis } from "@/lib/redis"
import type { User } from "@/lib/types"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"

// Function to handle profile picture deletion
export async function deleteProfilePicture(): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to delete your profile picture" }
    }

    // Check if user has a profile picture
    if (!currentUser.profilePicture) {
      return { success: false, message: "No profile picture to delete" }
    }

    // Update the user by removing the profile picture
    const updatedUser: User = {
      ...currentUser,
      profilePicture: undefined, // Change null to undefined to ensure it's properly removed
      updatedAt: Date.now(),
    }

    // Save the updated user to Redis
    await redis.hset(`user:${currentUser.id}`, {
      ...updatedUser,
      profilePicture: "", // Use empty string for Redis since it doesn't handle undefined well
    })

    // Revalidate all relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")

    return {
      success: true,
      message: "Profile picture deleted successfully",
      user: updatedUser,
    }
  } catch (error) {
    console.error("Failed to delete profile picture:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}
