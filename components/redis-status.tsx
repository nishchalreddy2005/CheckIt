"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function RedisStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/check-redis-status")
      const data = await response.json()

      if (response.ok && data.status === "success") {
        setStatus("connected")
        setErrorMessage(null)
      } else {
        setStatus("error")
        setErrorMessage(data.message || "Failed to connect to database")
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage("Failed to check database connection")
      console.error("Error checking Redis connection:", error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  if (status === "connected") {
    return null
  }

  return (
    <Alert variant={status === "checking" ? "default" : "destructive"} className="mb-4">
      <AlertDescription className="flex items-center justify-between">
        <span>
          {status === "checking"
            ? "Checking database connection..."
            : `Database connection error: ${errorMessage || "Unknown error"}`}
        </span>
        <Button variant="outline" size="sm" onClick={checkConnection} disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Retry Connection"
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
