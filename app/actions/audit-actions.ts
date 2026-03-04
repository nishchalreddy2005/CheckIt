"use server"

import { db } from "@/lib/db"
import { auditLogs, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getCurrentUser } from "./user-actions"
import crypto from "crypto"
import { headers } from "next/headers"

export async function logAuditAction(action: string, targetUserId?: string, details?: string) {
    try {
        const admin = await getCurrentUser()
        if (!admin || !admin.isAdmin) return { success: false, message: "Only admins can log audit actions" }

        const headerList = await headers()
        const ipAddress = headerList.get("x-forwarded-for") || "127.0.0.1"

        await db.insert(auditLogs).values({
            id: crypto.randomUUID(),
            adminId: admin.id,
            action,
            targetUser: targetUserId || null,
            details: details || null,
            ipAddress: ipAddress,
            timestamp: new Date()
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to log audit action:", error)
        return { success: false }
    }
}

export async function getAuditLogs() {
    try {
        const user = await getCurrentUser()
        if (!user || !user.isSuperadmin) return []

        const logs = await db.select({
            id: auditLogs.id,
            adminName: users.name,
            adminId: auditLogs.adminId,
            action: auditLogs.action,
            targetUserId: auditLogs.targetUser,
            details: auditLogs.details,
            timestamp: auditLogs.timestamp,
            ipAddress: auditLogs.ipAddress,
        })
            .from(auditLogs)
            .innerJoin(users, eq(auditLogs.adminId, users.id))
            .orderBy(desc(auditLogs.timestamp))
            .limit(100)

        return logs
    } catch (error) {
        console.error("Failed to fetch audit logs:", error)
        return []
    }
}
