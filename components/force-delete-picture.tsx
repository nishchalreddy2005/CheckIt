"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { forceDeleteProfilePicture, testRedisConnection } from "@/app/actions/direct-redis-delete"
import { useRouter } from "next/navigation"

export function ForceDeletePicture() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [status, setStatus] = useState<"success" | "error" | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setResult(null)
    setStatus(null)

    try {
      const response = await forceDeleteProfilePicture()

      if (response.success) {
        setResult(`Success: ${response.message}`)
        setStatus("success")

        // Force a refresh after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setResult(`Error: ${response.message}`)
        setStatus("error")
      }
    } catch (error) {
      console.error("Error in delete handler:", error)
      setResult(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      setStatus("error")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setResult(null)
    setStatus(null)

    try {
      const response = await testRedisConnection()

      if (response.success) {
        setResult(`Success: ${response.message}`)
        setStatus("success")
      } else {
        setResult(`Error: ${response.message}`)
        setStatus("error")
      }
    } catch (error) {
      console.error("Error testing connection:", error)
      setResult(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      setStatus("error")
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile Picture Deletion Tool</CardTitle>
        <CardDescription>Use this tool to force delete your profile picture from the database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button onClick={handleTestConnection} disabled={isTesting || isDeleting} variant="outline">
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Redis Connection...
                </>
              ) : (
                "Test Redis Connection"
              )}
            </Button>

            <Button onClick={handleDelete} disabled={isTesting || isDeleting} variant="destructive">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Profile Picture...
                </>
              ) : (
                "Force Delete Profile Picture"
              )}
            </Button>
          </div>

          {result && (
            <div
              className={`p-3 rounded-md ${status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => router.push("/profile")} className="w-full">
          Back to Profile
        </Button>
      </CardFooter>
    </Card>
  )
}
