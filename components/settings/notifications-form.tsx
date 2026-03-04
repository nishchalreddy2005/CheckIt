"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { updateProfile } from "@/app/actions/profile-actions"
import { useActionState } from "react"
import type { User } from "@/lib/types"
import { savePushSubscription } from "@/app/actions/user-actions"

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

export function NotificationsForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [reminderTime, setReminderTime] = useState("09:00")
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Push notifications are not supported in this browser.")
      return
    }

    setIsSubscribing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BEl6mS7SshGOnOT9u79Z5SRp7V_5A8p1f-4kLh-U8_FjW-A6-q_Y8u_4_8_8_8_8_8_8_8_8_8_8_8_8" // Replace with real VAPID key in production
      })

      const result = await savePushSubscription(JSON.stringify(subscription))
      if (result.success) {
        alert("Successfully subscribed to push notifications!")
      } else {
        alert("Failed to save subscription.")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Error subscribing to notifications.")
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications" className="block">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">Receive email notifications for task updates</p>
          </div>
          <Switch
            id="email-notifications"
            name="emailNotifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="push-notifications" className="block">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">Receive push notifications for task updates</p>
          </div>
          <Switch
            id="push-notifications"
            name="pushNotifications"
            checked={pushNotifications}
            onCheckedChange={setPushNotifications}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <div>
            <Label className="block text-indigo-300 font-bold">Browser Push Notifications</Label>
            <p className="text-sm text-indigo-300/80">Allow this device to receive instant task alerts</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20"
          >
            {isSubscribing ? "Subscribing..." : "Enable on this device"}
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="reminder-time">Daily Reminder Time</Label>
          <Input
            id="reminder-time"
            name="reminderTime"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Set a time to receive daily task reminders</p>
        </div>

        <div className="space-y-2">
          <Label>Notification Types</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="due-date" name="notificationTypes" value="dueDate" defaultChecked />
              <Label htmlFor="due-date">Due Date Reminders</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="task-assigned" name="notificationTypes" value="taskAssigned" defaultChecked />
              <Label htmlFor="task-assigned">Task Assignments</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="task-completed"
                name="notificationTypes"
                value="taskCompleted"
                defaultChecked
              />
              <Label htmlFor="task-completed">Task Completions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="comments" name="notificationTypes" value="comments" defaultChecked />
              <Label htmlFor="comments">Comments</Label>
            </div>
          </div>
        </div>
      </div>

      {state.message && (
        <div className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>{state.message}</div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Notification Settings"}
      </Button>
    </form>
  )
}
