"use server"

import { redis } from "@/lib/redis"
import type { User } from "@/lib/types"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"

// Function to handle profile picture uploads
export async function uploadProfilePicture(
  formData: FormData,
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in to upload a profile picture" }
    }

    // Get the file from the form data
    const file = formData.get("profilePicture") as File
    if (!file) {
      return { success: false, message: "No file provided" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Please upload an image file" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "Image size should be less than 5MB" }
    }

    // Convert the file to a data URL (base64)
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update the user with the profile picture URL
    const updatedUser: User = {
      ...currentUser,
      profilePicture: dataUrl,
      updatedAt: Date.now(),
    }

    // Filter out any null or undefined values before saving to Redis
    const filteredUser = Object.fromEntries(
      Object.entries(updatedUser).filter(([_, value]) => value !== null && value !== undefined),
    )

    // Save the updated user to Redis
    await redis.hset(`user:${currentUser.id}`, filteredUser)

    // Revalidate all relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")

    return {
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
    }
  } catch (error) {
    console.error("Failed to upload profile picture:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}
