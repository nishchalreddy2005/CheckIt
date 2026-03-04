"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/app/actions/password-actions"
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsSubmitting(true)
        setMessage("")

        const formData = new FormData()
        formData.append("email", email)

        const result = await requestPasswordReset(formData)
        setMessage(result.message)
        setIsSuccess(result.success)
        setIsSubmitting(false)
    }

    return (
        <div className="min-h-screen bg-[#030014] flex items-center justify-center px-4">
            {/* Background effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -top-40 -left-40" />
                <div className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] bottom-20 right-20" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Back link */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <div className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                        <p className="text-sm text-white/50">
                            No worries! Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    {isSuccess ? (
                        /* Success state */
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <p className="text-sm text-emerald-300">{message}</p>
                            <p className="text-xs text-white/40">
                                Check your inbox (and spam folder) for the reset link.
                            </p>
                            <Link href="/login">
                                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white">
                                    Return to Login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        /* Form state */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white/80">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
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
                                disabled={isSubmitting || !email.trim()}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending Reset Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
