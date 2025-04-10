"use client"

import { useEffect, useState } from "react"

type ToastProps = {
  title?: string
  description?: string
  duration?: number
  variant?: "default" | "destructive"
}

// Store for active toasts
let toasts: ToastProps[] = []
let listeners: Function[] = []

// Function to notify all listeners
const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toasts]))
}

export function toast(props: ToastProps) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { ...props, id }

  // Add toast to the array
  toasts = [...toasts, newToast]
  notifyListeners()

  // Remove toast after duration
  if (props.duration) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== newToast.id)
      notifyListeners()
    }, props.duration)
  }

  return {
    id,
    dismiss: () => {
      toasts = toasts.filter((t) => t.id !== newToast.id)
      notifyListeners()
    },
  }
}

// Hook to subscribe to toast updates
export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    const updateToasts = (newToasts: ToastProps[]) => {
      setCurrentToasts(newToasts)
    }

    listeners.push(updateToasts)
    updateToasts(toasts)

    return () => {
      listeners = listeners.filter((l) => l !== updateToasts)
    }
  }, [])

  return {
    toasts: currentToasts,
    toast,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id)
      notifyListeners()
    },
  }
}
