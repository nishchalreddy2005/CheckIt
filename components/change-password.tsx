"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/app/actions/profile-actions"
import { useActionState } from "react"

// Initial state for form submission
const initialState = {
  message: "",
  success: false,
}

// Action wrapper for useActionState
const changePasswordAction = async (prevState, formData) => {
  const result = await changePassword(formData)
  return {
    message: result.message,
    success: result.success,
  }
}

export function ChangePassword() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Change Password</h3>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" name="newPassword" type="password" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>

        {state.message && (
          <div className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>{state.message}</div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </div>
  )
}
