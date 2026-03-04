import { db } from "./db"
import { sessions } from "./db/schema"
import { eq } from "drizzle-orm"

export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return true
  } catch (error) {
    console.error("Failed to invalidate session:", error)
    return false
  }
}
