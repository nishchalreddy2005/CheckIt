import Link from "next/link"
import Image from "next/image"
import type { User } from "@/lib/types"
import { LogoutButton } from "@/components/logout-button"
import { LiveClock } from "@/components/live-clock"

export function ProfileHeader({ user }: { user: User }) {
  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=32&width=32`

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">CheckIt</h1>
        </Link>
        <div className="ml-4 text-sm text-muted-foreground">Welcome, {user.name}</div>
        <div className="ml-4 flex items-center">
          <Link href="/profile" className="block">
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-background shadow">
              <Image
                src={profilePic || "/placeholder.svg"}
                alt={`${user.name}'s profile picture`}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          <LiveClock user={user} />
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
            <Link href="/profile" className="text-sm font-medium hover:underline">
              Profile
            </Link>
            <Link href="/settings" className="text-sm font-medium hover:underline">
              Settings
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </div>
    </header>
  )
}
