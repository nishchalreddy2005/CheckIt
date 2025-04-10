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

export function NotificationsForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [reminderTime, setReminderTime] = useState("09:00")

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
