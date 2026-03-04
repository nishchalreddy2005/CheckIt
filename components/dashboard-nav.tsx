"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, User, Settings, HelpCircle } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 px-2 py-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} passHref legacyBehavior>
          <a className="w-full">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start transition-all hover:bg-white/10 hover:text-white",
                pathname === item.href
                  ? "bg-indigo-500/20 text-indigo-300 font-medium shadow-[0_0_10px_rgba(99,102,241,0.2)] border border-indigo-500/20"
                  : "text-white/70 font-normal border border-transparent"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.title}
            </Button>
          </a>
        </Link>
      ))}
    </nav>
  )
}
