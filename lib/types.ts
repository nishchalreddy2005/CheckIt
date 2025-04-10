export type Task = {
  id: string
  title: string
  description: string
  dueDate: string
  category: string
  completed: boolean
  priority: "low" | "medium" | "high"
  userId: string
  createdAt: number
}

export type User = {
  id: string
  email: string
  name: string
  createdAt: number
  bio?: string
  theme?: "light" | "dark" | "system"
  language?: string
  timezone?: string
  profilePicture?: string
  calendarBackground?: string
  updatedAt?: number
  password?: string // Hashed password
  twoFactorEnabled?: boolean
  twoFactorSecret?: string
  emailVerified?: boolean
  lastLogin?: number
  failedLoginAttempts?: number
  lockedUntil?: number
  isAdmin?: boolean // Added for admin functionality
  isSuperadmin?: boolean // Added for superadmin functionality
}

export type TaskStats = {
  completed: number
  total: number
  categories: Record<string, { completed: number; total: number }>
}

export type Session = {
  id: string
  userId: string
  createdAt: number
  expiresAt: number
  userAgent?: string
  ipAddress?: string
}
