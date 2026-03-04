"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  getHours,
  setHours,
  setMinutes,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define the CalendarView type
type CalendarView = "day" | "week" | "month"

const taskToEvent = (task: Task) => {
  // Safe parsing for dates that might be null or Date objects
  let dueDate: Date
  let hasTime = false

  if (task.dueDate instanceof Date) {
    dueDate = task.dueDate
    hasTime = task.dueDate.toISOString().includes("T") && task.dueDate.toISOString().split("T")[1] !== "00:00:00.000Z"
  } else if (typeof task.dueDate === 'string') {
    const dateStr = task.dueDate as string
    dueDate = new Date(dateStr)
    hasTime = dateStr.includes("T") && !dateStr.endsWith("T00:00:00.000Z")
  } else {
    dueDate = new Date()
  }

  // Use the actual time if available, otherwise default to 9 AM (not random)
  const hour = hasTime ? getHours(dueDate) : 9
  const duration = 1 // 1 hour default duration

  // Set start and end times
  const start = setHours(setMinutes(dueDate, 0), hour)
  const end = setHours(setMinutes(dueDate, 0), hour + duration)

  // Assign color based on category
  const colorMap: { [key: string]: string } = {
    Work: "bg-blue-500",
    Personal: "bg-green-500",
    Health: "bg-red-400",
    Learning: "bg-amber-500",
  }

  const priorityMap: { [key: string]: string } = {
    high: "border-l-4 border-red-600",
    medium: "border-l-4 border-amber-500",
    low: "border-l-4 border-green-500",
  }

  return {
    id: task.id,
    title: task.title,
    start,
    end,
    color: colorMap[(task.category || "General") as keyof typeof colorMap] || "bg-purple-500",
    priorityIndicator: priorityMap[task.priority || "medium"] || "",
    completed: task.completed,
    description: task.description,
    category: task.category,
    priority: task.priority,
    originalTask: task,
  }
}

// Update the component props interface to include backgroundImage
interface EnhancedCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onAddTask?: (date: Date, hour: number) => void
  backgroundImage?: string
}

