import { NextResponse } from "next/server"
import { getTasks } from "@/app/actions/task-actions"
import * as ics from "ics"

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
    try {
        const { userId } = await context.params
        if (!userId) {
            return new NextResponse("User ID required", { status: 400 })
        }

        const tasks = await getTasks(userId)

        const events: ics.EventAttributes[] = tasks
            .filter((task: any) => !task.completed) // ONLY give them pending tasks
            .map((task: any) => {
                const date = new Date(task.dueDate || new Date())
                return {
                    start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() || 12, date.getMinutes()],
                    duration: { hours: 1 },
                    title: `CheckIt: ${task.title}`,
                    description: task.description || "",
                    url: `https://checkit.vercel.app/dashboard`,
                    status: 'CONFIRMED',
                    busyStatus: 'FREE',
                    categories: task.category ? [task.category] : [],
                }
            })

        if (events.length === 0) {
            // Return an empty calendar instead of an error so calendar apps don't crash
            const emptyCal = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CheckIt//NONSGML v1.0//EN\nEND:VCALENDAR`
            return new NextResponse(emptyCal, {
                headers: {
                    'Content-Type': 'text/calendar; charset=utf-8',
                    'Content-Disposition': `attachment; filename="checkit-tasks.ics"`,
                },
            })
        }

        // Return a promise that resolves with the generated ICS string
        return new Promise<NextResponse>((resolve) => {
            ics.createEvents(events, (error: Error | undefined, value: string) => {
                if (error) {
                    console.error("ICS generation error:", error)
                    resolve(new NextResponse("Failed to generate calendar", { status: 500 }))
                    return
                }

                resolve(new NextResponse(value, {
                    headers: {
                        'Content-Type': 'text/calendar; charset=utf-8',
                        'Content-Disposition': `attachment; filename="checkit-tasks-${userId.substring(0, 8)}.ics"`,
                    },
                }))
            })
        })
    } catch (error) {
        console.error("Calendar export error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
