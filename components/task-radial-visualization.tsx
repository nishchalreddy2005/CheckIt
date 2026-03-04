"use client"

import { useState, useEffect, useRef, memo, useCallback } from "react"
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

export const TaskRadialVisualization = memo(({ tasks, stats }: TaskRadialVisualizationProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const categoryPositionsRef = useRef<Record<string, CategoryPosition>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [, setRenderTick] = useState(0) // force re-render after drag
  const containerRef = useRef<HTMLDivElement>(null)

  const forceUpdate = useCallback(() => setRenderTick(t => t + 1), [])

  // Calculate overall completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Get categories sorted by total tasks (descending)
  const sortedCategories = Object.entries(stats.categories).sort((a, b) => b[1].total - a[1].total)

  // Get today's date at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Count overdue tasks
  const overdueTasks = tasks.filter((task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate as any) : null
    return dueDate && dueDate < today && !task.completed
  })

  // Count tasks due today
  const todayTasks = tasks.filter((task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate as any) : null
    return dueDate && dueDate.getTime() === today.getTime() && !task.completed
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


  // Initialize category positions once (using ref so they survive re-renders)
  useEffect(() => {
    let changed = false
    sortedCategories.forEach(([category]) => {
      if (!categoryPositionsRef.current[category]) {
        categoryPositionsRef.current[category] = getDefaultPosition(category)
        changed = true
      }
    })
    if (changed) forceUpdate()
  }, [sortedCategories.length])

  const handleDragEnd = (category: string, info: PanInfo) => {
    setIsDragging(false)
    const current = categoryPositionsRef.current[category] || getDefaultPosition(category)
    categoryPositionsRef.current[category] = {
      x: current.x + info.offset.x,
      y: current.y + info.offset.y,
    }
    forceUpdate()
  }

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-transparent">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      </div>
    )
  }

  // Calculate the stroke dash array and offset for the progress circle
  // The circumference of a circle is 2πr, and for r=42, it's approximately 264
  const circumference = 2 * Math.PI * 42
  const strokeDasharray = circumference
  const strokeDashoffset = circumference * (1 - completionPercentage / 100)

  return (
    <div ref={containerRef} className="relative h-[500px] bg-transparent overflow-visible rounded-2xl">
      {/* Main central circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl">
        <div className="relative">
          {/* Background circle */}
          <svg width="300" height="300" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </svg>

          {/* Completion percentage circle */}
          <svg width="300" height="300" viewBox="0 0 100 100" className="absolute top-0 left-0">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
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
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-indigo-500 drop-shadow-md">{completionPercentage}%</div>
            <div className="text-white/60 mt-2 font-medium tracking-wide">Completion Rate</div>
            <div className="text-sm text-white/40 mt-1">
              {stats.completed}/{stats.total} tasks completed
            </div>
          </div>
        </div>
      </div>

      {/* Category cards - now draggable */}
      {sortedCategories.map(([category, data], index) => {
        const position = categoryPositionsRef.current[category] || getDefaultPosition(category)
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
            }}
            onDragEnd={(_, info) => handleDragEnd(category, info)}
            onClick={(e) => {
              e.stopPropagation()
              if (!isDragging) {
                setSelectedCategory(selectedCategory === category ? null : category)
              }
            }}
          >
            <motion.div className="glass-panel p-4 w-[140px] relative rounded-2xl cursor-pointer" whileHover={{ scale: 1.05 }}>
              <div
                className="absolute top-2 right-2 text-white/40 hover:text-white/80 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
              >
                <GripHorizontal size={16} />
              </div>
              <div
                className="text-lg font-bold drop-shadow-lg"
                style={{ color: categoryColor.light }}
              >
                {category}
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-white/70 mt-1">
                      {data.completed}/{data.total} ({completionRate}%)
                    </div>
                    <div className="mt-2 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{
                          width: `${completionRate}%`,
                          backgroundColor: categoryColor.main,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )
      })}

      {/* Priority indicators at the bottom */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <motion.div
          className="glass-panel py-2 px-4 flex items-center gap-2 rounded-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]"></div>
          <span className="text-sm font-medium text-white/80">High: {priorityCounts.high}</span>
        </motion.div>
        <motion.div
          className="glass-panel py-2 px-4 flex items-center gap-2 rounded-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
          <span className="text-sm font-medium text-white/80">Medium: {priorityCounts.medium}</span>
        </motion.div>
        <motion.div
          className="glass-panel py-2 px-4 flex items-center gap-2 rounded-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
          <span className="text-sm font-medium text-white/80">Low: {priorityCounts.low}</span>
        </motion.div>
      </div>

      {/* Status indicators at the top */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <motion.div
          className="glass-panel py-2 px-4 flex items-center gap-2 rounded-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AlertTriangle className="h-5 w-5 text-red-400 drop-shadow-md" />
          <span className="text-sm font-medium text-white/80">Overdue: {overdueTasks.length}</span>
        </motion.div>
        <motion.div
          className="glass-panel py-2 px-4 flex items-center gap-2 rounded-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Clock className="h-5 w-5 text-amber-400 drop-shadow-md" />
          <span className="text-sm font-medium text-white/80">Due Today: {todayTasks.length}</span>
        </motion.div>
        <motion.div
          className="glass-panel py-2 px-4 flex items-center gap-2 rounded-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-md" />
          <span className="text-sm font-medium text-white/80">Completed: {stats.completed}</span>
        </motion.div>
      </div>

      {/* Selected category detail panel - rendered as fixed overlay */}
      <AnimatePresence>
        {selectedCategory && !isDragging && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glass-card p-8 w-[360px] z-[100] max-h-[85vh] overflow-y-auto flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button
              className="absolute top-4 right-4 text-white/40 hover:text-white/90 transition-colors p-1"
              onClick={() => setSelectedCategory(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="border-b border-white/10 pb-4">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg leading-tight break-words">{selectedCategory}</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Completion Rate</div>
                <div className="flex items-end gap-2">
                  <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 drop-shadow-sm">
                    {Math.round(
                      (stats.categories[selectedCategory].completed /
                        Math.max(stats.categories[selectedCategory].total, 1)) *
                      100,
                    )}
                    %
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Tasks Distribution</div>
                <div className="flex justify-between items-center text-center">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                      {stats.categories[selectedCategory].completed}
                    </div>
                    <div className="text-[10px] uppercase tracking-tighter text-white/40 font-bold mt-1">Completed</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                      {stats.categories[selectedCategory].total - stats.categories[selectedCategory].completed}
                    </div>
                    <div className="text-[10px] uppercase tracking-tighter text-white/40 font-bold mt-1">Remaining</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white">
                      {stats.categories[selectedCategory].total}
                    </div>
                    <div className="text-[10px] uppercase tracking-tighter text-white/40 font-bold mt-1">Total</div>
                  </div>
                </div>
              </div>

              {tasks.filter((task) => task.category === selectedCategory).length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Recent Category Tasks</div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {tasks
                      .filter((task) => task.category === selectedCategory)
                      .slice(0, 5)
                      .map((task) => (
                        <div key={task.id} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                          <div
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${task.priority === "high"
                              ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                              : task.priority === "medium"
                                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                                : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                              }`}
                          ></div>
                          <span className={`text-sm truncate ${task.completed ? "line-through text-white/20" : "text-white/80"} flex-1 font-medium`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
