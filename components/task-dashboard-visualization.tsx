"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, Circle, AlertCircle, BarChart4, PieChart } from "lucide-react"
import type { Task, TaskStats } from "@/lib/types"

interface TaskDashboardVisualizationProps {
  tasks: Task[]
  stats: TaskStats
}

export function TaskDashboardVisualization({ tasks, stats }: TaskDashboardVisualizationProps) {
  const [activeView, setActiveView] = useState<"overview" | "categories" | "priorities" | "timeline">("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for smoother transitions
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [activeView])

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Count tasks by priority
  const priorityCounts = useMemo(
    () => ({
      high: tasks.filter((task) => task.priority === "high").length,
      medium: tasks.filter((task) => task.priority === "medium").length,
      low: tasks.filter((task) => task.priority === "low").length,
    }),
    [tasks],
  )

  // Count completed tasks by priority
  const completedByPriority = useMemo(
    () => ({
      high: tasks.filter((task) => task.priority === "high" && task.completed).length,
      medium: tasks.filter((task) => task.priority === "medium" && task.completed).length,
      low: tasks.filter((task) => task.priority === "low" && task.completed).length,
    }),
    [tasks],
  )

  // Get upcoming tasks (due in the next 7 days)
  const upcomingTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return tasks
      .filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= today && dueDate <= nextWeek && !task.completed
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
  }, [tasks])

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks
      .filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate < today && !task.completed
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
  }, [tasks])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) return "Today"
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow"

    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <Button
            variant={activeView === "overview" ? "default" : "ghost"}
            className="rounded-none px-4 py-2 h-12"
            onClick={() => setActiveView("overview")}
          >
            <BarChart4 className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeView === "categories" ? "default" : "ghost"}
            className="rounded-none px-4 py-2 h-12"
            onClick={() => setActiveView("categories")}
          >
            <PieChart className="mr-2 h-4 w-4" />
            Categories
          </Button>
          <Button
            variant={activeView === "priorities" ? "default" : "ghost"}
            className="rounded-none px-4 py-2 h-12"
            onClick={() => setActiveView("priorities")}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Priorities
          </Button>
          <Button
            variant={activeView === "timeline" ? "default" : "ghost"}
            className="rounded-none px-4 py-2 h-12"
            onClick={() => setActiveView("timeline")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Timeline
          </Button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {activeView === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                          <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-2xl font-bold">{completionPercentage}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Completion Rate</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Completed Tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-3">
                          <Circle className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold">{stats.total - stats.completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pending Tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-3">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold">{overdueTasks.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Overdue Tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Priority Distribution</CardTitle>
                      <CardDescription>Tasks by priority level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                              <span>High Priority</span>
                            </div>
                            <span className="font-medium">{priorityCounts.high}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{ width: `${(priorityCounts.high / Math.max(stats.total, 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                              <span>Medium Priority</span>
                            </div>
                            <span className="font-medium">{priorityCounts.medium}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${(priorityCounts.medium / Math.max(stats.total, 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                              <span>Low Priority</span>
                            </div>
                            <span className="font-medium">{priorityCounts.low}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${(priorityCounts.low / Math.max(stats.total, 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Category Breakdown</CardTitle>
                      <CardDescription>Tasks by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(stats.categories).map(([category, data]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{category}</span>
                              <span className="font-medium">
                                {data.completed}/{data.total} (
                                {Math.round((data.completed / Math.max(data.total, 1)) * 100)}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(data.total / Math.max(stats.total, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Upcoming Tasks</CardTitle>
                    <CardDescription>Tasks due in the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingTasks.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center">
                              <div
                                className={`h-2 w-2 rounded-full mr-3 ${task.priority === "high"
                                  ? "bg-red-500"
                                  : task.priority === "medium"
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                                  }`}
                              ></div>
                              <span className="font-medium">{task.title}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{formatDate(task.dueDate ? String(task.dueDate) : "")}</div>
                          </div>
                        ))}
                        {upcomingTasks.length > 5 && (
                          <div className="text-sm text-center text-muted-foreground pt-2">
                            +{upcomingTasks.length - 5} more tasks
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No upcoming tasks for the next 7 days
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "categories" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution</CardTitle>
                      <CardDescription>Percentage of tasks by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-[300px] w-[300px] mx-auto">
                        {/* Pie chart visualization */}
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {Object.entries(stats.categories).map(([category, data], index, array) => {
                            // Calculate the percentage and angles for the pie slice
                            const percentage = data.total / Math.max(stats.total, 1)
                            let startAngle = 0

                            // Sum up percentages of previous categories
                            for (let i = 0; i < index; i++) {
                              startAngle += (Object.values(stats.categories)[i].total / Math.max(stats.total, 1)) * 360
                            }

                            const endAngle = startAngle + percentage * 360

                            // Convert angles to radians and calculate coordinates
                            const startRad = ((startAngle - 90) * Math.PI) / 180
                            const endRad = ((endAngle - 90) * Math.PI) / 180

                            const x1 = 50 + 40 * Math.cos(startRad)
                            const y1 = 50 + 40 * Math.sin(startRad)
                            const x2 = 50 + 40 * Math.cos(endRad)
                            const y2 = 50 + 40 * Math.sin(endRad)

                            // Determine if the arc should be drawn as a large arc
                            const largeArcFlag = percentage > 0.5 ? 1 : 0

                            // Generate a color based on the index
                            const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
                            const color = colors[index % colors.length]

                            // Create the SVG path for the pie slice
                            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

                            return <path key={category} d={path} fill={color} stroke="white" strokeWidth="1" />
                          })}
                          <circle cx="50" cy="50" r="25" fill="white" />
                        </svg>
                      </div>

                      <div className="mt-6 space-y-2">
                        {Object.entries(stats.categories).map(([category, data], index) => {
                          const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
                          const color = colors[index % colors.length]

                          return (
                            <div key={category} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                                <span>{category}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Math.round((data.total / Math.max(stats.total, 1)) * 100)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Completion by Category</CardTitle>
                      <CardDescription>Task completion rate by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Object.entries(stats.categories).map(([category, data]) => {
                          const completionRate = Math.round((data.completed / Math.max(data.total, 1)) * 100)

                          return (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{category}</span>
                                <span className="text-sm">
                                  {data.completed}/{data.total} tasks
                                </span>
                              </div>
                              <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full ${completionRate >= 75
                                    ? "bg-green-500"
                                    : completionRate >= 50
                                      ? "bg-amber-500"
                                      : completionRate >= 25
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                    }`}
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <div className="text-right text-sm text-muted-foreground">{completionRate}% complete</div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Comparison</CardTitle>
                    <CardDescription>Side-by-side comparison of task categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-end justify-around gap-4">
                      {Object.entries(stats.categories).map(([category, data], index) => {
                        const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
                        const color = colors[index % colors.length]
                        const maxHeight = 250 // Maximum height for the tallest bar
                        const totalHeight =
                          (data.total / Math.max(...Object.values(stats.categories).map((c) => c.total), 1)) * maxHeight
                        const completedHeight =
                          (data.completed / Math.max(...Object.values(stats.categories).map((c) => c.total), 1)) *
                          maxHeight

                        return (
                          <div key={category} className="flex flex-col items-center">
                            <div className="relative w-16 flex flex-col-reverse">
                              {/* Total bar */}
                              <div
                                className="w-full rounded-t-sm opacity-30"
                                style={{
                                  backgroundColor: color,
                                  height: `${totalHeight}px`,
                                }}
                              />

                              {/* Completed bar */}
                              <div
                                className="w-full rounded-t-sm absolute bottom-0"
                                style={{
                                  backgroundColor: color,
                                  height: `${completedHeight}px`,
                                }}
                              />
                            </div>
                            <div className="mt-2 text-sm font-medium">{category}</div>
                            <div className="text-xs text-muted-foreground">
                              {data.completed}/{data.total}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-sm bg-primary"></div>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-sm bg-primary opacity-30"></div>
                        <span>Total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "priorities" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-600">High Priority</CardTitle>
                      <CardDescription>
                        {completedByPriority.high}/{priorityCounts.high} completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative h-40 w-40 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Background circle */}
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />

                            {/* Progress circle */}
                            {priorityCounts.high > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="10"
                                strokeDasharray={`${(completedByPriority.high / priorityCounts.high) * 283} 283`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                              />
                            )}

                            {/* Percentage text */}
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="20"
                              fontWeight="bold"
                            >
                              {priorityCounts.high > 0
                                ? Math.round((completedByPriority.high / priorityCounts.high) * 100)
                                : 0}
                              %
                            </text>
                          </svg>
                        </div>

                        <div className="mt-4 text-center">
                          <div className="text-sm text-muted-foreground">
                            {priorityCounts.high - completedByPriority.high} tasks remaining
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-amber-600">Medium Priority</CardTitle>
                      <CardDescription>
                        {completedByPriority.medium}/{priorityCounts.medium} completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative h-40 w-40 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Background circle */}
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />

                            {/* Progress circle */}
                            {priorityCounts.medium > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="10"
                                strokeDasharray={`${(completedByPriority.medium / priorityCounts.medium) * 283} 283`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                              />
                            )}

                            {/* Percentage text */}
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="20"
                              fontWeight="bold"
                            >
                              {priorityCounts.medium > 0
                                ? Math.round((completedByPriority.medium / priorityCounts.medium) * 100)
                                : 0}
                              %
                            </text>
                          </svg>
                        </div>

                        <div className="mt-4 text-center">
                          <div className="text-sm text-muted-foreground">
                            {priorityCounts.medium - completedByPriority.medium} tasks remaining
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-600">Low Priority</CardTitle>
                      <CardDescription>
                        {completedByPriority.low}/{priorityCounts.low} completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative h-40 w-40 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Background circle */}
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />

                            {/* Progress circle */}
                            {priorityCounts.low > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="10"
                                strokeDasharray={`${(completedByPriority.low / priorityCounts.low) * 283} 283`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                              />
                            )}

                            {/* Percentage text */}
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="20"
                              fontWeight="bold"
                            >
                              {priorityCounts.low > 0
                                ? Math.round((completedByPriority.low / priorityCounts.low) * 100)
                                : 0}
                              %
                            </text>
                          </svg>
                        </div>

                        <div className="mt-4 text-center">
                          <div className="text-sm text-muted-foreground">
                            {priorityCounts.low - completedByPriority.low} tasks remaining
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Priority Comparison</CardTitle>
                    <CardDescription>Side-by-side comparison of task priorities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-end justify-around gap-4">
                      <div className="flex flex-col items-center">
                        <div className="relative w-20 flex flex-col-reverse">
                          <div
                            className="w-full rounded-t-sm bg-red-500 opacity-30"
                            style={{
                              height: `${(priorityCounts.high / Math.max(priorityCounts.high, priorityCounts.medium, priorityCounts.low, 1)) * 250}px`,
                            }}
                          />
                          <div
                            className="w-full rounded-t-sm bg-red-500 absolute bottom-0"
                            style={{
                              height: `${(completedByPriority.high / Math.max(priorityCounts.high, priorityCounts.medium, priorityCounts.low, 1)) * 250}px`,
                            }}
                          />
                        </div>
                        <div className="mt-2 text-sm font-medium">High</div>
                        <div className="text-xs text-muted-foreground">
                          {completedByPriority.high}/{priorityCounts.high}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative w-20 flex flex-col-reverse">
                          <div
                            className="w-full rounded-t-sm bg-amber-500 opacity-30"
                            style={{
                              height: `${(priorityCounts.medium / Math.max(priorityCounts.high, priorityCounts.medium, priorityCounts.low, 1)) * 250}px`,
                            }}
                          />
                          <div
                            className="w-full rounded-t-sm bg-amber-500 absolute bottom-0"
                            style={{
                              height: `${(completedByPriority.medium / Math.max(priorityCounts.high, priorityCounts.medium, priorityCounts.low, 1)) * 250}px`,
                            }}
                          />
                        </div>
                        <div className="mt-2 text-sm font-medium">Medium</div>
                        <div className="text-xs text-muted-foreground">
                          {completedByPriority.medium}/{priorityCounts.medium}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative w-20 flex flex-col-reverse">
                          <div
                            className="w-full rounded-t-sm bg-green-500 opacity-30"
                            style={{
                              height: `${(priorityCounts.low / Math.max(priorityCounts.high, priorityCounts.medium, priorityCounts.low, 1)) * 250}px`,
                            }}
                          />
                          <div
                            className="w-full rounded-t-sm bg-green-500 absolute bottom-0"
                            style={{
                              height: `${(completedByPriority.low / Math.max(priorityCounts.high, priorityCounts.medium, priorityCounts.low, 1)) * 250}px`,
                            }}
                          />
                        </div>
                        <div className="mt-2 text-sm font-medium">Low</div>
                        <div className="text-xs text-muted-foreground">
                          {completedByPriority.low}/{priorityCounts.low}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-sm bg-gray-500"></div>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-sm bg-gray-300"></div>
                        <span>Total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "timeline" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>7-Day Timeline</CardTitle>
                    <CardDescription>Tasks due in the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Get today's date at midnight
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)

                        // Create an array of dates for the next 7 days
                        const dates = Array.from({ length: 7 }, (_, i) => {
                          const date = new Date(today)
                          date.setDate(date.getDate() + i)
                          return date
                        })

                        // Format date as YYYY-MM-DD for comparison with task.dueDate
                        const formatDateForComparison = (date: Date) => {
                          return date.toISOString().split("T")[0]
                        }

                        // Count tasks due on each date
                        const tasksByDate = dates.map((date) => {
                          const dateStr = formatDateForComparison(date)
                          const tasksOnDate = tasks.filter((task) => {
                            if (!task.dueDate) return false
                            // Normalize the task due date format for comparison
                            const taskDueDate = new Date(task.dueDate)
                            const taskDueDateStr = formatDateForComparison(taskDueDate)
                            return taskDueDateStr === dateStr
                          })

                          return {
                            date,
                            dateStr,
                            total: tasksOnDate.length,
                            completed: tasksOnDate.filter((task) => task.completed).length,
                            pending: tasksOnDate.filter((task) => !task.completed).length,
                            tasks: tasksOnDate,
                          }
                        })

                        // Find the maximum number of tasks on any day for scaling
                        const maxTasks = Math.max(...tasksByDate.map((day) => day.total), 1)

                        return tasksByDate.map((day) => (
                          <div key={day.dateStr} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {day.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="text-muted-foreground">
                                {day.total} task{day.total !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {day.total > 0 ? (
                              <>
                                <div className="h-10 w-full rounded-md bg-gray-100 flex overflow-hidden">
                                  {/* Completed tasks */}
                                  {day.completed > 0 && (
                                    <div
                                      className="h-full bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                                      style={{ width: `${(day.completed / maxTasks) * 100}%` }}
                                    >
                                      {day.completed > 0 && day.completed}
                                    </div>
                                  )}

                                  {/* Pending tasks */}
                                  {day.pending > 0 && (
                                    <div
                                      className="h-full bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
                                      style={{ width: `${(day.pending / maxTasks) * 100}%` }}
                                    >
                                      {day.pending > 0 && day.pending}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1 mt-1">
                                  {day.tasks.slice(0, 2).map((task) => (
                                    <div key={task.id} className="flex items-center text-xs">
                                      <div
                                        className={`h-2 w-2 rounded-full mr-2 ${task.priority === "high"
                                          ? "bg-red-500"
                                          : task.priority === "medium"
                                            ? "bg-amber-500"
                                            : "bg-green-500"
                                          }`}
                                      ></div>
                                      <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                                        {task.title}
                                      </span>
                                    </div>
                                  ))}
                                  {day.tasks.length > 2 && (
                                    <div className="text-xs text-muted-foreground pl-4">
                                      +{day.tasks.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="h-10 w-full rounded-md bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
                                No tasks due
                              </div>
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Overdue Tasks</CardTitle>
                      <CardDescription>Tasks that are past their due date</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {overdueTasks.length > 0 ? (
                        <div className="space-y-3">
                          {overdueTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between border-b pb-2">
                              <div className="flex items-center">
                                <div
                                  className={`h-2 w-2 rounded-full mr-3 ${task.priority === "high"
                                    ? "bg-red-500"
                                    : task.priority === "medium"
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                    }`}
                                ></div>
                                <span className="font-medium">{task.title}</span>
                              </div>
                              <div className="text-sm text-red-500">{new Date(task.dueDate!).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">No overdue tasks</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Completion Timeline</CardTitle>
                      <CardDescription>Tasks completed over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-end justify-between">
                        {/* Placeholder for a line chart showing completion over time */}
                        <div className="text-center w-full py-6 text-muted-foreground">
                          Completion timeline will be shown here
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
