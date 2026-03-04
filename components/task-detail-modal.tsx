"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Tag, AlertTriangle, CheckCircle2, Edit, Trash2, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Task } from "@/lib/types"
import { toggleTaskCompletion, deleteTask } from "@/app/actions/task-actions"
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

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string, completed: boolean) => void
}

export function TaskDetailModal({ task, open, onOpenChange, onEdit, onDelete, onComplete }: TaskDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { toast } = useToast()

  if (!task) return null

  const handleToggleCompletion = async (showCelebration = true) => {
    if (!task) return

    setIsToggling(true)
    try {
      const formData = new FormData()
      formData.append("id", task.id)

      await toggleTaskCompletion(formData)

      if (onComplete) {
        onComplete(task.id, !task.completed)
      }

      // Only show celebration for completing tasks, not for undoing
      if (!task.completed && showCelebration) {
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
      } else if (task.completed) {
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
      setIsToggling(false)
      setShowConfirmation(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!task) return

    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append("id", task.id)

      await deleteTask(formData)

      if (onDelete) {
        onDelete(task.id)
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete task:", error)
    } finally {
      setIsDeleting(false)
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Work":
        return "bg-blue-100 text-blue-800"
      case "Personal":
        return "bg-green-100 text-green-800"
      case "Health":
        return "bg-red-100 text-red-800"
      case "Learning":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  // Confirmation dialog for task completion
  const confirmationDialog = (
    <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Task Completion</AlertDialogTitle>
          <AlertDialogDescription>
            Have you finished all the requirements for this task? Confirming will mark it as complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleToggleCompletion(true)} className="bg-green-600 hover:bg-green-700">
            Yes, I've completed it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2">
            <div className="flex-1">
              <span className={task.completed ? "line-through text-gray-500" : ""}>{task.title}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {task.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-gray-500">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="mr-2 h-4 w-4" />
                Due Date
              </div>
              <p className="text-sm font-medium">
                {(() => {
                  if (!task.dueDate) return "No due date";

                  let hasTime = false;
                  if (task.dueDate instanceof Date) {
                    const iso = task.dueDate.toISOString();
                    hasTime = iso.includes("T") && iso.split("T")[1] !== "00:00:00.000Z";
                  } else if (typeof task.dueDate === 'string') {
                    const dateStr = task.dueDate as string;
                    hasTime = dateStr.includes("T") && !dateStr.endsWith("T00:00:00.000Z");
                  }

                  return hasTime
                    ? format(new Date(task.dueDate), "PPP 'at' h:mm a")
                    : format(new Date(task.dueDate), "PPP");
                })()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="mr-2 h-4 w-4" />
                Created
              </div>
              <p className="text-sm font-medium">{task.createdAt ? format(new Date(task.createdAt), "PPP") : "Unknown"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Tag className="mr-2 h-4 w-4" />
                Category
              </div>
              <Badge className={getCategoryColor(task.category || "General")}>{task.category || "General"}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Priority
              </div>
              <Badge className={getPriorityColor(task.priority || "medium")}>
                {(task.priority || "medium").charAt(0).toUpperCase() + (task.priority || "medium").slice(1)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Status
            </div>
            <Badge variant={task.completed ? "default" : "outline"} className={task.completed ? "bg-green-500 hover:bg-green-600" : ""}>
              {task.completed ? "Completed" : "Pending"}
            </Badge>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {!task.completed ? (
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(true)}
                disabled={isToggling}
                className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleToggleCompletion(false)}
                disabled={isToggling}
                className="flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <RotateCcw className="h-4 w-4" />
                Undo
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit && onEdit(task)} className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="flex items-center"
            >
              {isDeleting ? (
                <>Loading...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmationDialog}
    </Dialog>
  )
}
