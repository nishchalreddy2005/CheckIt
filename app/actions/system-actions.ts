"use server"

import { db } from "@/lib/db"
import { systemSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCurrentUser } from "./user-actions"

export async function getSystemSettings() {
    try {
        const settings = await db.select().from(systemSettings)

        // Convert array of key/value pairs to an object
        const settingsObject: Record<string, string> = {}

        settings.forEach(setting => {
            settingsObject[setting.key] = setting.value
        })

        // Set defaults if they don't exist
        if (!('maintenance_mode' in settingsObject)) settingsObject['maintenance_mode'] = 'false'
        if (!('global_announcement' in settingsObject)) settingsObject['global_announcement'] = ''

        return { success: true, settings: settingsObject }
    } catch (error) {
        console.error("Failed to get system settings:", error)
        return { success: false, message: "Failed to retrieve system settings" }
    }
}

export async function updateSystemSettings(settings: Record<string, string>) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.isSuperadmin) {
            return { success: false, message: "Unauthorized access" }
        }

        for (const [key, value] of Object.entries(settings)) {
            const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.key, key))

            if (existing) {
                await db.update(systemSettings)
                    .set({ value, updatedAt: new Date() })
                    .where(eq(systemSettings.key, key))
            } else {
                await db.insert(systemSettings).values({
                    key,
                    value,
                    updatedAt: new Date()
                })
            }
        }

        return { success: true, message: "System settings updated successfully" }
    } catch (error) {
        console.error("Failed to update system settings:", error)
        return { success: false, message: "Failed to update system settings" }
    }
}
