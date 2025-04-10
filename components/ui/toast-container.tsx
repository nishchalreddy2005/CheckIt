"use client"

import { useToast } from "./use-toast"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast"

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant}>
          <div className="grid gap-1">
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          </div>
          <ToastClose onClick={() => dismiss(toast.id)} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
