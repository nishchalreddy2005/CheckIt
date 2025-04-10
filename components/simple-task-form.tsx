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
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus } from "lucide-react"

export function SimpleTaskForm({ userId }: { userId?: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    dueTime: format(new Date(), "HH:mm"),
    category: "Work",
    priority: "medium" as "low" | "medium" | "high",
    customCategory: "",
  })

  const [isCustomCategory, setIsCustomCategory] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "category" && value === "Custom") {
      setIsCustomCategory(true)
    } else {
      setIsCustomCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Use the API route method for simplicity
      const dateTimeString = `${formData.dueDate}T${formData.dueTime}:00`

      const category = isCustomCategory ? formData.customCategory : formData.category

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          dueDate: dateTimeString,
          category: category,
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

      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          dueDate: format(new Date(), "yyyy-MM-dd"),
          dueTime: format(new Date(), "HH:mm"),
          category: "Work",
          priority: "medium",
          customCategory: "",
        })
        setIsCustomCategory(false)
        setIsOpen(false)
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Failed to create task:", error)
      setError(error instanceof Error ? error.message : "Failed to create task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add New Task
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Task</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              ×
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {isCustomCategory && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">Custom Category</Label>
                <Input
                  id="customCategory"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  required
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
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
          </form>
        </div>
      </div>
    </div>
  )
}
