"use server"

import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import type { Task } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./user-actions"
import crypto from "crypto"

export async function createTask(formData: FormData): Promise<Task | null> {
  try {
    const user = await getCurrentUser()
    const userId = user ? user.id : "demo-user-123"

    const taskId = crypto.randomUUID()

    const task: Task = {
      id: taskId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      dueDate: new Date(formData.get("dueDate") as string),
      category: formData.get("category") as string,
      priority: formData.get("priority") as "low" | "medium" | "high",
      sharedWith: formData.get("sharedWith") ? JSON.parse(formData.get("sharedWith") as string) : [],
      completed: false,
      userId,
      parentId: (formData.get("parentId") as string) || null,
      dependsOn: (formData.get("dependsOn") as string) || null,
      recurrenceRule: (formData.get("recurrenceRule") as string) || null,
      nextRecurringDate: null,
      createdAt: new Date(),
    }

    if (!task.title || !task.dueDate || !task.category || !task.priority) {
      return null
    }

    await db.insert(tasks).values(task)

    try {
      revalidatePath("/dashboard")
      revalidatePath("/calendar")
      revalidatePath("/")
    } catch (e) { }

    return task
  } catch (error) {
    console.error("Failed to create task:", error)
    throw new Error("Database connection error. Please try again later.")
  }
}
