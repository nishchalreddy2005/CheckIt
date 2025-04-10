"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createUser } from "@/app/actions/user-actions"
import { useActionState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Initial state for form submission
const initialState = {
  message: "",
  success: false,
  userId: "",
}

// Action wrapper for useFormState
const createUserAction = async (prevState, formData) => {
  try {
    const result = await createUser(formData)

    // Ensure we have a valid result object
    if (!result || typeof result !== "object") {
      return {
        message: "Received invalid response from server. Please try again.",
        success: false,
        userId: "",
      }
    }

    return {
      message: result.message || "Account creation processed",
      success: result.success || false,
      userId: result.userId || "",
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      message: "An error occurred during registration. Please try again.",
      success: false,
      userId: "",
    }
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createUserAction, initialState)
  const [connectionError, setConnectionError] = useState(false)

  // Check Redis connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/check-redis")
        if (!response.ok) {
          setConnectionError(true)
        }
      } catch (error) {
        console.error("Failed to check Redis connection:", error)
        setConnectionError(true)
      }
    }

    checkConnection()
  }, [])

  // Redirect to dashboard if registration was successful
  useEffect(() => {
    if (state.success && state.userId) {
      // Use window.location for a full page navigation instead of router.push
      // This ensures a clean state and avoids potential stale data issues
      window.location.href = "/dashboard"
    }
  }, [state])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold tracking-tight">CheckIt</h1>
            </Link>
            <h2 className="mt-6 text-2xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign up to start visualizing your tasks in 3D</p>
          </div>

          {connectionError && (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>
                Unable to connect to the database. Please try again later or contact support.
              </AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" name="first-name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" name="last-name" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" name="confirm-password" type="password" required />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" name="terms" required />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    terms of service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    privacy policy
                  </Link>
                </Label>
              </div>
            </div>

            {state.message && (
              <div className={`text-sm text-center ${state.success ? "text-green-500" : "text-red-500"}`}>
                {state.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending || connectionError}>
              {isPending ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
