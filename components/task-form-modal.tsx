"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createTask, updateTask } from "@/app/actions/task-actions"
import type { Task } from "@/lib/types"
import { format, setHours } from "date-fns"
import { getTasks } from "@/app/actions/task-actions"

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
  initialHour?: number
  taskToEdit?: Task | null
}

export function TaskFormModal({ open, onOpenChange, initialDate, initialHour, taskToEdit }: TaskFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>(["Work", "Personal", "Health", "Learning"])

  // Format the initial date for the form
  const formatInitialDate = () => {
    if (initialDate) {
      return format(initialDate, "yyyy-MM-dd")
    }
    if (taskToEdit) {
      return taskToEdit.dueDate.split("T")[0]
    }
    return new Date().toISOString().split("T")[0]
  }

  // Format the initial time for the form
  const formatInitialTime = () => {
    if (initialDate && initialHour !== undefined) {
      return format(setHours(initialDate, initialHour), "HH:mm")
    }
    if (taskToEdit && taskToEdit.dueDate.includes("T")) {
      // Extract time from task due date if available
      const timePart = taskToEdit.dueDate.split("T")[1]
      return timePart ? timePart.substring(0, 5) : "09:00"
    }
    return format(new Date(), "HH:mm") // Default to current time
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: formatInitialDate(),
    dueTime: formatInitialTime(),
    category: "Work",
    customCategory: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  // Fetch existing categories from tasks
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const tasks = await getTasks()
        if (Array.isArray(tasks) && tasks.length > 0) {
          const categories = new Set<string>(["Work", "Personal", "Health", "Learning"])
          tasks.forEach((task) => {
            if (task.category) {
              categories.add(task.category)
            }
          })
          setExistingCategories(Array.from(categories))
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [open])

  // Update form data when editing a task
  useEffect(() => {
    if (taskToEdit) {
      const dateOnly = taskToEdit.dueDate.split("T")[0]
      let timeOnly = "09:00" // Default time

      if (taskToEdit.dueDate.includes("T")) {
        const timePart = taskToEdit.dueDate.split("T")[1]
        timeOnly = timePart ? timePart.substring(0, 5) : "09:00"
      }

      // Check if the task has a custom category
      const isCustom = !["Work", "Personal", "Health", "Learning"].includes(taskToEdit.category)
      setIsCustomCategory(isCustom)

      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        dueDate: dateOnly,
        dueTime: timeOnly,
        category: isCustom ? "custom" : taskToEdit.category,
        customCategory: isCustom ? taskToEdit.category : "",
        priority: taskToEdit.priority,
      })
    } else if (initialDate) {
      setFormData({
        title: "",
        description: "",
        dueDate: format(initialDate, "yyyy-MM-dd"),
        dueTime: initialHour !== undefined ? format(setHours(new Date(), initialHour), "HH:mm") : "09:00",
        category: "Work",
        customCategory: "",
        priority: "medium",
      })
      setIsCustomCategory(false)
    } else {
      // Reset form when not editing
      setFormData({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        dueTime: format(new Date(), "HH:mm"),
        category: "Work",
        customCategory: "",
        priority: "medium",
      })
      setIsCustomCategory(false)
    }

    // Reset error when form opens
    setError(null)
  }, [taskToEdit, initialDate, initialHour, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "category" && value === "custom") {
      setIsCustomCategory(true)
    } else if (name === "category") {
      setIsCustomCategory(false)
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formDataObj = new FormData()

      // Add task ID if editing
      if (taskToEdit) {
        formDataObj.append("id", taskToEdit.id)
      }

      // Combine date and time
      const dateTimeString = `${formData.dueDate}T${formData.dueTime}:00`

      // Determine the actual category to use
      const categoryToUse = isCustomCategory ? formData.customCategory : formData.category

      // Validate custom category if selected
      if (isCustomCategory && !formData.customCategory.trim()) {
        throw new Error("Custom category cannot be empty")
      }

      // Add form data
      formDataObj.append("title", formData.title)
      formDataObj.append("description", formData.description)
      formDataObj.append("dueDate", dateTimeString)
      formDataObj.append("category", categoryToUse)
      formDataObj.append("priority", formData.priority)

      // Create or update task
      if (taskToEdit) {
        await updateTask(formDataObj)
      } else {
        await createTask(formDataObj)
      }

      // Close modal and refresh
      onOpenChange(false)

      // Force a refresh of the page to ensure calendar is updated
      router.refresh()

      // Add a small delay before refreshing to ensure the server has time to process
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (error) {
      console.error("Failed to save task:", error)
      setError(error instanceof Error ? error.message : "Failed to save task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                name="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {existingCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="custom">+ Add Custom Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomCategory && (
            <div className="space-y-2">
              <Label htmlFor="customCategory">Custom Category</Label>
              <Input
                id="customCategory"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleChange}
                placeholder="Enter custom category"
                required={isCustomCategory}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) => handleSelectChange("priority", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="text-green-600">
                  Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="text-yellow-600">
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="text-red-600">
                  High
                </Label>
              </div>
            </RadioGroup>
          </div>

          {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">{error}</div>}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : taskToEdit ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
