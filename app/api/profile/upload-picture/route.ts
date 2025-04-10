import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { getCurrentUser } from "@/app/actions/user-actions"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to upload a profile picture" },
        { status: 401 },
      )
    }

    // Get form data from the request
    const formData = await request.formData()
    const file = formData.get("profilePicture") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "Please upload an image file" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "Image size should be less than 5MB" }, { status: 400 })
    }

    // Convert the file to a data URL (base64)
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update the user with the profile picture URL
    const updatedUser = {
      ...currentUser,
      profilePicture: dataUrl,
      updatedAt: Date.now(),
    }

    // Save the updated user to Redis
    await redis.hset(`user:${currentUser.id}`, updatedUser)

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/settings")

    return NextResponse.json({
      success: true,
      message: "Profile picture uploaded successfully",
    })
  } catch (error) {
    console.error("Failed to upload profile picture:", error)
    return NextResponse.json({ success: false, message: `Error: ${error.message}` }, { status: 500 })
  }
}
