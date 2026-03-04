import { redirect } from "next/navigation"
import { verifyEmail } from "@/lib/security"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>No verification token provided.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/profile">
              <Button>Return to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await verifyEmail(token)

  if (result.success) {
    // Redirect to profile page after successful verification
    redirect("/profile?verified=true")
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/profile">
            <Button>Return to Profile</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
