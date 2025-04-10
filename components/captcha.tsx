"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface CaptchaProps {
  onGenerate: (value: string) => void
}

export function Captcha({ onGenerate }: CaptchaProps) {
  const [captchaText, setCaptchaText] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate a random captcha text
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    onGenerate(result) // Pass the generated text back to parent
    return result
  }

  // Draw the captcha on canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill background
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add noise (dots)
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Add lines for more noise
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.5)`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // Draw captcha text
    ctx.font = "bold 24px Arial"
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw each character with slight rotation for added security
    const chars = text.split("")
    const charWidth = canvas.width / (chars.length + 1)

    chars.forEach((char, i) => {
      const x = (i + 1) * charWidth
      const y = canvas.height / 2 + (Math.random() * 6 - 3)
      const rotation = Math.random() * 0.4 - 0.2 // Random rotation between -0.2 and 0.2 radians

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillText(char, 0, 0)
      ctx.restore()
    })
  }

  // Refresh captcha
  const refreshCaptcha = () => {
    const newCaptcha = generateCaptcha()
    setTimeout(() => drawCaptcha(newCaptcha), 50)
  }

  // Initialize captcha on component mount
  useEffect(() => {
    refreshCaptcha()
  }, [])

  // Redraw captcha when text changes
  useEffect(() => {
    if (captchaText) {
      drawCaptcha(captchaText)
    }
  }, [captchaText])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <canvas
          ref={canvasRef}
          width={180}
          height={60}
          className="border border-gray-300 rounded-md"
          aria-label="CAPTCHA image"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={refreshCaptcha}
          aria-label="Refresh CAPTCHA"
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Enter the characters you see above</p>
    </div>
  )
}
