import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { getCurrentUser } from "@/app/actions/user-actions"
import { revalidatePath } from "next/cache"

export async function POST() {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to delete your profile picture" },
        { status: 401 },
      )
    }

    const userId = currentUser.id
    console.log("API: Starting profile picture deletion for user:", userId)

    // Try multiple approaches to ensure deletion works

    // Approach 1: Use hdel to remove the field
    console.log("API: Attempting to delete profile picture using hdel...")
    const hdelResult = await redis.hdel(`user:${userId}`, "profilePicture")
    console.log("API: hdel result:", hdelResult)

    // Approach 2: Set the field to an empty string
    console.log("API: Attempting to set profile picture to empty string...")
    const hsetResult = await redis.hset(`user:${userId}`, "profilePicture", "")
    console.log("API: hset result:", hsetResult)

    // Verify the deletion worked
    const updatedUserData = await redis.hgetall(`user:${userId}`)
    console.log("API: User data from Redis after deletion:", updatedUserData)

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")
    revalidatePath("/profile/manage-picture")
    revalidatePath("/profile/delete-picture-tool")

    return NextResponse.json({
      success: true,
      message: "Profile picture deletion attempted with multiple methods",
      details: {
        hdelResult,
        hsetResult,
        updatedUserData,
      },
    })
  } catch (error) {
    console.error("API: Failed to delete profile picture:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
