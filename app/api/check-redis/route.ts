import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    // Test Redis connection
    await redis.set("test-key", "Connection successful!")
    const value = await redis.get("test-key")

    return NextResponse.json({
      status: "success",
      message: "Redis connection is working",
      testValue: value,
    })
  } catch (error) {
    console.error("Redis connection error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Redis",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
