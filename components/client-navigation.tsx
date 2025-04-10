"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function ClientNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Force a refresh when navigating to the profile page
    // This is a temporary fix until the root cause is resolved
    if (pathname === "/profile") {
      const lastNavTime = sessionStorage.getItem("lastProfileNavTime")
      const currentTime = Date.now().toString()

      if (!lastNavTime) {
        // First visit to profile, store the time and refresh once
        sessionStorage.setItem("lastProfileNavTime", currentTime)
        router.refresh()
      } else {
        // Update the last navigation time for future visits
        sessionStorage.setItem("lastProfileNavTime", currentTime)
      }
    }
  }, [pathname, router])

  return null
}
