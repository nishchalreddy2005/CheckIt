"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { authenticateUser } from "@/app/actions/user-actions"
import { useActionState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Captcha } from "@/components/captcha"

// Initial state for form submission
const initialState = {
  message: "",
  success: false,
  userId: "",
  redirectTo: "",
  isSuperadmin: false,
}

// Action wrapper for useActionState
const loginAction = async (prevState, formData) => {
  try {
    // Verify captcha
    const userCaptcha = formData.get("captcha")
    const originalCaptcha = formData.get("originalCaptcha")

    if (!userCaptcha || userCaptcha.trim() === "") {
      return {
        message: "Please enter the CAPTCHA code",
        success: false,
        userId: "",
        redirectTo: "",
        isSuperadmin: false,
      }
    }

    if (userCaptcha !== originalCaptcha) {
      return {
        message: "Incorrect CAPTCHA code. Please try again.",
        success: false,
        userId: "",
        redirectTo: "",
        isSuperadmin: false,
      }
    }

    const result = await authenticateUser(formData)

    // Ensure we have a valid result object
    if (!result || typeof result !== "object") {
      return {
        message: "Received invalid response from server. Please try again.",
        success: false,
        userId: "",
        redirectTo: "",
        isSuperadmin: false,
      }
    }

    return {
      message: result.message || "Login processed",
      success: result.success || false,
      userId: result.userId || "",
      redirectTo: result.redirectTo || "",
      isSuperadmin: result.isSuperadmin || false,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      message: "An error occurred during login. Please try again.",
      success: false,
      userId: "",
      redirectTo: "",
      isSuperadmin: false,
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [captchaText, setCaptchaText] = useState("")

  // Create a custom action that includes the captcha text
  const handleSubmit = async (formData: FormData) => {
    // Add the captcha text to the form data
    formData.append("originalCaptcha", captchaText)
    return formAction(formData)
  }

  // Redirect to dashboard if login was successful
  useEffect(() => {
    if (state.success) {
      // Set redirecting state immediately to show loading UI
      setIsRedirecting(true)

      // Use a small timeout to ensure the success message is seen briefly
      const redirectTimeout = setTimeout(() => {
        if (state.redirectTo) {
          router.push(state.redirectTo)
        } else if (state.userId) {
          router.push("/dashboard")
        }
      }, 500) // Short delay for better UX

      return () => clearTimeout(redirectTimeout)
    }
  }, [state, router])

  // Determine if we should show loading state
  const isLoading = isPending || isRedirecting

  // Determine button text based on loading state
  const getButtonText = () => {
    if (isPending) return "Signing in..."
    if (isRedirecting) return "Redirecting to dashboard..."
    return "Sign in"
  }

  // Handle captcha generation
  const handleCaptchaGenerate = (value: string) => {
    setCaptchaText(value)
    console.log("New CAPTCHA generated:", value) // For debugging
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold tracking-tight">CheckIt</h1>
            </Link>
            <h2 className="mt-6 text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your tasks and 3D visualizations
            </p>
          </div>
          <form action={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input id="username" name="email" placeholder="Username or email" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA Section */}
              <div className="space-y-2">
                <Label htmlFor="captcha">Security Check</Label>
                <Captcha onGenerate={handleCaptchaGenerate} />
                <Input
                  id="captcha"
                  name="captcha"
                  placeholder="Enter the code shown above"
                  required
                  disabled={isLoading}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" name="remember" disabled={isLoading} />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </Label>
              </div>
            </div>

            {state.message && (
              <div className={`text-sm text-center ${state.success ? "text-green-500" : "text-red-500"}`}>
                {state.message}
                {!state.success && state.message === "Invalid username or password" && (
                  <p className="mt-1">Please check your credentials and try again.</p>
                )}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getButtonText()}
              </Button>
            </div>

            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
