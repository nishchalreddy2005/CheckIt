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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
      // Use the API route method for simplicity (Ensure it's a valid local ISO string format)
      // e.g. "2024-03-10T14:30"
      const timePart = formData.dueTime ? formData.dueTime : "09:00"
      const dateTimeString = `${formData.dueDate}T${timePart}`

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border-none">
          <Plus className="h-4 w-4" />
          Add New Task
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden text-white border border-white/20 p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-bold tracking-tight drop-shadow-md">Create New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="customCategory" className="text-white/80">Custom Category</Label>
                <Input
                  id="customCategory"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  required
                  className="glass-input"
                />
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Label className="text-white/80">Priority</Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(value) => handleSelectChange("priority", value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" className="border-emerald-400 text-emerald-400" />
                  <Label htmlFor="low" className="text-emerald-300 cursor-pointer">
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" className="border-amber-400 text-amber-400" />
                  <Label htmlFor="medium" className="text-amber-300 cursor-pointer">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" className="border-red-400 text-red-400" />
                  <Label htmlFor="high" className="text-red-300 cursor-pointer">
                    High
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border-none">
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
      </DialogContent>
    </Dialog>
  )
}
