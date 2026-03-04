import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { getCurrentUser } from "@/app/actions/user-actions"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    let userId
    try {
      const user = await getCurrentUser()
      userId = user ? user.id : "demo-user-123"
    } catch (userError) {
      userId = "demo-user-123"
    }

    let data
    try {
      data = await request.json()
    } catch (parseError) {
      return NextResponse.json({ success: false, message: "Invalid request format" }, { status: 400 })
    }

    if (!data.title) return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 })
    if (!data.dueDate) return NextResponse.json({ success: false, message: "Due date is required" }, { status: 400 })
    if (!data.category) return NextResponse.json({ success: false, message: "Category is required" }, { status: 400 })
    if (!data.priority) return NextResponse.json({ success: false, message: "Priority is required" }, { status: 400 })

    const id = crypto.randomUUID()
    if (data.userId) userId = data.userId

    const task = {
      id,
      title: data.title,
      description: data.description || "",
      dueDate: new Date(data.dueDate),
      category: data.category,
      priority: data.priority,
      completed: false,
      userId,
      createdAt: new Date(),
    }

    await db.insert(tasks).values(task)

    try {
      revalidatePath("/dashboard")
      revalidatePath("/calendar")
      revalidatePath("/")
    } catch (revalidateError) { }

    return NextResponse.json({ success: true, message: "Task created successfully", task })
  } catch (error) {
    console.error("Failed to create task via API:", error)
    return NextResponse.json({ success: false, message: "Failed to create task" }, { status: 500 })
  }
}
