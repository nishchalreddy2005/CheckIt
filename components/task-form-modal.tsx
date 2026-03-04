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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createTask, updateTask } from "@/app/actions/task-actions"
import type { Task } from "@/lib/types"
import { format, setHours } from "date-fns"
import { getTasks } from "@/app/actions/task-actions"
import { UserMultiSelect } from "@/components/user-multi-select"

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
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])

  // Format the initial date for the form
  const formatInitialDate = () => {
    if (initialDate) {
      return format(initialDate, "yyyy-MM-dd")
    }
    if (taskToEdit && taskToEdit.dueDate) {
      try {
        return format(new Date(taskToEdit.dueDate), "yyyy-MM-dd")
      } catch (e) {
        return new Date().toISOString().split("T")[0]
      }
    }
    return new Date().toISOString().split("T")[0]
  }

  // Format the initial time for the form
  const formatInitialTime = () => {
    if (initialDate && initialHour !== undefined) {
      return format(setHours(initialDate, initialHour), "HH:mm")
    }
    if (taskToEdit && taskToEdit.dueDate) {
      try {
        return format(new Date(taskToEdit.dueDate), "HH:mm")
      } catch (e) {
        return "09:00"
      }
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
    sharedWith: "",
    parentId: "",
    dependsOn: "",
    recurrenceRule: "none",
  })

  // Fetch data from tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tasksData = await getTasks()
        if (Array.isArray(tasksData)) {
          setAvailableTasks(tasksData)

          const categories = new Set<string>(["Work", "Personal", "Health", "Learning"])
          tasksData.forEach((task) => {
            if (task.category) {
              categories.add(task.category)
            }
          })
          setExistingCategories(Array.from(categories))
        }
      } catch (error) {
        console.error("Error fetching data for modal:", error)
      }
    }

    fetchData()
  }, [open])

  // Update form data when editing a task
  useEffect(() => {
    if (taskToEdit) {
      let dateOnly = ""
      let timeOnly = "09:00"

      if (taskToEdit.dueDate) {
        try {
          const dateObj = new Date(taskToEdit.dueDate)
          dateOnly = format(dateObj, "yyyy-MM-dd")
          timeOnly = format(dateObj, "HH:mm")
        } catch (e) {
          // fallback handled below
        }
      }

      // Check if the task has a custom category
      const isCustom = !["Work", "Personal", "Health", "Learning"].includes(taskToEdit.category || "")
      setIsCustomCategory(isCustom)

      setFormData({
        title: taskToEdit.title || "",
        description: taskToEdit.description || "",
        dueDate: dateOnly,
        dueTime: timeOnly,
        category: isCustom ? "custom" : (taskToEdit.category || "Work"),
        customCategory: isCustom ? (taskToEdit.category || "") : "",
        priority: (taskToEdit.priority as "low" | "medium" | "high") || "medium",
        sharedWith: taskToEdit.sharedWith ? (taskToEdit.sharedWith as string[]).join(", ") : "",
        parentId: taskToEdit.parentId || "",
        dependsOn: taskToEdit.dependsOn || "",
        recurrenceRule: taskToEdit.recurrenceRule || "none",
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
        sharedWith: "",
        parentId: "",
        dependsOn: "",
        recurrenceRule: "none",
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
        sharedWith: "",
        parentId: "",
        dependsOn: "",
        recurrenceRule: "none",
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

      // Combine date and time (Ensure it's a valid local ISO string format)
      // e.g. "2024-03-10T14:30"
      const timePart = formData.dueTime ? formData.dueTime : "09:00"
      const dateTimeString = `${formData.dueDate}T${timePart}`

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

      // Parse comma separated usernames for the multiplayer array
      if (formData.sharedWith.trim()) {
        const usernames = formData.sharedWith.split(',').map(u => u.trim()).filter(u => u)
        formDataObj.append("sharedWith", JSON.stringify(usernames))
      }

      // Add Advanced fields
      if (formData.parentId && formData.parentId !== "none") formDataObj.append("parentId", formData.parentId)
      if (formData.dependsOn && formData.dependsOn !== "none") formDataObj.append("dependsOn", formData.dependsOn)
      formDataObj.append("recurrenceRule", formData.recurrenceRule)

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
      <DialogContent className="sm:max-w-[500px] glass-panel text-white border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold drop-shadow-md">{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription className="text-white/60">
            {taskToEdit ? "Update your task details and requirements." : "Fill in the details below to add a new task to your list."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/80">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required className="glass-input" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/80">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="glass-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-white/80">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="glass-input" style={{ colorScheme: "dark" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime" className="text-white/80">Due Time</Label>
              <Input
                id="dueTime"
                name="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={handleChange}
                required
                className="glass-input" style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-white/80">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="glass-card text-white border-white/20">
                {existingCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-indigo-400 font-medium">+ Add Custom Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomCategory && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="customCategory" className="text-white/80">Custom Category</Label>
              <Input
                id="customCategory"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleChange}
                placeholder="Enter custom category"
                required={isCustomCategory}
                className="glass-input"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sharedWith" className="text-white/80">Share with (Search users)</Label>
            <UserMultiSelect
              value={formData.sharedWith}
              onChange={(val) => setFormData({ ...formData, sharedWith: val })}
              placeholder="Search by name or email..."
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-white/80">Priority</Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) => handleSelectChange("priority", value)}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low-edit" className="border-emerald-400 text-emerald-400" />
                <Label htmlFor="low-edit" className="text-emerald-300 cursor-pointer">
                  Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium-edit" className="border-amber-400 text-amber-400" />
                <Label htmlFor="medium-edit" className="text-amber-300 cursor-pointer">
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high-edit" className="border-red-400 text-red-400" />
                <Label htmlFor="high-edit" className="text-red-300 cursor-pointer">
                  High
                </Label>
              </div>
            </RadioGroup>
          </div>

          {error && <div className="text-pink-300 text-sm p-3 bg-pink-500/10 rounded-lg border border-pink-500/20 backdrop-blur-md">{error}</div>}

          <div className="space-y-2">
            <Label className="text-white/80">Recurrence</Label>
            <Select value={formData.recurrenceRule} onValueChange={(v) => handleSelectChange("recurrenceRule", v)}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Parent Task (Convert to Subtask)</Label>
              <Select value={formData.parentId} onValueChange={(v) => handleSelectChange("parentId", v)}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-Level)</SelectItem>
                  {availableTasks.filter(t => t.id !== taskToEdit?.id).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Dependency (Blocker)</Label>
              <Select value={formData.dependsOn} onValueChange={(v) => handleSelectChange("dependsOn", v)}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select blocker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableTasks.filter(t => t.id !== taskToEdit?.id).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sharedWith" className="text-white/80">Share with (usernames, comma separated)</Label>
            <Input id="sharedWith" name="sharedWith" value={formData.sharedWith} onChange={handleChange} placeholder="user1, user2" className="glass-input" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              {isSubmitting ? "Saving..." : taskToEdit ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
