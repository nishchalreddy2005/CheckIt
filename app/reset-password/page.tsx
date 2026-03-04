"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/app/actions/password-actions"
import { ArrowLeft, Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token") || ""

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters")
            return
        }
        if (password !== confirmPassword) {
            setMessage("Passwords do not match")
            return
        }

        setIsSubmitting(true)
        setMessage("")

        const formData = new FormData()
        formData.append("token", token)
        formData.append("password", password)
        formData.append("confirmPassword", confirmPassword)

        const result = await resetPassword(formData)
        setMessage(result.message)
        setIsSuccess(result.success)
        setIsSubmitting(false)

        if (result.success) {
            setTimeout(() => router.push("/login"), 3000)
        }
    }

    if (!token) {
        return (
            <div className="glass-card p-8 rounded-2xl border border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8 text-pink-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Invalid Reset Link</h1>
                <p className="text-sm text-white/50">
                    This password reset link is missing or invalid. Please request a new one.
                </p>
                <Link href="/forgot-password">
                    <Button className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white">
                        Request New Link
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-indigo-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Set New Password</h1>
                <p className="text-sm text-white/50">
                    Enter your new password below.
                </p>
            </div>

            {isSuccess ? (
                <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-sm text-emerald-300">{message}</p>
                    <p className="text-xs text-white/40">Redirecting to login...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/80">
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="glass-input pr-10"
                                required
                                disabled={isSubmitting}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white/80">
                            Confirm Password
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            className="glass-input"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {message && !isSuccess && (
                        <div className="text-sm text-pink-300 bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
                            {message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting || !password || !confirmPassword}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>
            )}
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#030014] flex items-center justify-center px-4">
            {/* Background effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -top-40 -left-40" />
                <div className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] bottom-20 right-20" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <Suspense fallback={
                    <div className="glass-card p-8 rounded-2xl border border-white/10 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
