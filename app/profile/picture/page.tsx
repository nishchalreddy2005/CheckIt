"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, Trash2 } from "lucide-react"
import Link from "next/link"

export default function ProfilePicturePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/user")
        const data = await response.json()

        if (data.success) {
          setUser(data.user)
        } else {
          setError("Failed to load user data")
        }
      } catch (err) {
        setError("An error occurred while loading user data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

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

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
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
      const response = await fetch("/api/profile/delete-picture", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete image")
      }

      const result = await response.json()
      setSuccess("Profile picture deleted successfully!")

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error("Failed to delete image:", err)
      setError(err instanceof Error ? err.message : "Failed to delete image. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load user data. Please <Link href="/login">log in</Link> and try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=300&width=300`

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload or delete your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative h-60 w-60 rounded-full overflow-hidden border-4 border-background shadow-lg">
              <Image
                src={profilePic || "/placeholder.svg"}
                alt={`${user.name}'s profile picture`}
                width={300}
                height={300}
                className="object-cover w-full h-full"
                priority
              />
            </div>
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

          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => document.getElementById("profile-picture-upload")?.click()}
                disabled={isUploading || isDeleting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {user.profilePicture ? "Change Picture" : "Upload Picture"}
              </Button>
              <input
                type="file"
                id="profile-picture-upload"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isUploading || isDeleting}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between">
                <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                <Button onClick={handleUpload} disabled={isUploading} size="sm">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            )}

            {user.profilePicture && (
              <div className="flex justify-center">
                <Button variant="destructive" onClick={handleDeletePicture} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Picture
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-4">
            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
