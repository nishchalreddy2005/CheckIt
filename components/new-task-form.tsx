"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

export function NewTaskForm({ userId }: { userId?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [useApiMethod, setUseApiMethod] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    dueTime: format(new Date(), "HH:mm"),
    category: "Work",
    customCategory: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      dueTime: format(new Date(), "HH:mm"),
      category: "Work",
      customCategory: "",
      priority: "medium",
    })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Combine date and time for the dueDate
      const dateTimeString = `${formData.dueDate}T${formData.dueTime}:00`

      // Determine the final category value
      const finalCategory =
        formData.category === "Custom" && formData.customCategory ? formData.customCategory : formData.category

      if (useApiMethod) {
        // Use the API route method
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            dueDate: dateTimeString,
            category: finalCategory,
            priority: formData.priority,
            userId: userId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to create task")
        }

        const result = await response.json()
        setSuccess("Task created successfully!")
      } else {
        // Use the FormData + Server Action method
        const formDataObj = new FormData()
        formDataObj.append("title", formData.title)
        formDataObj.append("description", formData.description)
        formDataObj.append("dueDate", dateTimeString)
        formDataObj.append("category", finalCategory)
        formDataObj.append("priority", formData.priority)

        if (userId) {
          formDataObj.append("userId", userId)
        }

        // Import dynamically to avoid issues
        const { createTask } = await import("@/app/actions/task-actions")
        const result = await createTask(formDataObj)

        if (!result) {
          throw new Error("Failed to create task. Please try again.")
        }

        setSuccess("Task created successfully!")
      }

      // Reset form after short delay
      setTimeout(() => {
        resetForm()
        setOpen(false)

        // Force a hard refresh of the page to ensure new task appears
        window.location.href = window.location.href
      }, 1500)
    } catch (error) {
      console.error("Failed to create task:", error)
      setError(error instanceof Error ? error.message : "Failed to create task. Please try again.")

      // If server action fails, try the API method next time
      if (!useApiMethod) {
        setUseApiMethod(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (newOpen) {
          resetForm()
        }
        setOpen(newOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button>Add New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="my-2">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {useApiMethod && (
          <Alert variant="default" className="my-2 bg-blue-50">
            <AlertDescription>Using API method for task creation</AlertDescription>
          </Alert>
        )}

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
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Learning">Learning</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.category === "Custom" && (
            <div className="space-y-2">
              <Label htmlFor="customCategory">Custom Category</Label>
              <Input
                id="customCategory"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleChange}
                placeholder="Enter custom category"
                required={formData.category === "Custom"}
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

          <div className="flex justify-between space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUseApiMethod(!useApiMethod)
              }}
              size="sm"
            >
              {useApiMethod ? "Use Server Action" : "Use API Method"}
            </Button>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
