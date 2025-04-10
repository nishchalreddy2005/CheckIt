import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getTasks } from "@/app/actions/task-actions"
import { createTask } from "@/app/actions/task-actions-create"
import { deleteTask, toggleTaskCompletion } from "@/app/actions/task-actions"
import { redis } from "@/lib/redis"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const { prompt, action, actionData } = await request.json()

    // Get the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      return NextResponse.json({ error: "GEMINI_API_KEY environment variable is not set" }, { status: 500 })
    }

    // If this is an action request, execute the action directly
    if (action) {
      return await executeAction(action, actionData)
    }

    console.log("Initializing Gemini with API key")

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey)

    // Get the available models
    let model
    try {
      // Try with gemini-1.5-flash first (newer model)
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      console.log("Using gemini-1.5-flash model")
    } catch (error) {
      console.error("Error with gemini-1.5-flash, trying gemini-1.5-pro:", error)
      try {
        // Try with gemini-1.5-pro
        model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
        console.log("Using gemini-1.5-pro model")
      } catch (error2) {
        console.error("Error with gemini-1.5-pro, trying gemini-pro:", error2)
        try {
          // Try with gemini-pro (older model)
          model = genAI.getGenerativeModel({ model: "gemini-pro" })
          console.log("Using gemini-pro model")
        } catch (error3) {
          console.error("All model attempts failed:", error3)
          return NextResponse.json({
            response: JSON.stringify({
              action: "respond",
              responseMessage: "I'm having trouble connecting to my AI services. Please try again later.",
            }),
          })
        }
      }
    }

    // Generate content with safety settings
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }

    const safetySettings = [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ]

    console.log("Sending prompt to Gemini")

    try {
      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      })

      console.log("Received response from Gemini")
      const response = result.response.text()

      return NextResponse.json({ response })
    } catch (generationError) {
      console.error("Error generating content with Gemini:", generationError)

      // Return a simple error response that won't break the client
      return NextResponse.json({
        response: JSON.stringify({
          action: "respond",
          responseMessage: "I'm having trouble connecting to my AI services right now. Please try again in a moment.",
        }),
      })
    }
  } catch (error) {
    console.error("Error in Gemini API route:", error)
    return NextResponse.json({
      response: JSON.stringify({
        action: "respond",
        responseMessage: "I encountered a technical issue. Please try again.",
      }),
    })
  }
}

