import { NextResponse } from "next/server"
import { getCurrentUser } from "@/app/actions/user-actions"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    // Return only necessary user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
      },
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user data" }, { status: 500 })
  }
}
