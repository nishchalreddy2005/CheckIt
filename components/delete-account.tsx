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
      const result = await deleteAccount(new FormData())

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
      <h3 className="text-lg font-medium text-white/90">Delete Account</h3>
      <p className="text-sm text-pink-300/80">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {error && <div className="text-sm text-red-400 p-2 bg-red-500/10 rounded border border-red-500/20">{error}</div>}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="glass-panel text-white border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] border-none">Delete Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
