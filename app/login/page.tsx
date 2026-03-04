"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { authenticateUser, verifyLoginOtp } from "@/app/actions/user-actions"
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
  requireTwoFactor: false,
}

// Action wrapper for useActionState
const loginAction = async (prevState: any, formData: FormData) => {
  try {
    // Verify captcha
    const userCaptcha = formData.get("captcha")
    const originalCaptcha = formData.get("originalCaptcha")

    if (!userCaptcha || typeof userCaptcha !== "string" || userCaptcha.trim() === "") {
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
      requireTwoFactor: result.requireTwoFactor || false,
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

  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  // Create a custom action that includes the captcha text
  const handleSubmit = async (formData: FormData) => {
    // Add the captcha text to the form data
    formData.append("originalCaptcha", captchaText)
    return formAction(formData)
  }

  // Redirect to dashboard if login was successful
  useEffect(() => {
    if (state.success && state.requireTwoFactor) {
      setShowOtpForm(true)
    } else if (state.success) {
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code")
      return
    }

    setIsVerifying(true)
    setOtpError("")

    try {
      const result = await verifyLoginOtp(state.userId, otpCode)
      if (result.success) {
        setIsRedirecting(true)
        setTimeout(() => {
          if (result.redirectTo) {
            router.push(result.redirectTo)
          } else {
            router.push("/dashboard")
          }
        }, 1500)
      } else {
        setOtpError(result.message || "Verification failed")
        setIsVerifying(false)
      }
    } catch (err) {
      setOtpError("An error occurred. Please try again.")
      setIsVerifying(false)
    }
  }

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
    <div className="flex min-h-screen flex-col text-white bg-transparent">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md space-y-8 glass-card p-8 md:p-10 rounded-3xl shadow-2xl border-t border-l border-white/20">
          <div className="text-center">
            <Link href="/" className="inline-block hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-indigo-500 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)] mb-4">
                <span className="text-2xl font-bold text-white leading-none">C</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md">CheckIt</h1>
            </Link>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-500">
              {showOtpForm ? "Two-Factor Verification" : "Sign in to your reality"}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {showOtpForm
                ? "Enter the 6-digit code sent to your email"
                : "Enter your credentials to access your tasks and immersive 3D space"}
            </p>
          </div>

          {showOtpForm ? (
            <form onSubmit={handleOtpSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <Input
                    id="otp"
                    name="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                    className="glass-input h-14 text-center text-3xl tracking-widest font-mono"
                    placeholder="000000"
                    disabled={isVerifying || isRedirecting}
                  />
                </div>
              </div>

              {otpError && (
                <div className="text-sm text-center p-3 rounded-lg border backdrop-blur-md text-pink-300 bg-pink-500/10 border-pink-500/20">
                  {otpError}
                </div>
              )}

              {isRedirecting && !otpError && (
                <div className="text-sm text-center p-3 rounded-lg border backdrop-blur-md text-emerald-300 bg-emerald-500/10 border-emerald-500/20">
                  Verified successfully! Redirecting...
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500/50 transition-all font-bold tracking-wide" disabled={isVerifying || isRedirecting || otpCode.length !== 6}>
                  {isVerifying ? "Verifying..." : isRedirecting ? "Redirecting..." : "Verify Login"}
                </Button>
              </div>
            </form>
          ) : (
            <form action={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">Username or Email</Label>
                  <Input id="username" name="email" placeholder="astronaut@checkit.com" required disabled={isLoading} className="glass-input h-11" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white/80">Password</Label>
                    <Link href="/forgot-password" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
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
                      className="glass-input h-11 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
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
                  <Label htmlFor="captcha" className="text-white/80">Security Check</Label>
                  <div className="p-2 glass-panel rounded-xl">
                    <Captcha onGenerate={handleCaptchaGenerate} />
                  </div>
                  <Input
                    id="captcha"
                    name="captcha"
                    placeholder="Enter the code shown above"
                    required
                    disabled={isLoading}
                    className="mt-2 glass-input h-11"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" name="remember" disabled={isLoading} className="border-indigo-400 data-[state=checked]:bg-indigo-500" />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/70 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
              </div>

              {state.message && (
                <div className={`text-sm text-center p-3 rounded-lg border backdrop-blur-md ${state.success ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-pink-300 bg-pink-500/10 border-pink-500/20"}`}>
                  {state.message}
                  {!state.success && state.message === "Invalid username or password" && (
                    <p className="mt-1 opacity-80">Please check your credentials and try again.</p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500/50 transition-all font-bold tracking-wide" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getButtonText()}
                </Button>
              </div>

              <div className="text-center text-sm text-white/50 pt-2 border-t border-white/10 mt-6">
                Don't have an account?{" "}
                <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors ml-1">
                  Sign up
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
