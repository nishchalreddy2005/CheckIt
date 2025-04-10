"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function DirectTaskButton() {
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    // Add a direct event listener to the button
    const button = document.getElementById("direct-task-button")
    if (button) {
      button.addEventListener("click", () => {
        window.location.href = "/add-task"
      })
    }

    return () => {
      if (button) {
        button.removeEventListener("click", () => {})
      }
    }
  }, [])

  return (
    <Button id="direct-task-button" className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add New Task (Direct)
    </Button>
  )
}
