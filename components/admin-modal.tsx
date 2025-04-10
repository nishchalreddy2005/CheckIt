"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAdmin } from "@/app/actions/admin-actions"
import { toast } from "@/components/ui/use-toast"

export function AdminModal() {
  const [open, setOpen] = useState(false)
  const [secretCode, setSecretCode] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Pass the secretCode along with other data
      const result = await registerAdmin({
        name,
        email,
        password,
        secretCode,
      })

      if (result.success) {
        toast({
          title: "Registration Pending",
          description: "Your admin registration has been submitted and is awaiting approval by the superadmin.",
          duration: 5000, // 5 seconds
        })
        setOpen(false)
        setSecretCode("")
        setName("")
        setEmail("")
        setPassword("")
      } else {
        setError(result.error || "Failed to register admin")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center" aria-label="Admin Registration">
        <img
          src="/images/admin-icon.png"
          alt="Admin"
          className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Registration</DialogTitle>
            <DialogDescription>Enter the secret code and your details to register as an admin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="secretCode">Secret Code</Label>
              <Input
                id="secretCode"
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Registering..." : "Register as Admin"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
