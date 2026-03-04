"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"

export function DirectTaskCreator() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: format(new Date(), "HH:mm"),
    category: "Work",
    priority: "medium" as "low" | "medium" | "high",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Combine date and time
      const dateTimeString = `${formData.dueDate}T${formData.dueTime}:00`

      // Create task via API
      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          dueDate: dateTimeString,
          category: formData.category,
          priority: formData.priority,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task")
      }

      // Show success message
      setSuccess(true)

      // Reset form
      setFormData({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        dueTime: format(new Date(), "HH:mm"),
        category: "Work",
        priority: "medium",
      })

      // Force refresh after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("Failed to create task:", error)
      setError(error instanceof Error ? error.message : "Failed to create task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full glass-card text-white border-white/20">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" value={formData.description} onChange={handleChange} />
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
              <SelectContent className="glass-card text-white border-white/20">
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Learning">Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="glass-card text-white border-white/20">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-500 text-sm p-2 bg-green-50 rounded border border-green-200">
              <Check className="h-4 w-4" />
              Task created successfully! It will appear in your calendar.
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </CardFooter>
    </Card>
  )
}
