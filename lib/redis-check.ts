import { redis } from "./redis"

export async function checkRedisConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Try to set and get a test value
    await redis.set("connection-test", "connected")
    const result = await redis.get("connection-test")

    if (result !== "connected") {
      return {
        connected: false,
        error: `Unexpected response from Redis: ${result}`,
      }
    }

    return { connected: true }
  } catch (error) {
    console.error("Redis connection error:", error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown Redis connection error",
    }
  }
}
