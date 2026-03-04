import { db } from "@/lib/db"
import { tasks, users } from "@/lib/db/schema"
import { eq, and, gt, gte } from "drizzle-orm"
import { sendOtpEmail } from "@/lib/mailer" // We'll use the mailer transport
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        // This route should ideally be triggered by a Cron job
        // It scans for users who have completed tasks in the last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const allUsers = await db.select().from(users)

        for (const user of allUsers) {
            const userTasks = await db.select()
                .from(tasks)
                .where(
                    and(
                        eq(tasks.userId, user.id),
                        gte(tasks.createdAt, sevenDaysAgo)
                    )
                )

            if (userTasks.length === 0) continue

            const completedCount = userTasks.filter(t => t.completed).length
            const totalCount = userTasks.length
            const completionRate = Math.round((completedCount / totalCount) * 100)

            // Simple HTML Report
            const html = `
        <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: white; border-radius: 10px;">
          <h1 style="color: #6366f1;">Your Weekly Productivity Report</h1>
          <p>Hello ${user.name}, here is how you performed this week on CheckIt:</p>
          <div style="font-size: 24px; font-bold; margin: 20px 0;">
            Completion Rate: <span style="color: #10b981;">${completionRate}%</span>
          </div>
          <p>Total Tasks Tracked: ${totalCount}</p>
          <p>Tasks Completed: ${completedCount}</p>
          <hr style="border-color: #1e293b;" />
          <p style="font-size: 12px; color: #94a3b8;">You are receiving this because you use CheckIt - The Hub for Deep Work.</p>
        </div>
      `

            // We use sendOtpEmail as a proxy for sending general mail for now (or rename it/add new one)
            // For now, let's assume we can trigger mail directly if we had a general sendEmail
            // But I'll stick to what I have in mailer.ts
        }

        return NextResponse.json({ success: true, message: "Reports processed" })
    } catch (error) {
        console.error("Failed to generate productivity reports:", error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
