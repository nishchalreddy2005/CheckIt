import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { invalidateSession } from "@/lib/session"

export async function GET() {
  try {
    // Get the session ID from cookies
    const sessionId = cookies().get("sessionId")?.value

    // Delete the session cookie immediately
    cookies().delete("sessionId")

    // If there was a session ID, invalidate it in the background
    if (sessionId) {
      try {
        await invalidateSession(sessionId)
      } catch (error) {
        console.error("Session invalidation error:", error)
        // Continue even if invalidation fails
      }
    }

    // Return a simple success response instead of a redirect
    // The client is already handling the redirect
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 })
  }
}
