"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function ApiDeleteButton() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [status, setStatus] = useState<"success" | "error" | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setResult(null)
    setStatus(null)

    try {
      const response = await fetch("/api/profile/force-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(`API Success: ${data.message}`)
        setStatus("success")

        // Force a refresh after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setResult(`API Error: ${data.message || "Unknown error"}`)
        setStatus("error")
      }
    } catch (error) {
      console.error("Error calling API:", error)
      setResult(`API Error: ${error instanceof Error ? error.message : String(error)}`)
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
            Deleting via API...
          </>
        ) : (
          "Delete Profile Picture via API"
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
