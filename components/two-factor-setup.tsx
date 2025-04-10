"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { enableTwoFactor, verifyTwoFactorSetup, disableTwoFactor } from "@/app/actions/profile-actions"
import Image from "next/image"
import type { User } from "@/lib/types"

interface TwoFactorSetupProps {
  user: User
}

export function TwoFactorSetup({ user }: TwoFactorSetupProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [setupData, setSetupData] = useState<{
    secret: string
    qrCodeUrl: string
  } | null>(null)

  async function handleEnable() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await enableTwoFactor()

      if (result.success && result.secret && result.qrCodeUrl) {
        setSetupData({
          secret: result.secret,
          qrCodeUrl: result.qrCodeUrl,
        })
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
        setSetupData(null)
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
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Two-factor authentication is currently enabled for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>Two-factor authentication has been disabled</AlertDescription>
            </Alert>
          )}

          <p className="mb-4">
            Two-factor authentication adds an extra layer of security to your account by requiring a verification code
            from your authenticator app in addition to your password.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleDisable} disabled={loading} className="w-full">
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

  if (setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>Scan the QR code with your authenticator app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <div className="bg-white p-2 rounded">
              <Image src={setupData.qrCodeUrl || "/placeholder.svg"} alt="QR Code" width={200} height={200} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Secret Key (if you can't scan the QR code)</Label>
            <Input id="secret" value={setupData.secret} readOnly onClick={(e) => e.currentTarget.select()} />
          </div>

          <form action={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input id="token" name="token" placeholder="Enter the 6-digit code" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
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
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Two-factor authentication adds an extra layer of security to your account by requiring a verification code
          from your authenticator app in addition to your password.
        </p>
        <Button onClick={handleEnable} disabled={loading} className="w-full">
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
