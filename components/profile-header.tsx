import Link from "next/link"
import Image from "next/image"
import type { User } from "@/lib/types"
import { LogoutButton } from "@/components/logout-button"
import { LiveClock } from "@/components/live-clock"

export function ProfileHeader({ user }: { user: User }) {
  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=32&width=32`

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-lg">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center group">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] group-hover:text-indigo-300 transition-colors">CheckIt</h1>
        </Link>
        <div className="ml-4 text-sm text-white/60">Welcome, <span className="text-indigo-300 font-medium">{user.name}</span></div>
        <div className="ml-4 flex items-center">
          <Link href="/profile" className="block transform transition-transform hover:scale-105">
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
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
          <div className="hidden sm:block text-white/70">
            <LiveClock user={user} />
          </div>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white hover:underline transition-colors">
              Dashboard
            </Link>
            <Link href="/profile" className="text-sm font-medium text-white/70 hover:text-white hover:underline transition-colors">
              Profile
            </Link>
            <Link href="/settings" className="text-sm font-medium text-white/70 hover:text-white hover:underline transition-colors">
              Settings
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </div>
    </header>
  )
}
