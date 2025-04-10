"use client"
import { useState, useEffect } from "react"
import { TaskRadialVisualization } from "@/components/task-radial-visualization"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, PieChart, Activity, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { TaskVisualizer } from "@/components/task-visualizer"
import { BarChart } from "@/components/bar-chart"
import { PriorityChart } from "@/components/priority-chart"
import type { Task, TaskStats } from "@/lib/types"

// Demo data for visualization
const demoTasks: Task[] = [
  {
    id: "demo-1",
    title: "Complete project proposal",
    description: "Finish the draft and send for review",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], // 2 days from now
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
  },
  {
    id: "demo-2",
    title: "Schedule dentist appointment",
    description: "Call Dr. Smith's office",
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], // 5 days from now
    category: "Health",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: "demo-3",
    title: "Buy groceries",
    description: "Get items for the week",
    dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
    category: "Personal",
    completed: true,
    priority: "low",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 4, // 4 days ago
  },
  {
    id: "demo-4",
    title: "Review quarterly reports",
    description: "Analyze Q1 performance metrics",
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0], // 10 days from now
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    createdAt: Date.now() - 86400000, // 1 day ago
  },
  {
    id: "demo-5",
    title: "Complete online course module",
    description: "Finish React advanced patterns module",
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString().split("T")[0], // 15 days from now
    category: "Learning",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
  },
  {
    id: "demo-6",
    title: "Pay utility bills",
    description: "Pay electricity and water bills",
    dueDate: new Date().toISOString().split("T")[0], // Today
    category: "Personal",
    completed: false,
    priority: "high",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: "demo-7",
    title: "Gym workout",
    description: "Complete 45-minute cardio session",
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0], // 2 days ago
    category: "Health",
    completed: true,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 7, // 7 days ago
  },
  {
    id: "demo-8",
    title: "Read chapter 5",
    description: "Read chapter 5 of programming book",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], // 3 days from now
    category: "Learning",
    completed: false,
    priority: "low",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 1, // 1 day ago
  },
  {
    id: "demo-9",
    title: "Team meeting",
    description: "Weekly team sync",
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0], // 1 day from now
    category: "Work",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: "demo-10",
    title: "Annual checkup",
    description: "Annual physical examination",
    dueDate: new Date(Date.now() + 86400000 * 20).toISOString().split("T")[0], // 20 days from now
    category: "Health",
    completed: false,
    priority: "high",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
  },
]

// Add more tasks to make the visualization richer
const additionalTasks: Task[] = [
  {
    id: "demo-11",
    title: "Weekly team standup",
    description: "Discuss progress and blockers",
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "demo-12",
    title: "Prepare presentation",
    description: "Create slides for client meeting",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "demo-13",
    title: "Yoga class",
    description: "60-minute session",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    category: "Health",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "demo-14",
    title: "Plan weekend trip",
    description: "Research destinations and accommodations",
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0],
    category: "Personal",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "demo-15",
    title: "Complete JavaScript course",
    description: "Finish advanced topics",
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
    category: "Learning",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    createdAt: Date.now() - 86400000 * 5,
  },
]

// Combine all tasks
const allDemoTasks = [...demoTasks, ...additionalTasks]

// Calculate demo stats
const calculateDemoStats = (tasks: Task[]): TaskStats => {
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
}

