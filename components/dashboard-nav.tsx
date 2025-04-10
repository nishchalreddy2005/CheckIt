"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, User, Settings, Calendar, BarChart4, HelpCircle } from "lucide-react"

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
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart4,
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
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn("w-full justify-start", pathname === item.href ? "bg-muted font-medium" : "font-normal")}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          </a>
        </Link>
      ))}
    </nav>
  )
}
