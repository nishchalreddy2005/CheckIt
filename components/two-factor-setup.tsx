"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { enableTwoFactor, verifyTwoFactorSetup, disableTwoFactor } from "@/app/actions/profile-actions"
import type { User } from "@/lib/types"

interface TwoFactorSetupProps {
  user: User
}

export function TwoFactorSetup({ user }: TwoFactorSetupProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  async function handleEnable() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await enableTwoFactor()

      if (result.success) {
        setIsVerifying(true)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await verifyTwoFactorSetup(formData)

      if (result.success) {
        setSuccess(true)
        setIsVerifying(false)
        // Refresh the page to update the user state
        window.location.reload()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    setError(null)

    try {
      // Password verification removed
      const result = await disableTwoFactor()

      if (result.success) {
        setSuccess(true)
        // Refresh the page to update the user state
        window.location.reload()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (user.twoFactorEnabled) {
    return (
      <Card className="bg-transparent border-none shadow-none text-white p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-white/90">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-emerald-400">Two-factor authentication is currently enabled for your account</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/30 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-emerald-500/10 border-emerald-500/30 text-emerald-200">
              <AlertDescription>Two-factor authentication has been disabled</AlertDescription>
            </Alert>
          )}

          <p className="mb-4 text-white/70">
            Two-factor authentication adds an extra layer of security to your account by requiring an email verification code in addition to your password.
          </p>
        </CardContent>
        <CardFooter className="px-0 pb-0">
          <Button variant="destructive" onClick={handleDisable} disabled={loading} className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disabling...
              </>
            ) : (
              "Disable Two-Factor Authentication"
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (isVerifying) {
    return (
      <Card className="bg-transparent border-none shadow-none text-white p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-white/90">Verify Email Address</CardTitle>
          <CardDescription className="text-indigo-300">Enter the 6-digit code sent to your email to confirm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/30 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form action={handleVerify} className="space-y-4 mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-white/80">Verification Code</Label>
              <Input id="token" name="token" placeholder="Enter the 6-digit code" required className="glass-input text-center text-xl tracking-widest letter-spacing-2" maxLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.4)] border-none mt-2">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and Enable"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border-none shadow-none text-white p-0">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-white/90">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-white/60">Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <p className="mb-4 text-white/70">
          Two-factor authentication adds an extra layer of security to your account by requiring an email verification code in addition to your password.
        </p>
        <Button onClick={handleEnable} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            "Enable Two-Factor Authentication"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
