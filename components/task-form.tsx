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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createTask } from "@/app/actions/task-actions"
import { format } from "date-fns"
import { getTasks } from "@/app/actions/task-actions"

// Add userId as an optional prop
interface TaskFormProps {
  userId?: string
}

export function TaskForm({ userId }: TaskFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>(["Work", "Personal", "Health", "Learning"])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: format(new Date(), "HH:mm"),
    category: "Work",
    customCategory: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  // Fetch existing categories from tasks
  useEffect(() => {
    if (open) {
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
    }
  }, [open])

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
      // Check Redis connection first
      try {
        const response = await fetch("/api/check-redis-status")
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || "Database connection error")
        }
      } catch (connectionError) {
        console.error("Redis connection check failed:", connectionError)
        throw new Error("Database connection error. Please try again later.")
      }

      const formDataObj = new FormData()

      // Determine the actual category to use
      const categoryToUse = isCustomCategory ? formData.customCategory : formData.category

      // Validate custom category if selected
      if (isCustomCategory && !formData.customCategory.trim()) {
        throw new Error("Custom category cannot be empty")
      }

      // Combine date and time for the dueDate
      const dateTimeString = `${formData.dueDate}T${formData.dueTime}:00`

      // Add all form fields to the FormData object
      formDataObj.append("title", formData.title)
      formDataObj.append("description", formData.description)
      formDataObj.append("dueDate", dateTimeString)
      formDataObj.append("category", categoryToUse)
      formDataObj.append("priority", formData.priority)

      // Add userId if provided
      if (userId) {
        formDataObj.append("userId", userId)
      }

      const result = await createTask(formDataObj)

      if (!result) {
        throw new Error("Failed to create task. Please try again.")
      }

      // Reset form
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

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to create task:", error)
      setError(error instanceof Error ? error.message : "Failed to create task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            // Reset form data before opening
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
            setError(null)
          }}
        >
          Add New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
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

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