// Update the component function to use the backgroundImage prop
export function EnhancedCalendar({
  tasks,
  onTaskClick,
  onAddTask,
  backgroundImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
}: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("week")
  const [events, setEvents] = useState<ReturnType<typeof taskToEvent>[]>([])
  const [hoveredHour, setHoveredHour] = useState<{ day: Date; hour: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert tasks to events
  useEffect(() => {
    if (Array.isArray(tasks)) {
      console.log("Converting tasks to events:", tasks.length)
      const mappedEvents = tasks.map(taskToEvent)
      setEvents(mappedEvents)
    } else {
      console.error("Tasks is not an array:", tasks)
    }
  }, [tasks])

  // Get days to display based on current view
  const getDaysToDisplay = () => {
    if (view === "day") {
      return [currentDate]
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 }) // 0 = Sunday
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      return eachDayOfInterval({ start, end })
    }
  }

  // Navigation functions
  const goToToday = () => setCurrentDate(new Date())

  const goToPrevious = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1))
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1))
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addMonths(currentDate, 1))
  }

  // Get hours for day view and week view - full 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i) // 12 AM to 11 PM

  // Get events for a specific day and hour
  const getEventsForHourSlot = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return isSameDay(eventDate, day) && getHours(eventDate) === hour
    })
  }

  // Format time display
  const formatTimeDisplay = (hour: number) => {
    if (hour === 0) return "12 AM"
    if (hour === 12) return "12 PM"
    return `${hour % 12} ${hour >= 12 ? "PM" : "AM"}`
  }

  // Handle adding a new task
  const handleAddTask = (day: Date, hour: number) => {
    if (onAddTask) {
      const dateWithHour = setHours(day, hour)
      onAddTask(dateWithHour, hour)
    }
  }

  // Render the calendar based on the current view
  const renderCalendarContent = () => {
    const days = getDaysToDisplay()

    if (view === "month") {
      // Month view
      const firstDayOfMonth = startOfMonth(currentDate)
      const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 })
      const endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
      const allDays = eachDayOfInterval({ start: startDate, end: endDate })

      return (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div key={day} className="text-center font-medium py-2 text-white">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {allDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const dayEvents = events.filter((event) => isSameDay(event.start, day))

            return (
              <div
                key={day.toString()}
                className={cn(
                  "h-24 border border-white/10 rounded-md p-1 backdrop-blur-sm transition-all",
                  isCurrentMonth ? "bg-white/10" : "bg-white/5",
                  isToday ? "ring-2 ring-blue-500" : "",
                )}
              >
                <div className="flex justify-between">
                  <span
                    className={cn(
                      "font-medium",
                      isToday ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : "",
                      !isCurrentMonth ? "text-white/50" : "text-white",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs bg-white/20 rounded-full px-1.5 text-white">{dayEvents.length}</span>
                  )}
                </div>

                <div className="mt-1 space-y-1 max-h-[calc(100%-20px)] overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onTaskClick && onTaskClick(event.originalTask)}
                      className={cn(
                        "text-xs px-1 py-0.5 rounded truncate cursor-pointer",
                        event.color,
                        event.priorityIndicator,
                        event.completed ? "opacity-60 line-through" : "",
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-white/70 pl-1">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    } else {
      // Day or Week view
      return (
        <div className="flex flex-col h-[calc(100vh-180px)] min-h-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[80px_1fr] border-b border-white/20">
            <div className="border-r border-white/20"></div>
            <div className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"} divide-x divide-white/20`}>
              {days.map((day) => {
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toString()}
                    className={cn("text-center py-3 font-medium text-white", isToday ? "bg-blue-500/30" : "")}
                  >
                    <div>{format(day, "EEE")}</div>
                    <div
                      className={cn(
                        "text-xl mt-1",
                        isToday ? "bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto" : "",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-[80px_1fr] h-full divide-y divide-white/10">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-1 divide-y divide-white/10">
                  {/* Time label */}
                  <div className="sticky left-0 pr-2 text-right text-sm text-white/70 pt-2">
                    {formatTimeDisplay(hour)}
                  </div>

                  {/* Hour cells for each day */}
                  <div className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"} divide-x divide-white/10`}>
                    {days.map((day) => {
                      const eventsForSlot = getEventsForHourSlot(day, hour)
                      const isHovered = hoveredHour && isSameDay(hoveredHour.day, day) && hoveredHour.hour === hour

                      return (
                        <div
                          key={`${day.toString()}-${hour}`}
                          className={cn("relative h-16 group", isHovered ? "bg-white/10" : "")}
                          onMouseEnter={() => setHoveredHour({ day, hour })}
                          onMouseLeave={() => setHoveredHour(null)}
                        >
                          {/* Add button (visible on hover) */}
                          <button
                            onClick={() => handleAddTask(day, hour)}
                            className="absolute top-1 right-1 bg-white/20 hover:bg-white/40 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="h-3 w-3 text-white" />
                          </button>

                          {/* Events */}
                          <div className="p-1 space-y-1">
                            {eventsForSlot.map((event) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                onClick={() => onTaskClick && onTaskClick(event.originalTask)}
                                className={cn(
                                  "text-xs p-2 rounded cursor-pointer transition-all hover:shadow-lg",
                                  event.color,
                                  event.priorityIndicator,
                                  event.completed ? "opacity-60" : "",
                                )}
                              >
                                <div className="font-medium text-white">{event.title}</div>
                                <div className="text-white/80 text-[10px] mt-0.5">
                                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border shadow-lg"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Glass overlay */}
      <div className="bg-black/30 backdrop-blur-sm h-full">
        {/* Calendar header */}
        <div className="p-4 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              className="bg-blue-500 hover:bg-blue-600 text-white border-none"
              onClick={goToToday}
            >
              Today
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={goToPrevious} className="text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNext} className="text-white">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <h2 className="text-xl font-bold text-white">
              {format(currentDate, view === "month" ? "MMMM yyyy" : "MMMM d, yyyy")}
            </h2>
          </div>

          <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className={view === "day" ? "bg-white text-black" : "text-white"}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className={view === "week" ? "bg-white text-black" : "text-white"}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className={view === "month" ? "bg-white text-black" : "text-white"}
            >
              Month
            </Button>
          </div>
        </div>

        {/* Calendar content */}
        <div className="p-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderCalendarContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
