"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Loader2, Upload, RefreshCw, Trash2 } from "lucide-react"
import type { User } from "@/lib/types"

export function EnhancedProfilePicture({ user }: { user: User }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=200&width=200`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first")
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("profilePicture", selectedFile)

      // Use fetch API directly for more control
      const response = await fetch("/api/profile/upload-picture", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload image")
      }

      const result = await response.json()
      setSuccess("Profile picture uploaded successfully!")
      setSelectedFile(null)

      // Force a refresh to show the updated image
      router.refresh()
    } catch (err) {
      console.error("Failed to upload image:", err)
      setError(err instanceof Error ? err.message : "Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePicture = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      // Use fetch API directly for more control
      const response = await fetch("/api/profile/delete-picture", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete image")
      }

      const result = await response.json()
      setSuccess("Profile picture deleted successfully!")

      // Force a refresh to show the updated image
      router.refresh()
    } catch (err) {
      console.error("Failed to delete image:", err)
      setError(err instanceof Error ? err.message : "Failed to delete image. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Hide success message after 3 seconds
  if (success) {
    setTimeout(() => {
      setSuccess(null)
    }, 3000)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-background shadow-lg">
          <Image
            src={profilePic || "/placeholder.svg"}
            alt={`${user.name}'s profile picture`}
            width={200}
            height={200}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        <label
          htmlFor="profile-picture-upload"
          className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
        >
          <Camera className="h-5 w-5" />
        </label>

        <input
          type="file"
          id="profile-picture-upload"
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading || isDeleting}
        />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold">{user.name}</h2>
        {user.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2">
          <span className="text-sm">{selectedFile.name}</span>
          <Button onClick={handleUpload} disabled={isUploading} size="sm">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("profile-picture-upload")?.click()}
          disabled={isUploading || isDeleting}
        >
          <Upload className="mr-2 h-4 w-4" />
          {user.profilePicture ? "Change Picture" : "Upload Picture"}
        </Button>

        {user.profilePicture && (
          <>
            <Button variant="outline" size="sm" onClick={() => router.refresh()} disabled={isUploading || isDeleting}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isUploading || isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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
                  <AlertDialogAction onClick={handleDeletePicture} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  )
}
