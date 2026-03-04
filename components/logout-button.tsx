"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // Skip the server action and directly invalidate the session on the client
      // This prevents multiple redirects

      // Force a direct hard navigation to the home page
      window.location.replace("/")

      // The API call to invalidate the session will happen in the background
      fetch("/api/logout", { method: "GET" }).catch((err) => console.error("Background logout request failed:", err))
    } catch (error) {
      console.error("Logout failed:", error)
      window.location.replace("/")
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`text-sm font-medium hover:underline ${className}`}
    >
      {isLoggingOut ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <LogOut className="h-5 w-5" />
      )}
    </button>
  )
}
