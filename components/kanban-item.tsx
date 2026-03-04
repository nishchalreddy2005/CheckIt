"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2, Clock, MapPin, Tag, Target, Users } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { Task } from "@/lib/types"

interface KanbanItemProps {
    task: Task
    isOverlay?: boolean
}

export function KanbanItem({ task, isOverlay }: KanbanItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging && !isOverlay ? 0.4 : 1,
        zIndex: isOverlay ? 999 : 1,
    }

    // Determine priority color
    const priorityColors = {
        high: "bg-red-500/20 text-red-300 border-red-500/30",
        medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    }
    const priorityColor = priorityColors[(task.priority || "medium") as keyof typeof priorityColors] || priorityColors.medium

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        glass-card p-4 rounded-xl cursor-grab active:cursor-grabbing border
        ${isOverlay
                    ? 'border-indigo-400 shadow-[0_10px_30px_rgba(99,102,241,0.3)] bg-slate-900/90 scale-105'
                    : 'border-white/10 shadow-lg hover:border-white/20 bg-black/40 hover:bg-black/60'}
        transition-colors backdrop-blur-md relative overflow-hidden group
      `}
        >
            {/* Decorative gradient strip based on completion */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`} />

            <div className="flex justify-between items-start mb-2 pl-2">
                <h4 className={`text-sm font-semibold text-white/90 line-clamp-2 ${task.completed ? 'opacity-60 line-through' : ''}`}>
                    {task.title}
                </h4>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!task.completed && (
                        <Link href={`/focus/${task.id}`} className="text-indigo-400 hover:text-indigo-300 transition-colors drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] z-10" onPointerDown={(e) => e.stopPropagation()}>
                            <Target className="h-4 w-4" />
                        </Link>
                    )}
                    {task.completed && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                </div>
            </div>

            {task.description && (
                <p className="text-xs text-white/50 line-clamp-2 mb-3 pl-2">
                    {task.description}
                </p>
            )}

            <div className="flex flex-wrap gap-2 mt-auto pl-2">
                {task.category && (
                    <span className="inline-flex items-center text-[10px] bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 mr-1 opacity-50" />
                        {task.category}
                    </span>
                )}
                <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-md border ${priorityColor}`}>
                    {(task.priority || "medium").charAt(0).toUpperCase() + (task.priority || "medium").slice(1)}
                </span>

                {task.sharedWith && task.sharedWith.length > 0 && (
                    <span title={`Shared with ${task.sharedWith.length} external space(s)`} className="inline-flex items-center text-[10px] bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3 mr-1 opacity-70" />
                        {task.sharedWith.length}
                    </span>
                )}

                <span className="inline-flex items-center text-[10px] bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-md ml-auto">
                    <Clock className="w-3 h-3 mr-1 opacity-50" />
                    {format(new Date(task.dueDate || new Date()), "MMM d")}
                </span>
            </div>
        </div>
    )
}
