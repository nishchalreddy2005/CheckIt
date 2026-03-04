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
const updateProfileAction = async (prevState: any, formData: FormData) => {
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
  const [timezone, setTimezone] = useState(user.timezone || "UTC")
  const [showMessage, setShowMessage] = useState(false)

  // Update local state when user prop changes
  useEffect(() => {
    setCurrentUser(user)
    setTimezone(user.timezone || "UTC")
  }, [user])

  // Handle successful form submission
  useEffect(() => {
    if (state.success && state.user) {
      // Update local state with new values
      setCurrentUser(state.user)
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
          <p className="text-sm text-white/50 mt-3 font-medium">Upload a profile picture</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/80">Full Name</Label>
          <Input id="name" name="name" defaultValue={currentUser.name} required className="glass-input" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={currentUser.email} required className="glass-input opacity-70" readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-white/80">Bio</Label>
          <Input id="bio" name="bio" defaultValue={currentUser.bio || ""} placeholder="Tell us about yourself" className="glass-input" />
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-white/80">Theme Preference</Label>
          <RadioGroup defaultValue={currentUser.theme || "dark"} name="theme" className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" className="border-white/40 text-white" />
              <Label htmlFor="light" className="text-white/70 cursor-pointer">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" className="border-indigo-400 text-indigo-400" />
              <Label htmlFor="dark" className="text-indigo-300 font-medium cursor-pointer drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" className="border-white/40 text-white" />
              <Label htmlFor="system" className="text-white/70 cursor-pointer">System</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-6 bg-white/10" />

        <div className="space-y-5">
          <h3 className="text-lg font-medium text-white/90">Extended Settings</h3>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-white/80">Timezone</Label>
            <select
              id="timezone"
              name="timezone"
              className="w-full rounded-md border border-white/20 bg-black/40 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 [&>option]:bg-[#030014]"
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
          <Alert variant="default" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-200 backdrop-blur-md">
            <AlertDescription>
              {state.message}
              <p className="text-xs mt-1 text-emerald-200/70">Your settings have been updated. Changes will be applied immediately.</p>
            </AlertDescription>
          </Alert>
        )}

        {!showMessage && state.message && !state.success && (
          <Alert variant="destructive" className="bg-pink-500/10 border-pink-500/30 text-pink-200 backdrop-blur-md">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none w-full sm:w-auto mt-2">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <Separator className="bg-white/10" />

      <DeleteAccount />
    </div>
  )
}
