"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/app/actions/profile-actions"

export function DeleteAccount() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError("")

    try {
      const result = await deleteAccount()

      if (result.success) {
        // Redirect to home page after successful deletion
        router.push("/")
      } else {
        setError(result.message)
        setIsDeleting(false)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Delete Account</h3>
      <p className="text-sm text-muted-foreground">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
