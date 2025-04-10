import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { GeminiVoiceAssistant } from "@/components/gemini-voice-assistant"
// Import the ClientNavigation component
import { ClientNavigation } from "@/components/client-navigation"

// Configure the Inter font with proper subsets
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  // No need to specify font files as Next.js handles this
})

export const metadata = {
  title: "TaskSphere",
  description: "A modern task management application",
    generator: 'v0.dev'
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
        <GeminiVoiceAssistant />
      </body>
    </html>
  )
}


import './globals.css'