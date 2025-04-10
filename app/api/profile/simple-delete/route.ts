import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { getRobustCurrentUser } from "@/app/actions/user-actions-robust"
import { revalidatePath } from "next/cache"

export async function POST() {
  try {
    // Get the current user with robust error handling
    const user = await getRobustCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to delete your profile picture" },
        { status: 401 },
      )
    }

    // Check if user has a profile picture
    if (!user.profilePicture) {
      return NextResponse.json({ success: false, message: "No profile picture to delete" }, { status: 400 })
    }

    // Delete the profile picture field
    await redis.hdel(`user:${user.id}`, "profilePicture")

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")
    revalidatePath("/profile/delete-picture-tool")

    return NextResponse.json({
      success: true,
      message: "Profile picture deleted successfully",
    })
  } catch (error) {
    console.error("Failed to delete profile picture:", error)
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
