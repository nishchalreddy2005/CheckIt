import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { validateSession } from "@/lib/security"
import { getUserById } from "@/app/actions/user-actions"

export async function GET() {
  try {
    const sessionId = cookies().get("sessionId")?.value

    if (!sessionId) {
      return NextResponse.json({
        status: "error",
        message: "No session found",
        sessionId: null,
      })
    }

    try {
      const { valid, userId } = await validateSession(sessionId)

      if (!valid || !userId) {
        return NextResponse.json({
          status: "error",
          message: "Invalid session",
          sessionId,
          valid,
          userId,
        })
      }

      const user = await getUserById(userId)

      return NextResponse.json({
        status: "success",
        message: "Valid session",
        sessionId,
        userId,
        user: user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          : null,
      })
    } catch (validationError) {
      console.error("Session validation error:", validationError)
      return NextResponse.json({
        status: "error",
        message: `Session validation error: ${validationError.message}`,
        sessionId,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: `Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
