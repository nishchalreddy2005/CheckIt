import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { VoiceAssistant } from "@/components/voice-assistant"
// Import the ClientNavigation component
import { ClientNavigation } from "@/components/client-navigation"

// Configure the Inter font with proper subsets
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  // No need to specify font files as Next.js handles this
})

export const metadata = {
  title: "CheckIt",
  description: "A modern task management application",
  generator: 'v0.dev',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add it to the layout component, right before the {children}
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientNavigation />
        {children}
        <VoiceAssistant />
      </body>
    </html>
  )
}


import './globals.css'