"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, AlertTriangle, BarChart3 } from "lucide-react"
import type { Task } from "@/lib/types"
import { BarChart } from "@/components/bar-chart"
import { PriorityChart } from "@/components/priority-chart"

interface TaskStatisticsDashboardProps {
  tasks: Task[]
}

export function TaskStatisticsDashboard({ tasks }: TaskStatisticsDashboardProps) {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
    dueTomorrow: 0,
    categories: {} as Record<string, { total: number; completed: number }>,
    priorities: {
      high: 0,
      medium: 0,
      low: 0,
    },
  })

  // Calculate statistics
  useEffect(() => {
    if (!Array.isArray(tasks)) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const newStats = {
      total: tasks.length,
      completed: 0,
      pending: 0,
      overdue: 0,
      dueToday: 0,
      dueTomorrow: 0,
      categories: {} as Record<string, { total: number; completed: number }>,
      priorities: {
        high: 0,
        medium: 0,
        low: 0,
      },
    }

    tasks.forEach((task) => {
      // Count by completion status
      if (task.completed) {
        newStats.completed++
      } else {
        newStats.pending++

        // Check if overdue
        const dueDate = new Date(task.dueDate || new Date())
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < today) {
          newStats.overdue++
        } else if (dueDate.getTime() === today.getTime()) {
          newStats.dueToday++
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          newStats.dueTomorrow++
        }
      }

      // Count by category
      const category = task.category || "Uncategorized"
      if (!newStats.categories[category]) {
        newStats.categories[category] = { total: 0, completed: 0 }
      }
      newStats.categories[category].total++
      if (task.completed) {
        newStats.categories[category].completed++
      }

      // Count by priority
      if (task.priority && task.priority in newStats.priorities) {
        newStats.priorities[task.priority as keyof typeof newStats.priorities]++
      }
    })

    setStats(newStats)
  }, [tasks])

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        {/* Total Tasks Card */}
        <Card className="w-full glass-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60">Total Tasks</p>
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-500">{stats.total}</h3>
              </div>
              <div className="rounded-2xl bg-indigo-500/20 p-3 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <div className="flex items-center">
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="text-white/70">Completed: {stats.completed}</span>
              </div>
              <div className="ml-4 flex items-center">
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                <span className="text-white/70">Pending: {stats.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate Card */}
        <Card className="w-full glass-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60">Completion Rate</p>
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">{completionPercentage}%</h3>
              </div>
              <div className="rounded-2xl bg-emerald-500/20 p-3 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-black/40 border border-white/5">
              <div className="h-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Due Soon Card */}
        <Card className="w-full glass-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60">Due Soon</p>
                <h3 className="text-3xl font-extrabold text-white drop-shadow-md">{stats.dueToday + stats.dueTomorrow}</h3>
              </div>
              <div className="rounded-2xl bg-amber-500/20 p-3 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <div className="flex items-center">
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(2fb,146, ৬০,0.8)]"></div>
                <span className="text-white/70">Today: {stats.dueToday}</span>
              </div>
              <div className="ml-4 flex items-center">
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                <span className="text-white/70">Tomorrow: {stats.dueTomorrow}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card className="w-full glass-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60">Overdue</p>
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">{stats.overdue}</h3>
              </div>
              <div className="rounded-2xl bg-red-500/20 p-3 shadow-[0_0_15px_rgba(248,113,113,0.3)]">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium">
              <span className="text-red-300 drop-shadow-sm">
                {stats.overdue > 0
                  ? `${Math.round((stats.overdue / stats.pending) * 100)}% of pending tasks are overdue`
                  : "No overdue tasks"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger value="categories" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Categories</TabsTrigger>
          <TabsTrigger value="priorities" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Priorities</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="text-white drop-shadow-md">Tasks by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                stats={{
                  completed: stats.completed,
                  total: stats.total,
                  categories: stats.categories,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="priorities" className="mt-4">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="text-white drop-shadow-md">Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <PriorityChart tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
