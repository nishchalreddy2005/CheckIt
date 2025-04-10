import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
;('"use client')

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sendVerificationEmail } from "@/lib/security"

interface EmailVerificationProps {
  userId: string
}

export function EmailVerification({ userId }: EmailVerificationProps) {
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState("")

  const handleSendVerificationEmail = async () => {
    setIsSending(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await sendVerificationEmail({ id: userId } as any, newEmail)

      if (result) {
        setSuccess(true)
      } else {
        setError("Failed to send verification email. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Email</CardTitle>
        <CardDescription>
          Verify your email address to unlock all features. A verification link will be sent to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>Verification email sent successfully. Please check your inbox.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="newEmail">New Email</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="Enter new email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>

        <Button onClick={handleSendVerificationEmail} disabled={isSending}>
          {isSending ? "Sending..." : "Send Verification Email"}
        </Button>
      </CardContent>
    </Card>
  )
}
