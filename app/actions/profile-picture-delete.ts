"use server"

import { redis } from "@/lib/redis"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"

export async function deleteProfilePictureDirectly() {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.error("No user found when trying to delete profile picture")
      return { success: false, message: "User not found" }
    }

    console.log("Current user before deletion:", currentUser.id, "Profile picture:", currentUser.profilePicture)

    // Direct Redis operation to remove the profile picture field
    await redis.hdel(`user:${currentUser.id}`, "profilePicture")

    console.log("Profile picture field deleted from Redis")

    // Revalidate all relevant paths to refresh the UI
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")

    return {
      success: true,
      message: "Profile picture deleted successfully",
    }
  } catch (error) {
    console.error("Failed to delete profile picture:", error)
    return {
      success: false,
      message: `Error deleting profile picture: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
