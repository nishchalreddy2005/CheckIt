import { NextResponse } from "next/server"
import { checkRedisConnection } from "@/lib/redis-check"

export async function GET() {
  try {
    const connectionStatus = await checkRedisConnection()

    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          status: "error",
          message: "Redis connection failed",
          error: connectionStatus.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Redis connection is working",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking Redis status:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check Redis status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
