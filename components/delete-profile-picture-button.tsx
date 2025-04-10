"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { deleteProfilePictureDirectly } from "@/app/actions/profile-picture-delete"
import { useRouter } from "next/navigation"
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
import { toast } from "@/components/ui/use-toast"

export function DeleteProfilePictureButton() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteProfilePictureDirectly()

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile picture deleted successfully",
        })

        // Force a refresh to update the UI
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to delete profile picture",
        })
      }
    } catch (error) {
      console.error("Error in delete handler:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Picture
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Profile Picture</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your profile picture? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
