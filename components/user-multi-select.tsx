"use client"

import React, { useState, useEffect, useRef } from "react"
import { searchUsers } from "@/app/actions/user-actions"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, X } from "lucide-react"

interface UserMultiSelectProps {
    value: string // Comma separated string of usernames
    onChange: (value: string) => void
    placeholder?: string
}

export function UserMultiSelect({ value, onChange, placeholder }: UserMultiSelectProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<{ id: string, username: string, name: string, email: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Parse current usernames
    const currentUsernames = value
        ? value.split(",").map(e => e.trim()).filter(Boolean)
        : []

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchUsers = async () => {
            if (!query.trim()) {
                setResults([])
                return
            }

            setIsLoading(true)
            try {
                const users = await searchUsers(query)
                setResults(users)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }

        const timer = setTimeout(() => {
            fetchUsers()
        }, 300)

        return () => clearTimeout(timer)
    }, [query]) // Only trigger fetch on keystroke

    const handleAddString = (username: string) => {
        const newUsernames = [...currentUsernames, username]
        onChange(newUsernames.join(", "))
        setQuery("")
        setIsOpen(false)
    }

    const handleRemove = (usernameToRemove: string) => {
        const newUsernames = currentUsernames.filter(e => e !== usernameToRemove)
        onChange(newUsernames.join(", "))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && query.trim()) {
            e.preventDefault()
            handleAddString(query.trim())
        }
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="flex flex-wrap gap-2 mb-2">
                {currentUsernames.map((username) => (
                    <Badge key={username} variant="secondary" className="flex items-center gap-1 bg-indigo-500/20 text-indigo-200 border-indigo-500/30">
                        {username}
                        <button
                            onClick={() => handleRemove(username)}
                            className="hover:bg-indigo-500/30 rounded-full p-0.5"
                            type="button"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            <Input
                type="text"
                placeholder={placeholder || "Search by username or name..."}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                className="glass-input"
                onKeyDown={handleKeyDown}
            />

            {isOpen && (query.trim() || isLoading) && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1635] text-white border border-indigo-500/30 rounded-md shadow-xl overflow-hidden backdrop-blur-md">
                    {isLoading ? (
                        <div className="p-3 flex items-center gap-2 text-sm text-indigo-300">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                        </div>
                    ) : results.filter(u => !currentUsernames.includes(u.username)).length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto python">
                            {results.filter(u => !currentUsernames.includes(u.username)).map((user) => (
                                <li
                                    key={user.id}
                                    onClick={() => handleAddString(user.username)}
                                    className="px-3 py-2 cursor-pointer hover:bg-indigo-500/20 border-b border-indigo-500/10 last:border-0 flex flex-col"
                                >
                                    <span className="font-medium text-sm text-indigo-100">{user.name} <span className="text-indigo-400 font-normal">{user.username}</span></span>
                                    <span className="text-xs text-indigo-300/70">{user.email}</span>
                                </li>
                            ))}
                        </ul>
                    ) : query.trim() ? (
                        <div
                            className="p-3 cursor-pointer hover:bg-indigo-500/20 text-sm text-indigo-200"
                            onClick={() => handleAddString(query.trim())}
                        >
                            Invite username: {query}
                        </div>
                    ) : (
                        <div className="p-3 text-sm text-indigo-300/60">No users found.</div>
                    )}
                </div>
            )}
        </div>
    )
}
