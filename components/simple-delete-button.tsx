"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function SimpleDeleteButton() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [status, setStatus] = useState<"success" | "error" | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setResult(null)
    setStatus(null)

    try {
      // Use a simple fetch request to delete the profile picture
      const response = await fetch("/api/profile/simple-delete", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult("Profile picture deleted successfully")
        setStatus("success")

        // Force a refresh after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setResult(data.message || "Failed to delete profile picture")
        setStatus("error")
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error)
      setResult("An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" className="w-full">
        {isDeleting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Profile Picture
          </>
        )}
      </Button>

      {result && (
        <div
          className={`p-3 rounded-md ${status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {result}
        </div>
      )}
    </div>
  )
}
