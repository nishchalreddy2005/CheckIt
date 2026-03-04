"use client"

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanItem } from "@/components/kanban-item"
import type { Task } from "@/lib/types"

interface KanbanColumnProps {
    id: string
    title: string
    tasks: Task[]
}

export function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-[#030014]/40 h-full min-h-[500px]">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white/90 drop-shadow-md">{title}</h3>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full border border-indigo-500/20">
                    {tasks.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-4 flex flex-col gap-3 transition-colors ${isOver ? 'bg-indigo-500/5' : ''}`}
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <KanbanItem key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-full flex items-center justify-center text-white/30 text-sm border-2 border-dashed border-white/10 rounded-xl m-2">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    )
}
