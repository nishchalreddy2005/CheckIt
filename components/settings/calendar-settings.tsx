"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCalendarBackground } from "@/app/actions/profile-actions"
import type { User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, AlertCircle } from "lucide-react"
import { useFormStatus } from "react-dom"

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
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Saving..." : "Save"}
    </Button>
  )
}

export function CalendarSettings({ user }: { user: User }) {
  const [customUrl, setCustomUrl] = useState(user?.calendarBackground || "")
  const [previewUrl, setPreviewUrl] = useState(user?.calendarBackground || "")
  const [showPreview, setShowPreview] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [urlError, setUrlError] = useState("")

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

  // Create a form action that wraps the server action
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
    } catch (error) {
      setMessage(`Error: ${error.message}`)
      setIsSuccess(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Calendar Background</h3>
        <p className="text-sm text-muted-foreground">Choose a background image for your calendar view</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BACKGROUND_OPTIONS.map((option) => (
          <div
            key={option.url}
            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
              user?.calendarBackground === option.url
                ? "border-primary ring-2 ring-primary"
                : "border-border hover:border-primary/50"
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
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <Label htmlFor="custom-background">Custom Background URL</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="custom-background"
            placeholder="https://example.com/image.jpg"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value)
              if (urlError) validateUrl(e.target.value)
            }}
            className={`flex-1 ${urlError ? "border-red-500" : ""}`}
          />
          <Button type="button" variant="outline" onClick={handlePreviewCustomUrl} disabled={!customUrl}>
            Preview
          </Button>
          <form action={handleUpdateBackground} className="inline-block">
            <input type="hidden" name="backgroundUrl" value={customUrl} />
            <SubmitButton disabled={!customUrl || !!urlError} />
          </form>
        </div>
        {urlError && (
          <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>{urlError}</span>
          </div>
        )}
      </div>

      {showPreview && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Preview</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
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

      {message && <div className={`text-sm ${isSuccess ? "text-green-500" : "text-red-500"}`}>{message}</div>}
    </div>
  )
}
