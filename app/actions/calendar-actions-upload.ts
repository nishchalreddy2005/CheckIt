"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { User } from "@/lib/types"
import { getCurrentUser } from "./user-actions"
import { revalidatePath } from "next/cache"
import { uploadImageBuffer } from "@/lib/cloudinary"

export async function uploadCalendarBackground(
    formData: FormData,
): Promise<{ success: boolean; message: string; user?: User }> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, message: "You must be logged in to upload a background" }
        }

        const file = formData.get("calendarBackground") as File
        if (!file) return { success: false, message: "No file provided" }
        if (!file.type.startsWith("image/")) return { success: false, message: "Please upload an image file" }
        if (file.size > 8 * 1024 * 1024) return { success: false, message: "Image size should be less than 8MB" }

        const buffer = await file.arrayBuffer()
        const nodeBuffer = Buffer.from(buffer)

        // Upload standard buffer to Cloudinary returning secure CDN text-link
        const imageUrl = await uploadImageBuffer(nodeBuffer, "checkit_backgrounds")

        await db.update(users).set({ calendarBackground: imageUrl, updatedAt: new Date() }).where(eq(users.id, currentUser.id))

        try {
            revalidatePath("/dashboard")
            revalidatePath("/calendar")
            revalidatePath("/settings")
        } catch (e) { }

        return { success: true, message: "Calendar background uploaded successfully", user: { ...currentUser, calendarBackground: imageUrl } as User }
    } catch (error: any) {
        console.error("Calendar background upload error:", error)
        return { success: false, message: error?.message || "Failed to upload image. Please try again." }
    }
}
