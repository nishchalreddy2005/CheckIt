"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { CheckCircle2, Clock, AlertTriangle, GripHorizontal } from "lucide-react"
import type { Task, TaskStats } from "@/lib/types"

interface TaskRadialVisualizationProps {
  tasks: Task[]
  stats: TaskStats
}

interface CategoryPosition {
  x: number
  y: number
}

export function TaskRadialVisualization({ tasks, stats }: TaskRadialVisualizationProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [categoryPositions, setCategoryPositions] = useState<Record<string, CategoryPosition>>({})
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate overall completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Get categories sorted by total tasks (descending)
  const sortedCategories = Object.entries(stats.categories).sort((a, b) => b[1].total - a[1].total)

  // Get today's date at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Count overdue tasks
  const overdueTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate < today && !task.completed
  })

  // Count tasks due today
  const todayTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate.getTime() === today.getTime() && !task.completed
  })

  // Generate colors for categories
  const getCategoryColor = (index: number) => {
    const colors = [
      { main: "#4f46e5", light: "#c7d2fe" }, // Indigo
      { main: "#0ea5e9", light: "#bae6fd" }, // Sky
      { main: "#10b981", light: "#a7f3d0" }, // Emerald
      { main: "#f59e0b", light: "#fde68a" }, // Amber
      { main: "#ef4444", light: "#fecaca" }, // Red
      { main: "#8b5cf6", light: "#ddd6fe" }, // Violet
      { main: "#ec4899", light: "#fbcfe8" }, // Pink
      { main: "#14b8a6", light: "#99f6e4" }, // Teal
    ]
    return colors[index % colors.length]
  }

  // Calculate priority counts
  const priorityCounts = {
    high: tasks.filter((task) => task.priority === "high").length,
    medium: tasks.filter((task) => task.priority === "medium").length,
    low: tasks.filter((task) => task.priority === "low").length,
  }

  // Get default position for a category
  const getDefaultPosition = (category: string) => {
    if (category.toLowerCase() === "work") {
      return { x: -200, y: -180 } // Top-left
    } else if (category.toLowerCase() === "health") {
      return { x: 0, y: -180 } // Top-center
    } else if (category.toLowerCase() === "personal") {
      return { x: 200, y: -180 } // Top-right
    } else if (category.toLowerCase() === "learning") {
      return { x: -200, y: 0 } // Left-middle
    } else {
      // For any other categories, use default positions
      return { x: 200, y: 0 } // Right-middle (default)
    }
  }

  // Initialize category positions
  useEffect(() => {
    const initialPositions: Record<string, CategoryPosition> = {}

    sortedCategories.forEach(([category]) => {
      initialPositions[category] = getDefaultPosition(category)
    })

    setCategoryPositions(initialPositions)
  }, [sortedCategories.length])

  // Handle drag end
  const handleDragEnd = (category: string, info: PanInfo) => {
    setIsDragging(false)

    setCategoryPositions((prev) => ({
      ...prev,
      [category]: {
        x: (prev[category]?.x || 0) + info.offset.x,
        y: (prev[category]?.y || 0) + info.offset.y,
      },
    }))
  }

  useEffect(() => {
    // Simulate loading for smoother transitions
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Calculate the stroke dash array and offset for the progress circle
  // The circumference of a circle is 2πr, and for r=42, it's approximately 264
  const circumference = 2 * Math.PI * 42
  const strokeDasharray = circumference
  const strokeDashoffset = circumference * (1 - completionPercentage / 100)

  return (
    <div ref={containerRef} className="relative h-[500px] bg-gray-50 overflow-hidden">
      {/* Main central circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Background circle */}
          <svg width="300" height="300" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
          </svg>

          {/* Completion percentage circle */}
          <svg width="300" height="300" viewBox="0 0 100 100" className="absolute top-0 left-0">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
          </svg>

          {/* Center content */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">
            <div className="text-5xl font-bold text-indigo-600">{completionPercentage}%</div>
            <div className="text-gray-500 mt-2">Completion Rate</div>
            <div className="text-sm text-gray-400 mt-1">
              {stats.completed}/{stats.total} tasks completed
            </div>
          </div>
        </div>
      </div>

      {/* Category cards - now draggable */}
      {sortedCategories.map(([category, data], index) => {
        const position = categoryPositions[category] || getDefaultPosition(category)
        const categoryColor = getCategoryColor(index)
        const completionRate = Math.round((data.completed / Math.max(data.total, 1)) * 100)
        const isSelected = selectedCategory === category

        return (
          <motion.div
            key={category}
            className="absolute top-1/2 left-1/2 cursor-move"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: isSelected ? 1.1 : 1,
              x: position.x,
              y: position.y,
              zIndex: isDragging && isSelected ? 20 : isSelected ? 10 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: index * 0.1,
            }}
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => {
              setIsDragging(true)
              setSelectedCategory(category)
            }}
            onDragEnd={(_, info) => handleDragEnd(category, info)}
          >
            <motion.div className="bg-white rounded-xl shadow-md p-4 w-[140px] relative" whileHover={{ scale: 1.05 }}>
              <div
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
              >
                <GripHorizontal size={16} />
              </div>
              <div
                className="text-lg font-medium"
                style={{ color: categoryColor.main }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isDragging) {
                    setSelectedCategory(selectedCategory === category ? null : category)
                  }
                }}
              >
                {category}
              </div>
              <div className="text-sm text-gray-500">
                {data.completed}/{data.total} ({completionRate}%)
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    backgroundColor: categoryColor.main,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )
      })}

      {/* Priority indicators at the bottom */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <motion.div
          className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <span className="text-sm font-medium">High: {priorityCounts.high}</span>
        </motion.div>
        <motion.div
          className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
          <span className="text-sm font-medium">Medium: {priorityCounts.medium}</span>
        </motion.div>
        <motion.div
          className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium">Low: {priorityCounts.low}</span>
        </motion.div>
      </div>

      {/* Status indicators at the top */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <motion.div
          className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium">Overdue: {overdueTasks.length}</span>
        </motion.div>
        <motion.div
          className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Clock className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium">Due Today: {todayTasks.length}</span>
        </motion.div>
        <motion.div
          className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Completed: {stats.completed}</span>
        </motion.div>
      </div>

      {/* Selected category detail panel */}
      <AnimatePresence>
        {selectedCategory && !isDragging && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 w-[300px] z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedCategory(null)}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">{selectedCategory}</h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Completion Rate</div>
                <div className="text-3xl font-bold">
                  {Math.round(
                    (stats.categories[selectedCategory].completed /
                      Math.max(stats.categories[selectedCategory].total, 1)) *
                      100,
                  )}
                  %
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Tasks</div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-xl font-bold text-green-500">
                      {stats.categories[selectedCategory].completed}
                    </div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-amber-500">
                      {stats.categories[selectedCategory].total - stats.categories[selectedCategory].completed}
                    </div>
                    <div className="text-xs text-gray-500">Remaining</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{stats.categories[selectedCategory].total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Recent Tasks</div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                  {tasks
                    .filter((task) => task.category === selectedCategory)
                    .slice(0, 3)
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            task.priority === "high"
                              ? "bg-red-500"
                              : task.priority === "medium"
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                        ></div>
                        <span className={`text-sm ${task.completed ? "line-through text-gray-400" : ""}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
