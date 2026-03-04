"use client"
import { useState, useEffect } from "react"
import { TaskRadialVisualization } from "@/components/task-radial-visualization"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, PieChart, Activity, Grid3X3, Layers } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"

const TaskVisualizer = dynamic(() => import("@/components/task-visualizer").then((mod) => mod.TaskVisualizer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      <p className="text-sm text-indigo-300 font-medium animate-pulse tracking-widest uppercase">Initializing 3D Engine...</p>
    </div>
  ),
})
import { BarChart } from "@/components/bar-chart"
import { PriorityChart } from "@/components/priority-chart"
import type { Task, TaskStats } from "@/lib/types"

// Demo data for visualization
const demoTasks: Task[] = [
  {
    id: "demo-1",
    title: "Complete project proposal",
    description: "Finish the draft and send for review",
    dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
  },
  {
    id: "demo-2",
    title: "Schedule dentist appointment",
    description: "Call Dr. Smith's office",
    dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
    category: "Health",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  {
    id: "demo-3",
    title: "Buy groceries",
    description: "Get items for the week",
    dueDate: new Date(Date.now() - 86400000), // Yesterday
    category: "Personal",
    completed: true,
    priority: "low",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 4), // 4 days ago
  },
  {
    id: "demo-4",
    title: "Review quarterly reports",
    description: "Analyze Q1 performance metrics",
    dueDate: new Date(Date.now() + 86400000 * 10), // 10 days from now
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: "demo-5",
    title: "Complete online course module",
    description: "Finish React advanced patterns module",
    dueDate: new Date(Date.now() + 86400000 * 15), // 15 days from now
    category: "Learning",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
  },
  {
    id: "demo-6",
    title: "Pay utility bills",
    description: "Pay electricity and water bills",
    dueDate: new Date(), // Today
    category: "Personal",
    completed: false,
    priority: "high",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  {
    id: "demo-7",
    title: "Gym workout",
    description: "Complete 45-minute cardio session",
    dueDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    category: "Health",
    completed: true,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
  },
  {
    id: "demo-8",
    title: "Read chapter 5",
    description: "Read chapter 5 of programming book",
    dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    category: "Learning",
    completed: false,
    priority: "low",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
  },
  {
    id: "demo-9",
    title: "Team meeting",
    description: "Weekly team sync",
    dueDate: new Date(Date.now() + 86400000 * 1), // 1 day from now
    category: "Work",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  {
    id: "demo-10",
    title: "Annual checkup",
    description: "Annual physical examination",
    dueDate: new Date(Date.now() + 86400000 * 20), // 20 days from now
    category: "Health",
    completed: false,
    priority: "high",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
  },
]

// Add more tasks to make the visualization richer
const additionalTasks: Task[] = [
  {
    id: "demo-11",
    title: "Weekly team standup",
    description: "Discuss progress and blockers",
    dueDate: new Date(Date.now() + 86400000 * 4),
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: "demo-12",
    title: "Prepare presentation",
    description: "Create slides for client meeting",
    dueDate: new Date(Date.now() + 86400000 * 7),
    category: "Work",
    completed: false,
    priority: "high",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "demo-13",
    title: "Yoga class",
    description: "60-minute session",
    dueDate: new Date(Date.now() + 86400000 * 3),
    category: "Health",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: "demo-14",
    title: "Plan weekend trip",
    description: "Research destinations and accommodations",
    dueDate: new Date(Date.now() + 86400000 * 10),
    category: "Personal",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: "demo-15",
    title: "Complete JavaScript course",
    description: "Finish advanced topics",
    dueDate: new Date(Date.now() + 86400000 * 14),
    category: "Learning",
    completed: false,
    priority: "medium",
    userId: "demo-user",
    sharedWith: [],
    createdAt: new Date(Date.now() - 86400000 * 5),
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
    if (!stats.categories[task.category || 'General']) {
      stats.categories[task.category || 'General'] = { completed: 0, total: 0 }
    }

    // Increment category total
    stats.categories[task.category || 'General'].total++

    // Increment completed counts if task is completed
    if (task.completed) {
      stats.completed++
      stats.categories[task.category || 'General'].completed++
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
    setIsLoading(false)
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
    if (!task.dueDate) return false
    const dueDate = new Date(task.dueDate)
    return dueDate <= threeDaysFromNow && dueDate >= today && !task.completed
  }).length

  return (
    <div className="flex flex-col min-h-screen text-white bg-transparent">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030014]/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center text-white/70 hover:text-white transition-colors group">
            <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium tracking-wide uppercase">Back</span>
          </Link>
          <div className="mx-auto flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(99,102,241,0.3)] animate-gradient-x">
              Next-Gen Visualizations
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">Interactive Experience</h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              Explore how your productivity constellation evolves with data-driven fluid 3D graphics and responsive analytics.
            </p>
          </motion.div>

          {/* Visualization selector */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-10 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0"
          >
            <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              {[
                { id: "dashboard", icon: Grid3X3, label: "Hub" },
                { id: "radial", icon: PieChart, label: "Radial" },
                { id: "3d", icon: Layers, label: "3D Sphere" },
                { id: "charts", icon: BarChart3, label: "Metrics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveViz(tab.id as VisualizationType)}
                  className={`relative flex items-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all z-10 overflow-hidden ${activeViz === tab.id
                    ? "text-white drop-shadow-md"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                >
                  {activeViz === tab.id && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 bg-indigo-500/30 border border-indigo-400/50 rounded-xl shadow-[inset_0_0_15px_rgba(99,102,241,0.5)] -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <tab.icon className={`mr-2 h-4 w-4 ${activeViz === tab.id ? "text-indigo-300" : ""}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Visualization container */}
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px] glass-panel rounded-2xl border-white/10 shadow-2xl">
                <div className="flex flex-col items-center">
                  <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  <p className="text-indigo-300 animate-pulse uppercase tracking-widest text-sm font-bold">Syncing Data...</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeViz}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Dashboard View */}
                  {activeViz === "dashboard" && (
                    <div className="glass-card rounded-2xl border-none shadow-2xl overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                      <div className="p-6 md:p-8 border-b border-white/10 bg-black/20">
                        <h3 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Command Center Dashboard</h3>
                        <p className="text-white/60 mt-1">Holistic view of your interconnected task topology</p>
                      </div>

                      <div className="p-6 md:p-8">
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                          <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-panel p-6 rounded-2xl border-t border-l border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group/card text-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                              <div>
                                <p className="text-sm font-medium text-white/60 uppercase tracking-wider">Completion</p>
                                <h4 className="text-4xl font-black text-indigo-400 mt-2 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">{completionPercentage}%</h4>
                              </div>
                              <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                <PieChart className="h-6 w-6 text-indigo-300" />
                              </div>
                            </div>
                            <div className="mt-6 relative z-10">
                              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${completionPercentage}%` }}
                                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                                />
                              </div>
                              <p className="text-xs text-indigo-200 mt-3 font-medium">
                                {demoStats.completed} of {demoStats.total} nodes synchronized
                              </p>
                            </div>
                          </motion.div>

                          <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-panel p-6 rounded-2xl border-t border-l border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group/card text-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                              <div>
                                <p className="text-sm font-medium text-white/60 uppercase tracking-wider">Top Sector</p>
                                <h4 className="text-2xl font-black text-cyan-400 mt-2 break-all drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{topCategory[0]}</h4>
                              </div>
                              <div className="bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <BarChart3 className="h-6 w-6 text-cyan-300" />
                              </div>
                            </div>
                            <div className="mt-6 relative z-10">
                              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(topCategory[1].total / demoStats.total) * 100}%` }}
                                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                />
                              </div>
                              <p className="text-xs text-cyan-200 mt-3 font-medium">
                                {topCategory[1].total} sub-routines ({Math.round((topCategory[1].total / demoStats.total) * 100)}%)
                              </p>
                            </div>
                          </motion.div>

                          <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-panel p-6 rounded-2xl border-t border-l border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group/card text-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                              <div>
                                <p className="text-sm font-medium text-white/60 uppercase tracking-wider">Critical Tasks</p>
                                <h4 className="text-4xl font-black text-pink-400 mt-2 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]">{highPriorityCount}</h4>
                              </div>
                              <div className="bg-pink-500/20 p-3 rounded-xl border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                <Activity className="h-6 w-6 text-pink-300" />
                              </div>
                            </div>
                            <div className="mt-6 relative z-10">
                              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(highPriorityCount / demoStats.total) * 100}%` }}
                                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                />
                              </div>
                              <p className="text-xs text-pink-200 mt-3 font-medium">
                                {Math.round((highPriorityCount / demoStats.total) * 100)}% density of high priority
                              </p>
                            </div>
                          </motion.div>

                          <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-panel p-6 rounded-2xl border-t border-l border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group/card text-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                              <div>
                                <p className="text-sm font-medium text-white/60 uppercase tracking-wider">Impending</p>
                                <h4 className="text-4xl font-black text-emerald-400 mt-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">{upcomingTasks}</h4>
                              </div>
                              <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <Grid3X3 className="h-6 w-6 text-emerald-300" />
                              </div>
                            </div>
                            <div className="mt-6 relative z-10">
                              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(upcomingTasks / demoStats.total) * 100}%` }}
                                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                                />
                              </div>
                              <p className="text-xs text-emerald-200 mt-3 font-medium">Imminent in stellar cycle (72h)</p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Task list preview */}
                        <div className="glass-panel rounded-2xl border-white/10 p-6 shadow-2xl relative overflow-hidden">
                          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                          <h4 className="text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse" />
                            Active Signal Stream
                          </h4>
                          <div className="space-y-3">
                            {allDemoTasks.slice(0, 5).map((task, idx) => (
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                key={task.id}
                                className="flex items-center p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5 backdrop-blur-sm"
                              >
                                <div
                                  className={`w-3 h-3 rounded-full mr-4 shadow-[0_0_10px_currentColor] ${task.priority === "high"
                                    ? "bg-pink-500 text-pink-500"
                                    : task.priority === "medium"
                                      ? "bg-amber-400 text-amber-400"
                                      : "bg-emerald-400 text-emerald-400"
                                    }`}
                                ></div>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-white tracking-wide">{task.title}</h5>
                                  <p className="text-sm text-white/50 mt-1 uppercase text-[10px] tracking-wider font-bold">
                                    {task.category} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                                  </p>
                                </div>
                                <div className="flex items-center ml-4">
                                  <span
                                    className={`px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full border ${task.completed
                                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]"
                                      : "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]"
                                      }`}
                                  >
                                    {task.completed ? "Resolved" : "Active"}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Radial View */}
                  {activeViz === "radial" && (
                    <div className="glass-card rounded-2xl border-none shadow-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-cyan-500/5" />
                      <div className="p-6 md:p-8 border-b border-white/10 relative z-10 bg-black/20">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">Interactive Radial Mapping</h3>
                        <p className="text-white/60 mt-1">Holographic representation of sector density. Drag to reposition.</p>
                      </div>
                      <div className="h-[600px] relative z-10">
                        <TaskRadialVisualization tasks={allDemoTasks} stats={demoStats} />
                      </div>
                    </div>
                  )}

                  {/* 3D View */}
                  {activeViz === "3d" && (
                    <div className="glass-card rounded-2xl border-none shadow-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-pink-500/5" />
                      <div className="p-6 md:p-8 border-b border-white/10 relative z-10 bg-black/20">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">Spatial Depth Analysis</h3>
                        <p className="text-white/60 mt-1">Navigate your operational load in absolute 3D coordinate space</p>
                      </div>
                      <div className="h-[600px] relative z-10">
                        <TaskVisualizer taskStats={demoStats} />
                      </div>
                    </div>
                  )}

                  {/* Charts View */}
                  {activeViz === "charts" && (
                    <div className="glass-card rounded-2xl border-none shadow-2xl overflow-hidden relative">
                      <div className="p-6 md:p-8 border-b border-white/10 relative z-10 bg-black/20">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">Analytical Optics</h3>
                        <p className="text-white/60 mt-1">Cross-matrix mapping and priority distribution</p>
                      </div>
                      <div className="p-6 md:p-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 rounded-2xl shadow-xl border-white/10 bg-black/20">
                            <h4 className="text-lg font-bold text-white mb-6 tracking-wide">Category Dispersion Engine</h4>
                            <div className="invert-[0.9] hue-rotate-180 brightness-150 saturate-[1.5]">
                              <BarChart stats={demoStats} title="" description="" />
                            </div>
                          </motion.div>

                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl shadow-xl border-white/10 bg-black/20">
                            <h4 className="text-lg font-bold text-white mb-6 tracking-wide">Severity Matrix Overlay</h4>
                            <div className="invert-[0.9] brightess-150 saturate-[1.5]">
                              <PriorityChart tasks={allDemoTasks} />
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex justify-center mt-12 relative z-20"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="px-10 py-6 text-lg tracking-wider font-bold bg-indigo-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] transition-all duration-300 rounded-full"
              >
                Access Network Command
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 bg-black/40 backdrop-blur-xl relative z-10">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-sm text-white/50 tracking-wider">© 2026 CHECKIT PROTOCOL. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm font-medium text-white/50 hover:text-cyan-400 transition-colors uppercase tracking-widest text-[10px]">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium text-white/50 hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
