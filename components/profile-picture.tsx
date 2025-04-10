"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { uploadProfilePicture } from "@/app/actions/profile-actions"
import type { User } from "@/lib/types"

interface ProfilePictureProps {
  user: User
  size?: "sm" | "md" | "lg"
  onUpdate?: (user: User) => void
  editable?: boolean
}

export function ProfilePicture({ user, size = "md", onUpdate, editable = true }: ProfilePictureProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine dimensions based on size
  const dimensions = {
    sm: { width: 40, height: 40, className: "h-10 w-10" },
    md: { width: 80, height: 80, className: "h-20 w-20" },
    lg: { width: 120, height: 120, className: "h-30 w-30" },
  }[size]

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

    try {
      const formData = new FormData()
      formData.append("profilePicture", file)

      const result = await uploadProfilePicture(formData)

      if (result.success && result.user) {
        if (onUpdate) {
          onUpdate(result.user)
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=${dimensions.height}&width=${dimensions.width}`

  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-full overflow-hidden ${dimensions.className} bg-gray-100`}>
        <Image
          src={profilePic || "/placeholder.svg"}
          alt={`${user.name}'s profile picture`}
          width={dimensions.width}
          height={dimensions.height}
          className="object-cover"
        />

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {editable && (
        <>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

          <Button variant="ghost" size="sm" onClick={handleButtonClick} disabled={isUploading} className="mt-2">
            <Camera className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Change Photo"}
          </Button>

          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </>
      )}
    </div>
  )
}
