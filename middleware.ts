import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateSession } from "./lib/security"

// Update the middleware function to handle potential errors with session validation
export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("sessionId")?.value
  const path = request.nextUrl.pathname

  // Add this at the beginning of the middleware function
  console.log(`Middleware processing path: ${path}`)

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/demo", "/forgot-password", "/reset-password", "/verify-email", "/terms", "/privacy", "/help", "/sw.js", "/manifest.json"]
  if (publicRoutes.includes(path)) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!sessionId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // Validate session
    const { valid, userId, isAdmin, isSuperadmin } = await validateSession(sessionId)

    if (!valid || !userId) {
      console.log("Invalid session detected in middleware")
      // Clear invalid session cookie
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("sessionId")
      return response
    }

    // Add this logging to help debug
    console.log(`Valid session for user: ${userId}, navigating to: ${path}`)

    // Check if this is a superadmin route
    if (path.startsWith("/superadmin")) {
      // Check if user is a superadmin
      if (!isSuperadmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Check if this is an admin route
    if (path.startsWith("/admin")) {
      // Check if user is an admin or superadmin
      if (!isAdmin && !isSuperadmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    return NextResponse.next()
  } catch (error: any) {
    console.error("Middleware error:", error)

    // Only redirect on critical errors, not for navigation issues
    if (error.message && error.message.includes("authentication")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // For other errors, allow the navigation to proceed
    console.log("Allowing navigation despite error")
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
