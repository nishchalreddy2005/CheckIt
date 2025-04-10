"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, CheckCircle, RotateCcw } from "lucide-react"
import type { Task } from "@/lib/types"
import { toggleTaskCompletion, deleteTask } from "@/app/actions/task-actions"
import { useRouter } from "next/navigation"
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
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "low":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
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
      const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
      return taskDate === today
    }
    if (filter === "upcoming") {
      const today = new Date().toISOString().split("T")[0]
      return task.dueDate > today && !task.completed
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
          variant: "success",
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-gray-500"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No tasks found</h3>
        <p className="text-sm text-gray-500 mt-1">
          {filter === "all"
            ? "You don't have any tasks yet. Create your first task to get started."
            : filter === "today"
              ? "You don't have any tasks due today."
              : filter === "upcoming"
                ? "You don't have any upcoming tasks."
                : "You don't have any completed tasks."}
        </p>
      </div>
    )
  }

  // Confirmation dialog for task completion
  const confirmationDialog = (
    <AlertDialog open={!!confirmTaskId} onOpenChange={(open) => !open && setConfirmTaskId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Task Completion</AlertDialogTitle>
          <AlertDialogDescription>
            Have you finished all the requirements for this task? Confirming will mark it as complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => confirmTaskId && handleToggleCompletion(confirmTaskId, true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Yes, I've completed it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <>
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start p-4 gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Badge variant="outline">{task.category}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{task.description}</p>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      {!task.completed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => setConfirmTaskId(task.id)}
                          disabled={isToggling[task.id]}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Complete</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => handleToggleCompletion(task.id, false)}
                          disabled={isToggling[task.id]}
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Undo</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTask(task)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
