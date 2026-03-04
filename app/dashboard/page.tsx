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
  let tasks: any[] = []
  let stats: any = { completed: 0, total: 0, categories: {} }

  try {
    tasks = await getTasks(user.id)
    stats = await getTaskStats(user.id)
  } catch (error) {
    console.error("Error fetching tasks or stats:", error)
  }

  // Extract unique categories
  const categories = Object.keys(stats.categories)

  const sections: Record<string, React.ReactNode> = {
    tasks: (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between glass-panel p-6 rounded-2xl">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Task Console</h2>
            <p className="text-white/60 mt-1">Manage your tasks and command your productivity node</p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <SimpleTaskForm userId={user.id} />
            <VoiceAssistantHelp />
          </div>
        </div>
        <Suspense>
          <DashboardContent tasks={tasks} userId={user.id} categories={categories} />
        </Suspense>
      </div>
    ),
    stats: (
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-500 rounded-full" />
          Real-time Analytics
        </h2>
        <TaskStatisticsDashboard tasks={tasks} />
      </div>
    ),
    visuals: (
      <section className="relative z-10 w-full">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-white drop-shadow-lg flex items-center gap-3">
          <div className="h-6 w-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
          Task Visualization System
        </h2>
        <div className="w-full rounded-2xl glass-card p-2 md:p-6 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none rounded-2xl overflow-hidden" />
          <div className="relative z-10">
            <TaskRadialVisualization tasks={tasks} stats={stats} />
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="flex min-h-screen flex-col text-white bg-transparent">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030014]/50 backdrop-blur-xl shrink-0">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span className="font-bold text-white leading-none">C</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CheckIt</h1>
          </Link>
          <div className="ml-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-white/80 text-xs font-medium tracking-wider uppercase">Welcome, {user.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            <LiveClock user={user} />
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link href="/calendar" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Calendar
              </Link>
              <Link href="/analytics" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Analytics
              </Link>
              <Link href="/settings" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Settings
              </Link>
              <div className="scale-90 opacity-90 hover:opacity-100 transition-opacity">
                <LogoutButton />
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <RedisStatus />

          <div className="mt-8 space-y-12">
            {sections.tasks}
            {sections.stats}
            {sections.visuals}
          </div>
        </div>
      </main>
      <Separator className="bg-white/10" />
      <footer className="py-6 text-center text-white/40 text-xs">
        &copy; {new Date().getFullYear()} CheckIt Quantum Productivity Suite
      </footer>
    </div>
  )
}

