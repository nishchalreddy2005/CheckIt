import { NextResponse } from "next/server"
import { redis, generateId } from "@/lib/redis"
import { getCurrentUser } from "@/app/actions/user-actions"
import { DEMO_USER_ID } from "@/lib/init-db"
import type { Task } from "@/lib/types"
import { revalidatePath } from "next/cache"

// API route for creating tasks
export async function POST(request: Request) {
  try {
    // Check Redis connection first
    try {
      await redis.ping()
    } catch (redisError) {
      console.error("Redis connection error in API route:", redisError)
      return NextResponse.json(
        { success: false, message: "Database connection error. Please try again later." },
        { status: 503 },
      )
    }

    // Get the current user
    let userId
    try {
      const user = await getCurrentUser()
      userId = user ? user.id : DEMO_USER_ID
    } catch (userError) {
      console.error("Error getting current user:", userError)
      userId = DEMO_USER_ID
    }

    // Parse the request body
    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ success: false, message: "Invalid request format" }, { status: 400 })
    }

    // Validate required fields
    if (!data.title) {
      return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 })
    }

    if (!data.dueDate) {
      return NextResponse.json({ success: false, message: "Due date is required" }, { status: 400 })
    }

    if (!data.category) {
      return NextResponse.json({ success: false, message: "Category is required" }, { status: 400 })
    }

    if (!data.priority) {
      return NextResponse.json({ success: false, message: "Priority is required" }, { status: 400 })
    }

    const id = generateId()
    const now = Date.now()

    // If userId was provided in the request, use it (for testing)
    if (data.userId) {
      userId = data.userId
    }

    const task: Task = {
      id,
      title: data.title,
      description: data.description || "",
      dueDate: data.dueDate,
      category: data.category,
      priority: data.priority,
      completed: false,
      userId,
      createdAt: now,
    }

    console.log("Creating task via API:", task)

    // Store task data
    await redis.hset(`task:${id}`, task)

    // Add task ID to user's task set
    await redis.sadd(`user:${userId}:tasks`, id)

    // Revalidate paths to ensure calendar is updated
    try {
      revalidatePath("/dashboard")
      revalidatePath("/calendar")
      revalidatePath("/") // Revalidate root path as well
    } catch (revalidateError) {
      console.error("Error revalidating paths:", revalidateError)
      // Continue even if revalidation fails
    }

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      task,
    })
  } catch (error) {
    console.error("Failed to create task via API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create task: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// API route for getting tasks
export async function GET() {
  try {
    // Get the current user
    const user = await getCurrentUser()
    const userId = user ? user.id : DEMO_USER_ID

    const taskIds = await redis.smembers(`user:${userId}:tasks`)

    // Check if taskIds is an array and has length
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ tasks: [] })
    }

    // Use Promise.all to fetch all tasks in parallel
    const tasksPromises = taskIds.map(async (id) => {
      try {
        const taskData = await redis.hgetall(`task:${id}`)
        if (!taskData || Object.keys(taskData).length === 0) {
          return null
        }

        // Convert string boolean to actual boolean
        return {
          ...taskData,
          completed: taskData.completed === "true" || taskData.completed === true,
        } as Task
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

    return NextResponse.json({ tasks: filteredTasks })
  } catch (error) {
    console.error("Failed to get tasks:", error)
    return NextResponse.json({ success: false, message: "Failed to get tasks" }, { status: 500 })
  }
}
