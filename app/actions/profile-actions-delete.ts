"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { User } from "@/lib/types"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"

export async function deleteProfilePicture(): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, message: "You must be logged in to delete your profile picture" }
    if (!currentUser.profilePicture) return { success: false, message: "No profile picture to delete" }

    await db.update(users).set({ profilePicture: null, updatedAt: new Date() }).where(eq(users.id, currentUser.id))

    try {
      revalidatePath("/dashboard")
      revalidatePath("/profile")
      revalidatePath("/settings")
    } catch (e) { }

    return { success: true, message: "Profile picture deleted successfully", user: { ...currentUser, profilePicture: null } as User }
  } catch (error) {
    return { success: false, message: "Error" }
  }
}