// Visualization types
type VisualizationType = "dashboard" | "radial" | "3d" | "charts"

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeViz, setActiveViz] = useState<VisualizationType>("dashboard")
  const demoStats = calculateDemoStats(allDemoTasks)

  useEffect(() => {
    // Simulate loading for a smoother experience
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Calculate completion percentages for dashboard
  const completionPercentage = Math.round((demoStats.completed / demoStats.total) * 100)

  // Get category with most tasks
  const topCategory = Object.entries(demoStats.categories).sort((a, b) => b[1].total - a[1].total)[0]

  // Count high priority tasks
  const highPriorityCount = allDemoTasks.filter((task) => task.priority === "high").length

  // Count upcoming tasks (due in next 3 days)
  const today = new Date()
  const threeDaysFromNow = new Date(today)
  threeDaysFromNow.setDate(today.getDate() + 3)
  const upcomingTasks = allDemoTasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate <= threeDaysFromNow && dueDate >= today && !task.completed
  }).length

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
            CheckIt Demo
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="container px-4 py-6 md:px-6 md:py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Powerful Task Visualizations</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Explore how CheckIt transforms your productivity with multiple visualization options. Get insights into
              your tasks from different perspectives.
            </p>
          </div>

          {/* Visualization selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-lg bg-slate-100 shadow-inner">
              <button
                onClick={() => setActiveViz("dashboard")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeViz === "dashboard"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-600 hover:text-purple-600"
                }`}
              >
                <Grid3X3 className="mr-2 h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveViz("radial")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeViz === "radial" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-purple-600"
                }`}
              >
                <PieChart className="mr-2 h-4 w-4" />
                Radial View
              </button>
              <button
                onClick={() => setActiveViz("3d")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeViz === "3d" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-purple-600"
                }`}
              >
                <Activity className="mr-2 h-4 w-4" />
                3D View
              </button>
              <button
                onClick={() => setActiveViz("charts")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeViz === "charts" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-purple-600"
                }`}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Charts
              </button>
            </div>
          </div>

          {/* Visualization container */}
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px] bg-white rounded-xl border shadow-sm">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-500">Loading visualization...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard View */}
              {activeViz === "dashboard" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-xl font-semibold text-slate-800">Task Overview Dashboard</h3>
                    <p className="text-sm text-slate-500">Comprehensive view of your task management</p>
                  </div>

                  <div className="p-6">
                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                            <h4 className="text-3xl font-bold text-purple-700 mt-1">{completionPercentage}%</h4>
                          </div>
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <PieChart className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {demoStats.completed} of {demoStats.total} tasks completed
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Top Category</p>
                            <h4 className="text-3xl font-bold text-indigo-700 mt-1">{topCategory[0]}</h4>
                          </div>
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <BarChart3 className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{ width: `${(topCategory[1].total / demoStats.total) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {topCategory[1].total} tasks ({Math.round((topCategory[1].total / demoStats.total) * 100)}%
                            of total)
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-slate-500">High Priority</p>
                            <h4 className="text-3xl font-bold text-red-600 mt-1">{highPriorityCount}</h4>
                          </div>
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Activity className="h-6 w-6 text-red-500" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                            <div
                              className="bg-red-500 h-2.5 rounded-full"
                              style={{ width: `${(highPriorityCount / demoStats.total) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {Math.round((highPriorityCount / demoStats.total) * 100)}% of tasks are high priority
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Due Soon</p>
                            <h4 className="text-3xl font-bold text-emerald-600 mt-1">{upcomingTasks}</h4>
                          </div>
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Grid3X3 className="h-6 w-6 text-emerald-500" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                            <div
                              className="bg-emerald-500 h-2.5 rounded-full"
                              style={{ width: `${(upcomingTasks / demoStats.total) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Tasks due in the next 3 days</p>
                        </div>
                      </div>
                    </div>

                    {/* Task list preview */}
                    <div className="bg-slate-50 rounded-xl border p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-slate-800 mb-4">Recent Tasks</h4>
                      <div className="space-y-3">
                        {allDemoTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center p-3 bg-white rounded-lg border shadow-sm">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${
                                task.priority === "high"
                                  ? "bg-red-500"
                                  : task.priority === "medium"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{task.title}</h5>
                              <p className="text-sm text-slate-500">
                                {task.category} • Due: {task.dueDate}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  task.completed
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {task.completed ? "Completed" : "Pending"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Radial View */}
              {activeViz === "radial" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-xl font-semibold text-slate-800">Interactive Radial Visualization</h3>
                    <p className="text-sm text-slate-500">Drag category cards to customize your view</p>
                  </div>
                  <div className="h-[600px]">
                    <TaskRadialVisualization tasks={allDemoTasks} stats={demoStats} />
                  </div>
                </div>
              )}

              {/* 3D View */}
              {activeViz === "3d" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-xl font-semibold text-slate-800">3D Task Visualization</h3>
                    <p className="text-sm text-slate-500">Explore your tasks in an immersive 3D environment</p>
                  </div>
                  <div className="h-[600px]">
                    <TaskVisualizer taskStats={demoStats} />
                  </div>
                </div>
              )}

              {/* Charts View */}
              {activeViz === "charts" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-xl font-semibold text-slate-800">Detailed Analytics</h3>
                    <p className="text-sm text-slate-500">Analyze your tasks with comprehensive charts</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h4 className="text-lg font-medium text-slate-800 mb-4">Category Distribution</h4>
                        <BarChart stats={demoStats} title="" description="" />
                      </div>

                      <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h4 className="text-lg font-medium text-slate-800 mb-4">Priority Breakdown</h4>
                        <PriorityChart tasks={allDemoTasks} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-center mt-8">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
              >
                Try the Full Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-sm text-slate-500">© 2025 CheckIt. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm font-medium hover:underline text-purple-600">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline text-indigo-600">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
