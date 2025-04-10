"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { DeleteAccount } from "@/components/delete-account"
import { updateProfile } from "@/app/actions/profile-actions"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import { ProfilePicture } from "@/components/profile-picture"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Initial state for form submission
const initialState = {
  message: "",
  success: false,
  user: null as User | null,
}

// Action wrapper for useActionState
const updateProfileAction = async (prevState, formData) => {
  const result = await updateProfile(formData)
  return {
    message: result.message,
    success: result.success,
    user: result.user || null,
  }
}

export function AccountSettings({ user }: { user: User }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)
  const [currentUser, setCurrentUser] = useState(user)
  const [language, setLanguage] = useState(user.language || "en")
  const [timezone, setTimezone] = useState(user.timezone || "UTC")
  const [showMessage, setShowMessage] = useState(false)

  // Update local state when user prop changes
  useEffect(() => {
    setCurrentUser(user)
    setLanguage(user.language || "en")
    setTimezone(user.timezone || "UTC")
  }, [user])

  // Handle successful form submission
  useEffect(() => {
    if (state.success && state.user) {
      // Update local state with new values
      setCurrentUser(state.user)
      setLanguage(state.user.language || "en")
      setTimezone(state.user.timezone || "UTC")

      // Show message
      setShowMessage(true)

      // Hide message after 2 seconds
      const messageTimer = setTimeout(() => {
        setShowMessage(false)
      }, 2000)

      // Force a refresh after a short delay to ensure the server has the updated data
      const refreshTimer = setTimeout(() => {
        router.refresh()
      }, 1000)

      return () => {
        clearTimeout(messageTimer)
        clearTimeout(refreshTimer)
      }
    }
  }, [state, router])

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="flex flex-col items-center mb-6">
          <ProfilePicture user={currentUser} size="lg" onUpdate={(updatedUser) => setCurrentUser(updatedUser)} />
          <p className="text-sm text-muted-foreground mt-2">Upload a profile picture</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" defaultValue={currentUser.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={currentUser.email} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" name="bio" defaultValue={currentUser.bio || ""} placeholder="Tell us about yourself" />
        </div>

        <div className="space-y-2">
          <Label>Theme Preference</Label>
          <RadioGroup defaultValue={currentUser.theme || "light"} name="theme" className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Extended Settings</h3>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              name="language"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              name="timezone"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="IST">Indian Standard Time (IST)</option>
              <option value="EST">Eastern Time (EST)</option>
              <option value="CST">Central Time (CST)</option>
              <option value="MST">Mountain Time (MST)</option>
              <option value="PST">Pacific Time (PST)</option>
            </select>
          </div>
        </div>

        {showMessage && state.success && (
          <Alert variant="default" className="bg-green-50 text-green-700 border-green-200">
            <AlertDescription>
              {state.message}
              <p className="text-xs mt-1">Your settings have been updated. Changes will be applied immediately.</p>
            </AlertDescription>
          </Alert>
        )}

        {!showMessage && state.message && !state.success && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <Separator />

      <DeleteAccount />
    </div>
  )
}
