"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createUser, verifyRegistrationOtp } from "@/app/actions/user-actions"
import { useActionState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Initial state for form submission
const initialState: {
  message: string;
  success: boolean;
  userId: string;
  requireOtpVerification: boolean;
  email: string;
} = {
  message: "",
  success: false,
  userId: "",
  requireOtpVerification: false,
  email: "",
}

// Action wrapper for useFormState
const createUserAction = async (prevState: any, formData: FormData) => {
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
      requireOtpVerification: result.requireOtpVerification || false,
      email: result.email || "",
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      message: "An error occurred during registration. Please try again.",
      success: false,
      userId: "",
      requireOtpVerification: false,
      email: "",
    }
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createUserAction, initialState)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (state.success && state.requireOtpVerification) {
      setShowOtpForm(true)
    } else if (state.success) {
      // Fallback if no OTP required
      setIsRedirecting(true)
      const timer = setTimeout(() => {
        router.push("/login")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.success, state.requireOtpVerification, router])

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code")
      return
    }

    setIsVerifying(true)
    setOtpError("")

    try {
      const result = await verifyRegistrationOtp(state.userId, otpCode)
      if (result.success) {
        setIsRedirecting(true)
        setTimeout(() => {
          router.push("/dashboard")
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

  const isLoading = isPending || isRedirecting

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
              {showOtpForm ? "Verify your email" : "Create your reality"}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {showOtpForm
                ? `Enter the 6-digit code sent to ${state.email}`
                : "Sign up to start visualizing your tasks in immersive 3D"}
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
                  Verified successfully! Redirecting to dashboard...
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500/50 transition-all font-bold tracking-wide" disabled={isVerifying || isRedirecting || otpCode.length !== 6}>
                  {isVerifying ? "Verifying..." : isRedirecting ? "Constructing node..." : "Verify"}
                </Button>
              </div>
            </form>
          ) : (
            <form action={formAction} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="text-white/80">First name</Label>
                    <Input id="first-name" name="first-name" required className="glass-input h-11" disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="text-white/80">Last name</Label>
                    <Input id="last-name" name="last-name" required className="glass-input h-11" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">Username</Label>
                  <Input id="username" name="username" required className="glass-input h-11" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="name@example.com" required className="glass-input h-11" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <Input id="password" name="password" type="password" required className="glass-input h-11" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white/80">Confirm password</Label>
                  <Input id="confirm-password" name="confirm-password" type="password" required className="glass-input h-11" disabled={isLoading} />
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox id="enable-2fa" name="enable-2fa" className="border-indigo-400 data-[state=checked]:bg-indigo-500 mt-1" disabled={isLoading} />
                  <Label
                    htmlFor="enable-2fa"
                    className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/90"
                  >
                    Enable Two-Factor Authentication (2FA) for better security
                  </Label>
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox id="terms" name="terms" required className="border-indigo-400 data-[state=checked]:bg-indigo-500 mt-1" disabled={isLoading} />
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/70"
                  >
                    I agree to the{" "}
                    <Link href="/terms" className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                      terms of service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                      privacy policy
                    </Link>
                  </Label>
                </div>
              </div>

              {state.message && (
                <div className={`text-sm text-center p-3 rounded-lg border backdrop-blur-md ${state.success ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-pink-300 bg-pink-500/10 border-pink-500/20"}`}>
                  {state.message}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500/50 transition-all font-bold tracking-wide" disabled={isLoading}>
                  {isLoading ? "Sending code..." : "Create account"}
                </Button>
              </div>

              <div className="text-center text-sm text-white/50 pt-2 border-t border-white/10 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors ml-1">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
