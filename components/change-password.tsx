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
const changePasswordAction = async (prevState: any, formData: FormData) => {
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
      <h3 className="text-lg font-medium text-white/90">Change Password</h3>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
          <Input id="newPassword" name="newPassword" type="password" required className="glass-input" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white/80">Confirm New Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required className="glass-input" />
        </div>

        {state.message && (
          <div className={`text-sm p-3 rounded-lg backdrop-blur-md border ${state.success ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-pink-300 bg-pink-500/10 border-pink-500/20"}`}>{state.message}</div>
        )}

        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none w-full sm:w-auto mt-2">
          {isPending ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </div>
  )
}
