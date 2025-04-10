"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/types"

// Map of timezone identifiers to their IANA timezone strings
const timezoneMap = {
  UTC: "UTC",
  IST: "Asia/Kolkata", // Indian Standard Time
  EST: "America/New_York",
  CST: "America/Chicago",
  MST: "America/Denver",
  PST: "America/Los_Angeles",
}

export function LiveClock({ user }: { user: User }) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  // Get the user's timezone or default to UTC
  const userTimezone = user?.timezone || "UTC"

  useEffect(() => {
    setMounted(true)

    // Update the time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Clean up the interval on unmount
    return () => clearInterval(timer)
  }, [])

  // Don't render anything on the server to prevent hydration mismatch
  if (!mounted) {
    return <div className="text-sm font-medium">Loading time...</div>
  }

  // Format the date and time according to the user's timezone
  const formatTimeInTimezone = (date: Date, timezone: string): string => {
    try {
      // Use the browser's Intl API for accurate timezone conversion
      const tzString = timezoneMap[timezone] || "UTC"

      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: tzString,
      }

      return new Intl.DateTimeFormat("en-US", options).format(date) + ` (${timezone})`
    } catch (error) {
      console.error("Error formatting time:", error)
      return date.toLocaleString() + ` (UTC)`
    }
  }

  return <div className="text-sm font-medium">{formatTimeInTimezone(currentTime, userTimezone)}</div>
}
