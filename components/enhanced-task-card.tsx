"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, CheckCircle, RotateCcw } from "lucide-react"
import type { Task } from "@/lib/types"
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
import { useToast } from "@/components/ui/use-toast"

interface EnhancedTaskCardProps {
  task: Task
  onToggleCompletion: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
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

export function EnhancedTaskCard({ task, onToggleCompletion, onDelete, onEdit }: EnhancedTaskCardProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      onToggleCompletion(task.id)
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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      onDelete(task.id)
    } catch (error) {
      console.error("Failed to delete task:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleComplete = () => {
    setShowConfirmation(true)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start p-4 gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>{task.title}</span>
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
                    onClick={handleComplete}
                    disabled={isToggling}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={handleToggle}
                    disabled={isToggling}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Undo</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      {/* Confirmation dialog for task completion */}
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
            <AlertDialogAction
              onClick={() => {
                setShowConfirmation(false)
                onToggleCompletion(task.id, true)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Yes, I've completed it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
