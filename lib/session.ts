import { redis } from "./redis"

export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    // Get the session data first
    const session = await redis.hgetall(`session:${sessionId}`)

    // If we have a userId, remove the session from the user's sessions set
    if (session && session.userId && typeof session.userId === "string") {
      try {
        await redis.srem(`user:${session.userId}:sessions`, sessionId)
      } catch (error) {
        console.error("Error removing session from user's sessions:", error)
        // Continue even if this fails
      }
    }

    // Delete the session data
    try {
      await redis.del(`session:${sessionId}`)
    } catch (error) {
      console.error("Error deleting session data:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to invalidate session:", error)
    return false
  }
}
