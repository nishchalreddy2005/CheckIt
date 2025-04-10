"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import { updateProfile } from "@/app/actions/profile-actions"
import { useActionState } from "react"
import type { User } from "@/lib/types"

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

export function PrivacyForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)
  const [dataCollection, setDataCollection] = useState(true)
  const [activityTracking, setActivityTracking] = useState(true)

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="data-collection" className="block">
                Data Collection
              </Label>
              <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve your experience</p>
            </div>
            <Switch
              id="data-collection"
              name="dataCollection"
              checked={dataCollection}
              onCheckedChange={setDataCollection}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="activity-tracking" className="block">
                Activity Tracking
              </Label>
              <p className="text-sm text-muted-foreground">Track your activity to provide insights and analytics</p>
            </div>
            <Switch
              id="activity-tracking"
              name="activityTracking"
              checked={activityTracking}
              onCheckedChange={setActivityTracking}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Visibility</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="radio" id="private" name="dataVisibility" value="private" defaultChecked />
                <Label htmlFor="private">Private - Only visible to you</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="team" name="dataVisibility" value="team" />
                <Label htmlFor="team">Team - Visible to your team members</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="public" name="dataVisibility" value="public" />
                <Label htmlFor="public">Public - Visible to everyone</Label>
              </div>
            </div>
          </div>
        </div>

        {state.message && (
          <div className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>{state.message}</div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </form>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <TwoFactorSetup user={user} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Data Export & Deletion</h3>
        <p className="text-sm text-muted-foreground">
          You can export all your data or request to delete your account and all associated data.
        </p>
        <div className="flex space-x-4">
          <Button variant="outline">Export Data</Button>
          <Button variant="destructive">Request Data Deletion</Button>
        </div>
      </div>
    </div>
  )
}
