"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Upload, RefreshCw, Wrench } from "lucide-react"
import { uploadProfilePicture } from "@/app/actions/profile-actions"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import Link from "next/link"

export function ProfilePictureSection({ user }: { user: User }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("profilePicture", file)

      const result = await uploadProfilePicture(formData)

      if (result.success) {
        setSuccess("Profile picture updated successfully!")
        // Force a refresh to show the updated image
        router.refresh()
      } else {
        setError(result.message || "Failed to upload image. Please try again.")
      }
    } catch (err: any) {
      console.error("Profile picture upload error:", err)
      setError(`Failed to upload image: ${err.message || "Unknown error"}`)
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=200&width=200`

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
          disabled={isUploading}
        />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold">{user.name}</h2>
        {user.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
      </div>

      {isUploading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading your profile picture...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-500 flex items-center">
          <span className="mr-2">✓</span> {success}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("profile-picture-upload")?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {user.profilePicture ? "Change Picture" : "Upload Picture"}
        </Button>

        {user.profilePicture && (
          <>
            <Button variant="outline" size="sm" onClick={() => router.refresh()} disabled={isUploading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Link href="/profile/delete-picture-tool">
              <Button variant="destructive" size="sm">
                <Wrench className="mr-2 h-4 w-4" />
                Delete Picture
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
