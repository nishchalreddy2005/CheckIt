"use server"

import { redis } from "@/lib/redis"
import type { Task } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./user-actions"
import { DEMO_USER_ID, initializeDatabase } from "@/lib/init-db"

// Create a new task
export async function createTask(formData: FormData): Promise<Task | null> {
  try {
    // Get the current user
    const user = await getCurrentUser()
    const userId = user ? user.id : DEMO_USER_ID

    // If using demo user, ensure demo data exists
    if (userId === DEMO_USER_ID) {
      await initializeDatabase()
    }

    // Generate a unique ID for the task
    const taskId = crypto.randomUUID()

    // Create the task object
    const task: Task = {
      id: taskId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      category: formData.get("category") as string,
      priority: formData.get("priority") as "low" | "medium" | "high",
      completed: false,
      userId,
      createdAt: Date.now(),
    }

    // Validate required fields
    if (!task.title || !task.dueDate || !task.category || !task.priority) {
      console.error("Missing required task fields")
      return null
    }

    console.log("Creating task:", task)

    // Save the task to Redis
    try {
      // First check if Redis is connected
      const pingResult = await redis.ping()
      console.log("Redis ping result:", pingResult)

      // Save the task
      await redis.hset(`task:${taskId}`, task)

      // Add the task ID to the user's task set
      await redis.sadd(`user:${userId}:tasks`, taskId)

      console.log("Task created successfully:", taskId)

      revalidatePath("/dashboard")
      return task
    } catch (redisError) {
      console.error("Redis connection error in createTask:", redisError)
      throw new Error("Database connection error. Please try again later.")
    }
  } catch (error) {
    console.error("Failed to create task:", error)
    throw error
  }
}
