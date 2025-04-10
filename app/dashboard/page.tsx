import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getTasks, getTaskStats } from "@/app/actions/task-actions"
import { getCurrentUser } from "@/app/actions/user-actions"
import { LogoutButton } from "@/components/logout-button"
import { LiveClock } from "@/components/live-clock"
import { TaskRadialVisualization } from "@/components/task-radial-visualization"
import { RedisStatus } from "@/components/redis-status"
import { SimpleTaskForm } from "@/components/simple-task-form"
import { TaskStatisticsDashboard } from "@/components/task-statistics-dashboard"
import { Separator } from "@/components/ui/separator"
import { DashboardContent } from "@/components/dashboard-content"
import { VoiceAssistantHelp } from "@/components/voice-assistant-help"

export default async function DashboardPage() {
  // Get the current user
  let user
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error("Error getting current user:", error)
    // Redirect to login page with error parameter
    redirect("/login?error=session")
  }

  // If no user is logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // If user is an admin, redirect to admin dashboard
  if (user.isAdmin) {
    redirect("/admin")
  }

  // Fetch tasks from Redis for the current user
  let tasks = []
  let stats = { completed: 0, total: 0, categories: {} }

  try {
    tasks = await getTasks(user.id)
    stats = await getTaskStats(user.id)
  } catch (error) {
    console.error("Error fetching tasks or stats:", error)
    // Continue with empty data rather than failing completely
  }

  // Extract unique categories
  const categories = Object.keys(stats.categories)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">CheckIt</h1>
          </Link>
          <div className="ml-4 text-sm text-muted-foreground">Welcome, {user.name}</div>
          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            <LiveClock user={user} />
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link href="/profile" className="text-sm font-medium hover:underline">
                Profile
              </Link>
              <Link href="/settings" className="text-sm font-medium hover:underline">
                Settings
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          {/* Add the RedisStatus component here */}
          <RedisStatus />

          <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                  <p className="text-muted-foreground">Manage your tasks and visualize your productivity</p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center gap-2">
                  <SimpleTaskForm userId={user.id} />
                  <VoiceAssistantHelp />
                </div>
              </div>

              {/* Task search and filter */}
              <Suspense>
                <DashboardContent tasks={tasks} userId={user.id} categories={categories} />
              </Suspense>
            </div>
            <div className="space-y-6">
              <TaskStatisticsDashboard tasks={tasks} />
            </div>
          </div>
        </div>
      </main>
      <Separator />
      <section className="py-12 bg-gray-50">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Task Visualization</h2>
          <div className="w-full rounded-xl overflow-hidden border bg-white shadow-sm">
            <TaskRadialVisualization tasks={tasks} stats={stats} />
          </div>
        </div>
      </section>
    </div>
  )
}
