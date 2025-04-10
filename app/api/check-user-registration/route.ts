import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    // Get all keys that match email:*
    const keys = await redis.keys("email:*")

    // Get all user IDs
    const userIds = await Promise.all(
      keys.map(async (key) => {
        return await redis.get(key)
      }),
    )

    // Get all users
    const users = await Promise.all(
      userIds.map(async (id) => {
        if (!id) return null
        const user = await redis.hgetall(`user:${id}`)
        return user
      }),
    )

    return NextResponse.json({
      status: "success",
      userCount: users.filter(Boolean).length,
      users: users.filter(Boolean).map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      })),
    })
  } catch (error) {
    console.error("Failed to check user registration:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check user registration",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
