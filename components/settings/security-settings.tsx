"use client"

import { Separator } from "@/components/ui/separator"
import { ChangePassword } from "@/components/change-password"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import type { User } from "@/lib/types"

export function SecuritySettings({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <ChangePassword />

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <TwoFactorSetup user={user} />
      </div>
    </div>
  )
}
