"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task } from "@/lib/types"

interface TimelineChartProps {
  tasks: Task[]
  title?: string
  description?: string
  daysToShow?: number
}

export function TimelineChart({
  tasks,
  title = "Upcoming Tasks",
  description = "Tasks due in the next 7 days",
  daysToShow = 7,
}: TimelineChartProps) {
  // Get today's date at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Create an array of dates for the next 7 days
  const dates = Array.from({ length: daysToShow }, (_, i) => {
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
    }
  })

  // Find the maximum number of tasks on any day for scaling
  const maxTasks = Math.max(...tasksByDate.map((day) => day.total), 1)

  // Format date for display
  const formatDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) return "Today"
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow"

    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  // For debugging
  console.log(
    "Timeline Chart - Available Tasks:",
    tasks.map((t) => ({ title: t.title, dueDate: t.dueDate })),
  )
  console.log("Timeline Chart - Tasks by Date:", tasksByDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasksByDate.map((day) => (
            <div key={day.dateStr} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{formatDate(day.date)}</span>
                <span className="text-muted-foreground">
                  {day.completed}/{day.total} completed
                </span>
              </div>

              {day.total > 0 ? (
                <div className="h-8 w-full rounded-md bg-gray-100 flex overflow-hidden">
                  {/* Completed tasks */}
                  {day.completed > 0 && (
                    <div className="h-full bg-green-500" style={{ width: `${(day.completed / maxTasks) * 100}%` }} />
                  )}

                  {/* Pending tasks */}
                  {day.pending > 0 && (
                    <div className="h-full bg-amber-500" style={{ width: `${(day.pending / maxTasks) * 100}%` }} />
                  )}
                </div>
              ) : (
                <div className="h-8 w-full rounded-md bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
                  No tasks due
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-amber-500"></div>
            <span>Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
