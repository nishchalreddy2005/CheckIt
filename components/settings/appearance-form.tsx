"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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

export function AppearanceForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)
  const [fontSize, setFontSize] = useState(16)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size">Font Size ({fontSize}px)</Label>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={24}
            step={1}
            defaultValue={[fontSize]}
            onValueChange={(value) => setFontSize(value[0])}
            className="w-full"
          />
          <input type="hidden" name="fontSize" value={fontSize} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion">Reduced Motion</Label>
          <Switch id="reduced-motion" name="reducedMotion" checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast">High Contrast</Label>
          <Switch id="high-contrast" name="highContrast" checked={highContrast} onCheckedChange={setHighContrast} />
        </div>
      </div>

      {state.message && (
        <div className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>{state.message}</div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  )
}
