"use client"

import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns"
import type { Task } from "@/lib/types"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, CheckCircle, RotateCcw, Target, Users, Subtitles, Lock } from "lucide-react"
import { toggleTaskCompletion, deleteTask } from "@/app/actions/task-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { TaskFormModal } from "@/components/task-form-modal"

type TaskListProps = {
  initialTasks: Task[]
  filter?: string
  userId?: string
  searchFilters?: {
    searchTerm: string
    category: string
    priority: string
    status: string
    dateRange: { from: string; to: string }
  }
  onComplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onUpdate?: (taskId: string, data: Partial<Task>) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.3)]"
    case "medium":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
    case "low":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
    default:
      return "bg-white/10 text-white/70 border border-white/20"
  }
}

export function TaskList({ initialTasks, filter = "all", userId, searchFilters }: TaskListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({})
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Update tasks when initialTasks changes
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    if (filter === "today") {
      // Get today's date in YYYY-MM-DD format for comparison
      const today = new Date().toISOString().split("T")[0]
      const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      return taskDate === today
    }
    if (filter === "upcoming") {
      const today = new Date().toISOString().split("T")[0]
      return task.dueDate ? String(task.dueDate) > today && !task.completed : false
    }
    if (filter === "completed") return task.completed
    return true
  })

  const handleToggleCompletion = async (id: string, showCelebration = true) => {
    setIsToggling((prev) => ({ ...prev, [id]: true }))

    try {
      const formData = new FormData()
      formData.append("id", id)

      await toggleTaskCompletion(formData)

      // Find the task to see if we're completing or undoing
      const task = tasks.find((t) => t.id === id)
      const isCompleting = task ? !task.completed : true

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
      )

      // Only show celebration for completing tasks, not for undoing
      if (isCompleting && showCelebration) {
        // Show success toast and confetti
        toast({
          title: "Congratulations! 🎉",
          description: "You've successfully completed the task!",
          variant: "default",
        })

        // Optimized confetti animation
        const launchConfetti = async () => {
          const confetti = (await import("canvas-confetti")).default

          // Initial burst - center
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
            disableForReducedMotion: true,
          })

          // Left side burst after a short delay
          setTimeout(() => {
            confetti({
              particleCount: 40,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.5 },
              colors: ["#ff0000", "#ffa500", "#ffff00", "#00ff00", "#0000ff"],
              disableForReducedMotion: true,
            })
          }, 250)

          // Right side burst after another short delay
          setTimeout(() => {
            confetti({
              particleCount: 40,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.5 },
              colors: ["#ff69b4", "#00ffff", "#ff1493", "#ffd700", "#ff6347"],
              disableForReducedMotion: true,
            })
          }, 500)

          // Final center burst for grand finale
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 100,
              origin: { y: 0.5 },
              colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
              disableForReducedMotion: true,
            })
          }, 800)
        }

        // Launch the optimized confetti
        launchConfetti()
      } else if (!isCompleting) {
        // Show a simple toast for undoing a task
        toast({
          title: "Task Reopened",
          description: "The task has been marked as incomplete.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Failed to toggle task completion:", error)
      toast({
        title: "Error",
        description: "Failed to update the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsToggling((prev) => ({ ...prev, [id]: false }))
      setConfirmTaskId(null)
      router.refresh()
    }
  }

  const handleDeleteTask = async (id: string) => {
    setIsDeleting((prev) => ({ ...prev, [id]: true }))

    try {
      const formData = new FormData()
      formData.append("id", id)

      await deleteTask(formData)

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
    } catch (error) {
      console.error("Failed to delete task:", error)
    } finally {
      setIsDeleting((prev) => ({ ...prev, [id]: false }))
      router.refresh()
    }
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setIsEditModalOpen(true)
  }

  const handleFormModalClose = (shouldRefresh = false) => {
    setIsEditModalOpen(false)
    if (shouldRefresh) {
      router.refresh()
      // Force a hard refresh to ensure updated data
      window.location.href = window.location.href
    }
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center glass-panel rounded-2xl border-white/10">
        <div className="rounded-2xl bg-indigo-500/20 p-4 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-400"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white drop-shadow-md">No tasks found</h3>
        <p className="text-sm text-white/60 mt-2 max-w-sm">
          {filter === "all"
            ? "Space is currently empty. Initiate a new task to begin."
            : filter === "today"
              ? "Your orbit is clear for today."
              : filter === "upcoming"
                ? "No upcoming missions detected."
                : "Awaiting completed missions."}
        </p>
      </div>
    )
  }

  // Confirmation dialog for task completion
  const confirmationDialog = (
    <AlertDialog open={!!confirmTaskId} onOpenChange={(open) => !open && setConfirmTaskId(null)}>
      <AlertDialogContent className="glass-panel border-white/20 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold drop-shadow-md">Task Completion Confirmation</AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            Have you finished all the requirements for this node? Confirming will finalize its operation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => confirmTaskId && handleToggleCompletion(confirmTaskId, true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.5)] border-none"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <>
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} style={{ marginLeft: task.parentId ? '2rem' : '0' }} className="relative">
            {task.parentId && (
              <div className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 h-8 w-4 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
            )}
            <Card className={`overflow-hidden glass-card border-none transition-all duration-300 hover:-translate-y-1 ${task.parentId ? 'bg-white/5 shadow-sm' : ''}`}>
              <CardContent className="p-0">
                <div className="flex items-start p-5 gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.parentId && <Subtitles className="w-4 h-4 text-white/40" />}
                        <span className={`font-semibold text-lg drop-shadow-sm ${task.completed ? "line-through text-white/40 decoration-white/40" : "text-white"}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.sharedWith && task.sharedWith.length > 0 && (
                          <div title={`Shared with ${task.sharedWith.length} external space(s)`}>
                            <Badge variant="outline" className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">
                              <Users className="w-3 h-3 mr-1" />
                              {task.sharedWith.length}
                            </Badge>
                          </div>
                        )}
                        <Badge className={getPriorityColor(task.priority || "medium")}>{task.priority}</Badge>
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">{task.category}</Badge>
                      </div>
                    </div>
                    <p className={`text-sm ${task.completed ? "text-white/30" : "text-white/60"}`}>{task.description}</p>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.completed ? "bg-white/30" : "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"}`} />
                          <p className={`text-xs ${task.completed ? "text-white/40" : "text-white/70"}`}>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        {task.dependsOn && (
                          <div className="flex items-center gap-1.5 text-amber-300 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Lock className="w-3 h-3" />
                            <span>Has Dependency</span>
                          </div>
                        )}
                        {task.recurrenceRule && task.recurrenceRule !== 'none' && (
                          <div className="flex items-center gap-1.5 text-blue-300 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            <RotateCcw className="w-3 h-3" />
                            <span className="capitalize">{task.recurrenceRule}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {!task.completed && (
                          <Button asChild variant="outline" size="sm" className="h-8 flex items-center gap-1.5 text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors mr-2">
                            <Link href={`/focus/${task.id}`}>
                              <Target className="h-4 w-4 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
                              <span>Focus</span>
                            </Link>
                          </Button>
                        )}

                        {!task.completed ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                            onClick={() => setConfirmTaskId(task.id)}
                            disabled={isToggling[task.id]}
                          >
                            <CheckCircle className="h-4 w-4 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                            <span>Complete</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex items-center gap-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                            onClick={() => handleToggleCompletion(task.id, false)}
                            disabled={isToggling[task.id]}
                          >
                            <RotateCcw className="h-4 w-4 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                            <span>Undo</span>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10" onClick={() => handleEditTask(task)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isDeleting[task.id]}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {confirmationDialog}
      <TaskFormModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleFormModalClose(true)
          } else {
            setIsEditModalOpen(open)
          }
        }}
        taskToEdit={taskToEdit}
      />
    </>
  )
}