// Execute actions directly from the API route
async function executeAction(action: string, data: any) {
  try {
    console.log(`Executing action: ${action}`, data)

    // Check Redis connection first
    try {
      await redis.ping()
    } catch (redisError) {
      console.error("Redis connection error:", redisError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error. Please try again later.",
        },
        { status: 503 },
      ) // Service Unavailable
    }

    switch (action) {
      case "get_tasks": {
        try {
          const tasks = await getTasks()
          return NextResponse.json({ success: true, tasks })
        } catch (error) {
          console.error("Error in get_tasks:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to retrieve tasks. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "create_task": {
        try {
          const formData = new FormData()
          formData.append("title", data.title)
          formData.append("description", data.description || "")
          formData.append("dueDate", new Date(data.dueDate || Date.now()).toISOString())
          formData.append("category", data.category || "Work")
          formData.append("priority", data.priority || "medium")

          const result = await createTask(formData)
          if (!result) {
            return NextResponse.json(
              {
                success: false,
                error: "Failed to create task. Please check your input and try again.",
              },
              { status: 400 },
            )
          }
          return NextResponse.json({ success: true, result })
        } catch (error) {
          console.error("Error in create_task:", error)
          return NextResponse.json(
            {
              success: false,
              error: error.message || "Failed to create task. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "delete_task": {
        try {
          if (!data.id) {
            // If we only have a title, find the task first
            if (data.title) {
              const tasks = await getTasks()
              const taskToDelete = tasks.find((task) => task.title.toLowerCase().includes(data.title.toLowerCase()))

              if (taskToDelete) {
                const formData = new FormData()
                formData.append("id", taskToDelete.id)
                const result = await deleteTask(formData)
                return NextResponse.json({ success: true, result, task: taskToDelete })
              } else {
                return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
              }
            }

            return NextResponse.json({ success: false, error: "Task ID or title required" }, { status: 400 })
          }

          const formData = new FormData()
          formData.append("id", data.id)
          const result = await deleteTask(formData)
          return NextResponse.json({ success: true, result })
        } catch (error) {
          console.error("Error in delete_task:", error)
          return NextResponse.json(
            {
              success: false,
              error: error.message || "Failed to delete task. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "toggle_task": {
        try {
          if (!data.id) {
            // If we only have a title, find the task first
            if (data.title) {
              const tasks = await getTasks()
              const taskToToggle = tasks.find((task) => task.title.toLowerCase().includes(data.title.toLowerCase()))

              if (taskToToggle) {
                const formData = new FormData()
                formData.append("id", taskToToggle.id)
                const result = await toggleTaskCompletion(formData)
                return NextResponse.json({ success: true, result, task: taskToToggle })
              } else {
                return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
              }
            }

            return NextResponse.json({ success: false, error: "Task ID or title required" }, { status: 400 })
          }

          const formData = new FormData()
          formData.append("id", data.id)
          const result = await toggleTaskCompletion(formData)
          return NextResponse.json({ success: true, result })
        } catch (error) {
          console.error("Error in toggle_task:", error)
          return NextResponse.json(
            {
              success: false,
              error: error.message || "Failed to update task. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "get_tasks_by_date": {
        try {
          const tasks = await getTasks()
          const dateStr = data.date

          if (!dateStr) {
            return NextResponse.json({ success: false, error: "Date required" }, { status: 400 })
          }

          // Format the date for comparison
          const specificDate = new Date(dateStr)
          const dateForComparison = specificDate.toISOString().split("T")[0]

          // Filter tasks for the specific date
          const tasksOnDate = tasks.filter((task) => {
            const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
            return taskDate === dateForComparison
          })

          return NextResponse.json({
            success: true,
            tasks: tasksOnDate,
            date: format(specificDate, "MMMM do, yyyy"),
          })
        } catch (error) {
          console.error("Error in get_tasks_by_date:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to retrieve tasks. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "get_upcoming_tasks": {
        try {
          const tasks = await getTasks()
          const today = new Date().toISOString().split("T")[0]

          // Filter tasks for upcoming (future dates, not completed)
          const upcomingTasks = tasks.filter((task) => {
            const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
            return taskDate > today && !task.completed
          })

          return NextResponse.json({ success: true, tasks: upcomingTasks })
        } catch (error) {
          console.error("Error in get_upcoming_tasks:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to retrieve upcoming tasks. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "search_tasks": {
        try {
          const tasks = await getTasks()
          const query = data.query?.toLowerCase()

          if (!query) {
            return NextResponse.json({ success: false, error: "Search query required" }, { status: 400 })
          }

          const matchingTasks = tasks.filter(
            (task) =>
              task.title.toLowerCase().includes(query) ||
              task.description.toLowerCase().includes(query) ||
              task.category.toLowerCase().includes(query),
          )

          return NextResponse.json({ success: true, tasks: matchingTasks })
        } catch (error) {
          console.error("Error in search_tasks:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to search tasks. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "get_task_stats": {
        try {
          const tasks = await getTasks()

          // Calculate basic stats
          const completedTasks = tasks.filter((task) => task.completed)
          const pendingTasks = tasks.filter((task) => !task.completed)

          // Group by priority
          const highPriority = tasks.filter((task) => task.priority === "high")
          const mediumPriority = tasks.filter((task) => task.priority === "medium")
          const lowPriority = tasks.filter((task) => task.priority === "low")

          // Group by category
          const categories = {}
          tasks.forEach((task) => {
            if (!categories[task.category]) {
              categories[task.category] = 0
            }
            categories[task.category]++
          })

          return NextResponse.json({
            success: true,
            stats: {
              total: tasks.length,
              completed: completedTasks.length,
              pending: pendingTasks.length,
              priorities: {
                high: highPriority.length,
                medium: mediumPriority.length,
                low: lowPriority.length,
              },
              categories,
            },
          })
        } catch (error) {
          console.error("Error in get_task_stats:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to retrieve task statistics. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      case "get_database_info": {
        try {
          // Get some basic database stats (safely)
          const userCount = (await redis.keys("user:*")).length
          const taskCount = (await redis.keys("task:*")).length
          const sessionCount = (await redis.keys("session:*")).length

          return NextResponse.json({
            success: true,
            dbInfo: {
              userCount,
              taskCount,
              sessionCount,
              provider: "Upstash Redis",
              status: "connected",
            },
          })
        } catch (error) {
          console.error("Error in get_database_info:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to retrieve database information. Please try again.",
            },
            { status: 500 },
          )
        }
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error(`Error executing action ${action}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: `Error executing action: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
