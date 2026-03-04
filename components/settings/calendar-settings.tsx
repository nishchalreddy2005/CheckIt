"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCalendarBackground } from "@/app/actions/profile-actions"
import { uploadCalendarBackground } from "@/app/actions/calendar-actions-upload"
import type { User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, AlertCircle, Upload, Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"

// Predefined background options
const BACKGROUND_OPTIONS = [
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
    label: "Mountains",
  },
  {
    url: "https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=2070&auto=format&fit=crop",
    label: "Sunrise",
  },
  {
    url: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=2070&auto=format&fit=crop",
    label: "Forest",
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
    label: "Beach",
  },
  {
    url: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2070&auto=format&fit=crop",
    label: "Sunset",
  },
]

// Submit button with pending state
function SubmitButton({ disabled = false }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none whitespace-nowrap">
      {pending ? "Saving..." : "Save"}
    </Button>
  )
}

export function CalendarSettings({ user }: { user: User }) {
  const router = useRouter()
  const [customUrl, setCustomUrl] = useState(user?.calendarBackground || "")
  const [previewUrl, setPreviewUrl] = useState(user?.calendarBackground || "")
  const [showPreview, setShowPreview] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [urlError, setUrlError] = useState("")

  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateUrl = (url: string) => {
    if (!url || url.trim() === "") {
      setUrlError("URL cannot be empty")
      return false
    }

    try {
      new URL(url)
      setUrlError("")
      return true
    } catch (e) {
      setUrlError("Please enter a valid URL")
      return false
    }
  }

  const handlePreviewCustomUrl = () => {
    if (validateUrl(customUrl)) {
      setPreviewUrl(customUrl)
      setShowPreview(true)
    }
  }

  // Create a form action that wraps the server action for URLs
  const handleUpdateBackground = async (formData: FormData) => {
    const url = formData.get("backgroundUrl") as string

    if (!validateUrl(url)) {
      return
    }

    try {
      const result = await updateCalendarBackground(url)
      setMessage(result.message)
      setIsSuccess(result.success)

      if (result.success) {
        setShowPreview(false)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setIsSuccess(false)
    }
  }

  // Handle direct file uploads to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file")
      setIsSuccess(false)
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage("Image file size must be under 8MB")
      setIsSuccess(false)
      return
    }

    setIsUploading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("calendarBackground", file)

      const result = await uploadCalendarBackground(formData)

      if (result.success) {
        setCustomUrl(result.user?.calendarBackground || "")
        setMessage("Uploaded successfully!")
        setIsSuccess(true)
        setShowPreview(false)
        router.refresh()
      } else {
        setMessage(result.message)
        setIsSuccess(false)
      }
    } catch (error) {
      setMessage("An error occurred during upload")
      setIsSuccess(false)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white/90">Calendar Background</h3>
        <p className="text-sm text-white/60">Choose a background image for your calendar view</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BACKGROUND_OPTIONS.map((option) => (
          <div
            key={option.url}
            className={`relative rounded-xl overflow-hidden border-2 transition-all ${user?.calendarBackground === option.url
              ? "border-indigo-400 ring-2 ring-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-[1.02]"
              : "border-white/10 hover:border-indigo-400/50"
              }`}
          >
            <form action={handleUpdateBackground}>
              <input type="hidden" name="backgroundUrl" value={option.url} />
              <button
                type="submit"
                className="w-full h-full absolute inset-0 cursor-pointer z-10"
                aria-label={`Select ${option.label} background`}
              />
            </form>
            <div className="aspect-video w-full">
              <img src={option.url || "/placeholder.svg"} alt={option.label} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-medium">{option.label}</span>
            </div>
            {user?.calendarBackground === option.url && (
              <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1 shadow-[0_0_10px_rgba(99,102,241,0.8)] backdrop-blur-sm">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/10 mt-6 space-y-4">
        <div>
          <Label className="text-white/80">Upload Custom Background</Label>
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-white/5 w-full sm:w-auto flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Uploading to Cloudinary..." : "Upload Local Image"}
            </Button>
            <p className="text-xs text-white/40 mt-2">Max 8MB. JPG, PNG, WEBP.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-white/40 uppercase tracking-widest">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div>
          <Label htmlFor="custom-background" className="text-white/80">Paste Public Image URL</Label>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <Input
              id="custom-background"
              placeholder="https://example.com/image.jpg"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value)
                if (urlError) validateUrl(e.target.value)
              }}
              className={`flex-1 glass-input ${urlError ? "border-pink-500/50 text-pink-200 bg-pink-500/5" : ""}`}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handlePreviewCustomUrl} disabled={!customUrl} className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                Preview
              </Button>
              <form action={handleUpdateBackground} className="inline-block flex-1 sm:flex-none">
                <input type="hidden" name="backgroundUrl" value={customUrl} />
                <SubmitButton disabled={!customUrl || !!urlError} />
              </form>
            </div>
          </div>
          {urlError && (
            <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{urlError}</span>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <Card className="mt-6 glass-panel border-white/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-white/90">Preview</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} className="text-white/60 hover:text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="aspect-video w-full rounded-md overflow-hidden">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => {
                  setPreviewUrl("https://placehold.co/600x400?text=Invalid+Image+URL")
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {message && <div className={`text-sm p-3 rounded-lg backdrop-blur-md border ${isSuccess ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-pink-300 bg-pink-500/10 border-pink-500/20"}`}>{message}</div>}
    </div>
  )
}
