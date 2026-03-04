"use server"

import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { eq, or, arrayContains, asc } from "drizzle-orm"
import type { Task, TaskStats } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./user-actions"
import { createTask as createTaskAction } from "./task-actions-create"
import crypto from "crypto"

export const createTask = createTaskAction

export async function ensureDemoData() {
  return true
}

export async function getTasks(userId?: string): Promise<Task[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!userId) {
      userId = currentUser ? currentUser.id : "demo-user-123"
    }

    // A user can see tasks they created OR tasks where their USERNAME is in the sharedWith array
    const userUsername = currentUser?.username || "demo_user"

    const userTasks = await db.select().from(tasks).where(
      or(
        eq(tasks.userId, userId),
        arrayContains(tasks.sharedWith, [userUsername])
      )
    )

    const filteredTasks = userTasks.sort((a, b) => {
      const dateA = a.dueDate ? a.dueDate.getTime() : 0;
      const dateB = b.dueDate ? b.dueDate.getTime() : 0;
      return dateA - dateB;
    });

    return filteredTasks as Task[]
  } catch (error) {
    return []
  }
}

export async function getTaskStats(userId?: string): Promise<TaskStats> {
  try {
    if (!userId) {
      const user = await getCurrentUser()
      userId = user ? user.id : "demo-user-123"
    }

    const userTasks = await getTasks(userId)

    const stats: TaskStats = {
      completed: 0,
      total: userTasks.length,
      categories: {},
    }

    userTasks.forEach((task) => {
      const category = task.category || "General"
      if (!stats.categories[category]) {
        stats.categories[category] = { completed: 0, total: 0 }
      }

      stats.categories[category].total++

      if (task.completed) {
        stats.completed++
        stats.categories[category].completed++
      }
    })

    return stats
  } catch (error) {
    return { completed: 0, total: 0, categories: {} }
  }
}

export async function updateTask(formData: FormData): Promise<Task | null> {
  try {
    const user = await getCurrentUser()
    const userId = user ? user.id : "demo-user-123"
    const taskId = formData.get("id") as string

    const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId))

    const userUsername = user?.username || "demo_user"
    if (!existingTask || (existingTask.userId !== userId && !(existingTask.sharedWith || []).includes(userUsername))) {
      return null
    }

    const updatedTask = {
      ...existingTask,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : existingTask.dueDate,
      category: formData.get("category") as string,
      priority: formData.get("priority") as "low" | "medium" | "high",
      sharedWith: formData.get("sharedWith") ? JSON.parse(formData.get("sharedWith") as string) : existingTask.sharedWith,
      parentId: (formData.get("parentId") as string) || existingTask.parentId,
      dependsOn: (formData.get("dependsOn") as string) || existingTask.dependsOn,
      recurrenceRule: (formData.get("recurrenceRule") as string) || existingTask.recurrenceRule,
    }

    await db.update(tasks).set(updatedTask).where(eq(tasks.id, taskId))

    try {
      revalidatePath("/dashboard")
      revalidatePath("/calendar")
    } catch (e) { }

    return updatedTask as Task
  } catch (error) {
    return null
  }
}

export async function deleteTask(formData: FormData): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const userId = user ? user.id : "demo-user-123"
    const taskId = formData.get("id") as string

    const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId))

    const userUsername = user?.username || "demo_user"
    if (!existingTask || (existingTask.userId !== userId && !(existingTask.sharedWith || []).includes(userUsername))) {
      return false
    }

    await db.delete(tasks).where(eq(tasks.id, taskId))

    try { revalidatePath("/dashboard") } catch (e) { }
    return true
  } catch (error) {
    return false
  }
}

export async function toggleTaskCompletion(formData: FormData): Promise<Task | null> {
  try {
    const user = await getCurrentUser()
    const userId = user ? user.id : "demo-user-123"
    const taskId = formData.get("id") as string

    const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId))

    const userUsername = user?.username || "demo_user"
    if (!existingTask || (existingTask.userId !== userId && !(existingTask.sharedWith || []).includes(userUsername))) {
      return null
    }

    // BLOCKER CHECK: If this task depends on another, ensure that one is completed
    if (!existingTask.completed && existingTask.dependsOn) {
      const [blocker] = await db.select().from(tasks).where(eq(tasks.id, existingTask.dependsOn))
      if (blocker && !blocker.completed) {
        throw new Error(`Task is blocked by "${blocker.title}"`)
      }
    }

    const isCompleting = !existingTask.completed
    const updatedTask = { ...existingTask, completed: isCompleting }

    await db.update(tasks).set({ completed: updatedTask.completed }).where(eq(tasks.id, taskId))

    // RECURRENCE LOGIC: If a task with a recurrence rule is being completed, create the next instance
    if (isCompleting && existingTask.recurrenceRule) {
      const nextDueDate = new Date(existingTask.dueDate!)

      if (existingTask.recurrenceRule === 'daily') {
        nextDueDate.setDate(nextDueDate.getDate() + 1)
      } else if (existingTask.recurrenceRule === 'weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + 7)
      } else if (existingTask.recurrenceRule === 'monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
      }

      const newTask = {
        ...existingTask,
        id: crypto.randomUUID(),
        completed: false,
        dueDate: nextDueDate,
        createdAt: new Date(),
        nextRecurringDate: null // Reset for the next one
      }

      // Update the current task's nextRecurringDate as a record of when we spawned the next one
      await db.update(tasks).set({ nextRecurringDate: nextDueDate }).where(eq(tasks.id, taskId))
      await db.insert(tasks).values(newTask)
    }

    try { revalidatePath("/dashboard") } catch (e) { }
    return updatedTask as Task
  } catch (error) {
    return null
  }
}

export async function importTasks(jsonData: string): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "User not authenticated" }
    }

    let parsedTasks
    try {
      parsedTasks = JSON.parse(jsonData)
    } catch (error) {
      return { success: false, message: "Invalid JSON format" }
    }

    if (!Array.isArray(parsedTasks)) {
      return { success: false, message: "Invalid format: Expected an array of tasks" }
    }

    const validTasks = parsedTasks.filter((task) => task.title && task.dueDate && task.category && task.priority)

    if (validTasks.length === 0) {
      return { success: false, message: "No valid tasks found in the file" }
    }

    const newTasksToInsert = validTasks.map(taskData => ({
      id: crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description || "",
      dueDate: new Date(taskData.dueDate),
      category: taskData.category,
      priority: taskData.priority,
      completed: taskData.completed || false,
      userId: user.id,
      createdAt: new Date(),
    }))

    for (const task of newTasksToInsert) {
      await db.insert(tasks).values(task)
    }

    try {
      revalidatePath("/dashboard")
      revalidatePath("/calendar")
    } catch (e) { }

    return { success: true, message: `Successfully imported ${newTasksToInsert.length} tasks`, count: newTasksToInsert.length }
  } catch (error) {
    return { success: false, message: "An error occurred while importing tasks" }
  }
}
