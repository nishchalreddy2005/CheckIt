import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { getCurrentUser } from "@/app/actions/user-actions"
import { revalidatePath } from "next/cache"

export async function DELETE() {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to delete your profile picture" },
        { status: 401 },
      )
    }

    // Check if user has a profile picture
    if (!currentUser.profilePicture) {
      return NextResponse.json({ success: false, message: "No profile picture to delete" }, { status: 400 })
    }

    // Direct Redis operation to remove the profile picture field
    await redis.hdel(`user:${currentUser.id}`, "profilePicture")

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")

    return NextResponse.json({
      success: true,
      message: "Profile picture deleted successfully",
    })
  } catch (error) {
    console.error("Failed to delete profile picture:", error)
    return NextResponse.json({ success: false, message: `Error: ${error.message}` }, { status: 500 })
  }
}
