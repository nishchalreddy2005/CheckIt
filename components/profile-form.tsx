"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
const updateProfileAction = async (prevState: any, formData: FormData) => {
  const result = await updateProfile(formData)
  return {
    message: result.message,
    success: result.success,
    user: result.user || null,
  }
}

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white/80">Full Name</Label>
        <Input id="name" name="name" defaultValue={user.name} required className="glass-input" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/80">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={user.email} required readOnly className="glass-input opacity-70 cursor-not-allowed" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-white/80">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={user.bio || ""} placeholder="Tell us about yourself" className="glass-input resize-none min-h-[100px]" />
      </div>

      {state.message && (
        <div className={`text-sm p-3 rounded-lg backdrop-blur-md border ${state.success ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-pink-300 bg-pink-500/10 border-pink-500/20"}`}>{state.message}</div>
      )}

      <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none w-full sm:w-auto">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
