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
        const dueDate = new Date(task.dueDate)
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
      if (!newStats.categories[task.category]) {
        newStats.categories[task.category] = { total: 0, completed: 0 }
      }
      newStats.categories[task.category].total++
      if (task.completed) {
        newStats.categories[task.category].completed++
      }

      // Count by priority
      if (task.priority in newStats.priorities) {
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
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <div className="flex items-center">
                <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Completed: {stats.completed}</span>
              </div>
              <div className="ml-3 flex items-center">
                <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Pending: {stats.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate Card */}
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <h3 className="text-2xl font-bold">{completionPercentage}%</h3>
              </div>
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-green-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Due Soon Card */}
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                <h3 className="text-2xl font-bold">{stats.dueToday + stats.dueTomorrow}</h3>
              </div>
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <div className="flex items-center">
                <div className="mr-1 h-2 w-2 rounded-full bg-orange-500"></div>
                <span className="text-muted-foreground">Today: {stats.dueToday}</span>
              </div>
              <div className="ml-3 flex items-center">
                <div className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-muted-foreground">Tomorrow: {stats.dueTomorrow}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <h3 className="text-2xl font-bold">{stats.overdue}</h3>
              </div>
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="mt-3 text-xs">
              <span className="text-muted-foreground">
                {stats.overdue > 0
                  ? `${Math.round((stats.overdue / stats.pending) * 100)}% of pending tasks are overdue`
                  : "No overdue tasks"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Category</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <PriorityChart priorities={stats.priorities} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
