import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/task-list"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { getTasks, getTaskStats } from "@/app/actions/task-actions"
import { getCurrentUser } from "@/app/actions/user-actions"
import { LogoutButton } from "@/components/logout-button"
import { LiveClock } from "@/components/live-clock"
import { TaskRadialVisualization } from "@/components/task-radial-visualization"
import { BarChart } from "@/components/bar-chart"
import { RedisStatus } from "@/components/redis-status"
import { SimpleTaskForm } from "@/components/simple-task-form"
import { DirectTaskButton } from "@/components/direct-task-button"
import type { Task } from "@/lib/types"

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

  // Fetch tasks from Redis for the current user
  let tasks: Task[] = []
  let stats = { completed: 0, total: 0, categories: {} }

  try {
    tasks = await getTasks(user.id)
    stats = await getTaskStats(user.id)
  } catch (error) {
    console.error("Error fetching tasks or stats:", error)
    // Continue with empty data rather than failing completely
  }

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

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

          <div className="grid gap-6 md:grid-cols-[1fr_250px] lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                  <p className="text-muted-foreground">Manage your tasks and visualize your productivity</p>
                </div>
                <div className="mt-2 sm:mt-0 flex gap-2">
                  {/* Include both button types */}
                  <SimpleTaskForm userId={user.id} />
                  <DirectTaskButton />
                  <Link href="/add-task">
                    <Button variant="outline">Add Task (Page)</Button>
                  </Link>
                </div>
              </div>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4 pt-4">
                  <Suspense fallback={<DashboardSkeleton />}>
                    <TaskList initialTasks={tasks} userId={user.id} />
                  </Suspense>
                </TabsContent>
                <TabsContent value="today" className="space-y-4 pt-4">
                  <Suspense fallback={<DashboardSkeleton />}>
                    <TaskList initialTasks={tasks} userId={user.id} filter="today" />
                  </Suspense>
                </TabsContent>
                <TabsContent value="upcoming" className="space-y-4 pt-4">
                  <Suspense fallback={<DashboardSkeleton />}>
                    <TaskList initialTasks={tasks} userId={user.id} filter="upcoming" />
                  </Suspense>
                </TabsContent>
                <TabsContent value="completed" className="space-y-4 pt-4">
                  <Suspense fallback={<DashboardSkeleton />}>
                    <TaskList initialTasks={tasks} userId={user.id} filter="completed" />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                  <CardDescription>Your task completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                      <span className="text-2xl font-bold text-purple-600">{completionPercentage}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stats.completed} of {stats.total} tasks completed
                    </p>
                  </div>
                </CardContent>
              </Card>
              <BarChart stats={stats} />
            </div>
          </div>
        </div>
      </main>
      <section className="py-12 bg-gray-100">
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
