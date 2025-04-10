"use server"

import { redis } from "@/lib/redis"
import type { Task, TaskStats } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { DEMO_USER_ID, initializeDatabase } from "@/lib/init-db"
import { getCurrentUser } from "./user-actions"
import { createTask as createTaskAction } from "./task-actions-create"

// Export the dedicated create task function
export const createTask = createTaskAction

// Initialize database with demo data if needed
export async function ensureDemoData() {
  return initializeDatabase()
}

// Update the getTasks function to ensure taskIds is always an array
export async function getTasks(userId?: string): Promise<Task[]> {
  try {
    console.log("getTasks called with userId:", userId)

    // If no userId is provided, try to get the current user
    if (!userId) {
      const user = await getCurrentUser()
      if (user) {
        userId = user.id
        console.log("Current user found:", userId)
      } else {
        // Fall back to demo user if no user is logged in
        userId = DEMO_USER_ID
        console.log("Using demo user:", userId)
        await ensureDemoData()
      }
    }

    console.log("Fetching tasks for user:", userId)
    let taskIds
    try {
      taskIds = await redis.smembers(`user:${userId}:tasks`)
      console.log("Raw taskIds result:", taskIds)
    } catch (error) {
      console.error("Error fetching task IDs:", error)
      return []
    }

    // Ensure taskIds is an array
    if (!taskIds) {
      console.log("No taskIds returned, using empty array")
      taskIds = []
    } else if (!Array.isArray(taskIds)) {
      console.log("taskIds is not an array, converting:", taskIds)
      // If it's a single value, convert to array
      if (typeof taskIds === "string") {
        taskIds = [taskIds]
      } else {
        // Try to convert to array if possible, otherwise use empty array
        try {
          taskIds = Array.from(taskIds)
        } catch (e) {
          console.error("Could not convert taskIds to array:", e)
          taskIds = []
        }
      }
    }

    console.log("Task IDs after processing:", taskIds)

    // Check if taskIds is an array and has length
    if (taskIds.length === 0) {
      console.log("No tasks found for user")
      return []
    }

    // Use Promise.all to fetch all tasks in parallel
    const tasksPromises = taskIds.map(async (id) => {
      try {
        const taskData = await redis.hgetall(`task:${id}`)
        if (!taskData || Object.keys(taskData).length === 0) {
          console.log(`Task ${id} not found or empty`)
          return null
        }

        // Convert string boolean to actual boolean
        const task = {
          ...taskData,
          completed: taskData.completed === "true" || taskData.completed === true,
        } as Task

        console.log(`Task ${id} fetched:`, task.title)
        return task
      } catch (error) {
        console.error(`Failed to get task ${id}:`, error)
        return null
      }
    })

    const tasks = await Promise.all(tasksPromises)

    // Filter out null values and sort by due date
    const filteredTasks = tasks.filter(Boolean).sort((a, b) => {
      // Sort by due date (ascending)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    console.log(`Returning ${filteredTasks.length} tasks`)
    return filteredTasks
  } catch (error) {
    console.error("Failed to get tasks:", error)
    return []
  }
}

// Get task stats for a user
export async function getTaskStats(userId?: string): Promise<TaskStats> {
  try {
    // If no userId is provided, try to get the current user
    if (!userId) {
      const user = await getCurrentUser()
      if (user) {
        userId = user.id
      } else {
        // Fall back to demo user if no user is logged in
        userId = DEMO_USER_ID
        await ensureDemoData()
      }
    }

    const tasks = await getTasks(userId)

    const stats: TaskStats = {
      completed: 0,
      total: tasks.length,
      categories: {},
    }

    tasks.forEach((task) => {
      // Initialize category if it doesn't exist
      if (!stats.categories[task.category]) {
        stats.categories[task.category] = { completed: 0, total: 0 }
      }

      // Increment category total
      stats.categories[task.category].total++

      // Increment completed counts if task is completed
      if (task.completed) {
        stats.completed++
        stats.categories[task.category].completed++
      }
    })

    return stats
  } catch (error) {
    console.error("Failed to get task stats:", error)
    return { completed: 0, total: 0, categories: {} }
  }
}

// Update a task
export async function updateTask(formData: FormData): Promise<Task | null> {
  try {
    // Get the current user
    const user = await getCurrentUser()
    const userId = user ? user.id : DEMO_USER_ID

    const taskId = formData.get("id") as string

    // Get the existing task
    const existingTask = (await redis.hgetall(`task:${taskId}`)) as Task | null

    // Check if task exists and belongs to the user
    if (!existingTask || existingTask.userId !== userId) {
      return null
    }

    // Update the task
    const updatedTask: Task = {
      ...existingTask,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      category: formData.get("category") as string,
      priority: formData.get("priority") as "low" | "medium" | "high",
    }

    await redis.hset(`task:${taskId}`, updatedTask)

    revalidatePath("/dashboard")
    revalidatePath("/calendar")
    return updatedTask
  } catch (error) {
    console.error("Failed to update task:", error)
    return null
  }
}

// Delete a task
export async function deleteTask(formData: FormData): Promise<boolean> {
  try {
    // Get the current user
    const user = await getCurrentUser()
    const userId = user ? user.id : DEMO_USER_ID

    const taskId = formData.get("id") as string

    // Get the existing task
    const existingTask = (await redis.hgetall(`task:${taskId}`)) as Task | null

    // Check if task exists and belongs to the user
    if (!existingTask || existingTask.userId !== userId) {
      return false
    }

    // Delete the task
    await redis.del(`task:${taskId}`)

    // Remove task ID from user's task set
    await redis.srem(`user:${userId}:tasks`, taskId)

    revalidatePath("/dashboard")
    return true
  } catch (error) {
    console.error("Failed to delete task:", error)
    return false
  }
}

// Toggle task completion status
export async function toggleTaskCompletion(formData: FormData): Promise<Task | null> {
  try {
    // Get the current user
    const user = await getCurrentUser()
    const userId = user ? user.id : DEMO_USER_ID

    const taskId = formData.get("id") as string

    // Get the existing task
    const existingTask = (await redis.hgetall(`task:${taskId}`)) as Task | null

    // Check if task exists and belongs to the user
    if (!existingTask || existingTask.userId !== userId) {
      return null
    }

    // Toggle the completed status
    const updatedTask = {
      ...existingTask,
      completed: !existingTask.completed,
    }

    await redis.hset(`task:${taskId}`, updatedTask)

    revalidatePath("/dashboard")
    return updatedTask
  } catch (error) {
    console.error("Failed to toggle task completion:", error)
    return null
  }
}

// Import tasks from JSON
export async function importTasks(jsonData: string): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    // Get the current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "User not authenticated" }
    }

    // Parse the JSON data
    let tasks
    try {
      tasks = JSON.parse(jsonData)
    } catch (error) {
      return { success: false, message: "Invalid JSON format" }
    }

    // Validate the tasks array
    if (!Array.isArray(tasks)) {
      return { success: false, message: "Invalid format: Expected an array of tasks" }
    }

    // Filter valid tasks
    const validTasks = tasks.filter((task) => task.title && task.dueDate && task.category && task.priority)

    if (validTasks.length === 0) {
      return { success: false, message: "No valid tasks found in the file" }
    }

    // Import each task
    let importedCount = 0
    for (const taskData of validTasks) {
      // Generate a new ID for the task
      const taskId = crypto.randomUUID()

      // Create the task object
      const task: Task = {
        id: taskId,
        title: taskData.title,
        description: taskData.description || "",
        dueDate: taskData.dueDate,
        category: taskData.category,
        priority: taskData.priority,
        completed: taskData.completed || false,
        userId: user.id,
        createdAt: Date.now(),
      }

      // Save the task to Redis
      await redis.hset(`task:${taskId}`, task)

      // Add the task ID to the user's task set
      await redis.sadd(`user:${user.id}:tasks`, taskId)

      importedCount++
    }

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/calendar")

    return {
      success: true,
      message: `Successfully imported ${importedCount} tasks`,
      count: importedCount,
    }
  } catch (error) {
    console.error("Failed to import tasks:", error)
    return { success: false, message: "An error occurred while importing tasks" }
  }
}
