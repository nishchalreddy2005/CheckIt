import { redis, generateId } from "./redis"

// Demo user ID - we'll use this for the demo application
export const DEMO_USER_ID = "demo-user-123"

// Sample tasks for initialization
const sampleTasks = [
  {
    title: "Complete project proposal",
    description: "Finish the draft and send for review",
    dueDate: "2025-04-05",
    category: "Work",
    completed: false,
    priority: "high",
  },
  {
    title: "Schedule dentist appointment",
    description: "Call Dr. Smith's office",
    dueDate: "2025-04-10",
    category: "Health",
    completed: false,
    priority: "medium",
  },
  {
    title: "Buy groceries",
    description: "Get items for the week",
    dueDate: "2025-04-02",
    category: "Personal",
    completed: true,
    priority: "low",
  },
  {
    title: "Review quarterly reports",
    description: "Analyze Q1 performance metrics",
    dueDate: "2025-04-15",
    category: "Work",
    completed: false,
    priority: "high",
  },
  {
    title: "Complete online course module",
    description: "Finish React advanced patterns module",
    dueDate: "2025-04-20",
    category: "Learning",
    completed: false,
    priority: "medium",
  },
]

// Function to initialize the database with demo data
export async function initializeDatabase() {
  try {
    // Check if demo user exists
    const userExists = await redis.exists(`user:${DEMO_USER_ID}`)

    // Create demo user if it doesn't exist
    if (!userExists) {
      await redis.hset(`user:${DEMO_USER_ID}`, {
        id: DEMO_USER_ID,
        email: "demo@checkit.com",
        name: "Demo User",
        createdAt: Date.now(),
      })

      // Create sample tasks for the demo user
      for (const taskData of sampleTasks) {
        const id = generateId()
        const now = Date.now()

        const task = {
          ...taskData,
          id,
          userId: DEMO_USER_ID,
          createdAt: now,
        }

        // Store task data
        await redis.hset(`task:${id}`, task)

        // Add task ID to user's task set
        await redis.sadd(`user:${DEMO_USER_ID}:tasks`, id)
      }

      return true
    }

    return false
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return false
  }
}
