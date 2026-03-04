"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import type { Task } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TaskCalendarProps {
  tasks: Task[]
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, date)
    })
  }

  const getHighPriorityCount = (date: Date) => {
    return getTasksForDate(date).filter((task) => task.priority === "high").length
  }

  const getCompletedCount = (date: Date) => {
    return getTasksForDate(date).filter((task) => task.completed).length
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Calendar</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium min-w-[150px] text-center">{format(currentMonth, "MMMM yyyy")}</h3>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-24 border rounded-md bg-muted/20"></div>
        ))}

        {daysInMonth.map((day) => {
          const tasksForDay = getTasksForDate(day)
          const isToday = isSameDay(day, new Date())
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const highPriorityCount = getHighPriorityCount(day)
          const completedCount = getCompletedCount(day)

          return (
            <Dialog key={day.toString()}>
              <DialogTrigger asChild>
                <div
                  className={`h-24 border rounded-md p-1 cursor-pointer transition-colors hover:bg-accent/50 ${isToday ? "border-primary border-2" : ""
                    } ${isSelected ? "bg-accent" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="flex flex-col h-full">
                    <div className="text-right font-medium">{format(day, "d")}</div>
                    {tasksForDay.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {tasksForDay.length} task{tasksForDay.length !== 1 ? "s" : ""}
                        </Badge>
                        {highPriorityCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {highPriorityCount} high
                          </Badge>
                        )}
                        {completedCount > 0 && (
                          <Badge variant="success" className="text-xs bg-green-600 hover:bg-green-700">
                            {completedCount} done
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md glass-panel border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Tasks for {format(day, "MMMM d, yyyy")}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-2 p-2">
                    {tasksForDay.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No tasks for this day</p>
                    ) : (
                      tasksForDay.map((task) => (
                        <Card
                          key={task.id}
                          className={`${task.priority === "high"
                            ? "border-l-4 border-l-red-500"
                            : task.priority === "medium"
                              ? "border-l-4 border-l-orange-500"
                              : "border-l-4 border-l-green-500"
                            }`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4
                                  className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                )}
                              </div>
                              <Badge className="capitalize">{task.category}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )
        })}

        {Array.from({ length: (7 - ((daysInMonth.length + monthStart.getDay()) % 7)) % 7 }).map((_, index) => (
          <div key={`empty-end-${index}`} className="h-24 border rounded-md bg-muted/20"></div>
        ))}
      </div>
    </div>
  )
}
