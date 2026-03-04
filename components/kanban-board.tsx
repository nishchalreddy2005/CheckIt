"use client"

import React, { useState, useEffect } from "react"
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanColumn } from "@/components/kanban-column"
import { KanbanItem } from "@/components/kanban-item"
import { toggleTaskCompletion } from "@/app/actions/task-actions"
import type { Task } from "@/lib/types"

interface KanbanBoardProps {
    tasks: Task[]
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
    const [columns, setColumns] = useState({
        pending: [] as Task[],
        completed: [] as Task[]
    })

    const [activeId, setActiveId] = useState<string | null>(null)

    useEffect(() => {
        setColumns({
            pending: tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()),
            completed: tasks.filter(t => t.completed).sort((a, b) => new Date(b.createdAt || b.dueDate || 0).getTime() - new Date(a.createdAt || a.dueDate || 0).getTime()),
        })
    }, [tasks])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    )

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragOver = (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const activeContainer = findContainer(activeId)
        const overContainer = findContainer(overId)

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return
        }

        setColumns((prev) => {
            const activeItems = prev[activeContainer as keyof typeof prev]
            const overItems = prev[overContainer as keyof typeof prev]

            const activeIndex = activeItems.findIndex(t => t.id === activeId)
            const overIndex = overItems.findIndex(t => t.id === overId)

            let newIndex
            if (overId in prev) {
                newIndex = overItems.length + 1
            } else {
                const isBelowOverItem =
                    over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
            }

            return {
                ...prev,
                [activeContainer]: [...prev[activeContainer as keyof typeof prev].filter(item => item.id !== activeId)],
                [overContainer]: [
                    ...prev[overContainer as keyof typeof prev].slice(0, newIndex),
                    prev[activeContainer as keyof typeof prev][activeIndex],
                    ...prev[overContainer as keyof typeof prev].slice(newIndex, prev[overContainer as keyof typeof prev].length)
                ]
            }
        })
    }

    const handleDragEnd = async (event: any) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Determine the source and destination containers based on state
        // We already handled cross-container drops in handleDragOver, 
        // now we just reorder within the final container and fire the API if the status changed.

        const originalContainer = tasks.find(t => t.id === activeId)?.completed ? 'completed' : 'pending'
        const finalContainer = findContainer(activeId) // because state was mutated in handleDragOver

        if (finalContainer && activeId !== overId) {
            // Intracolumn sort
            setColumns(prev => {
                const items = prev[finalContainer as keyof typeof prev]
                const oldIndex = items.findIndex(t => t.id === activeId)
                const newIndex = items.findIndex(t => t.id === overId)

                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    return {
                        ...prev,
                        [finalContainer]: arrayMove(items, oldIndex, newIndex)
                    }
                }
                return prev
            })
        }

        // Did the item cross boundaries permanently?
        if (finalContainer && finalContainer !== originalContainer) {
            // Toggle the Task API!
            const fd = new FormData()
            fd.append("id", activeId)
            await toggleTaskCompletion(fd)
        }
    }

    const findContainer = (id: string) => {
        if (id === 'pending' || id === 'completed') return id
        if (columns.pending.find(t => t.id === id)) return 'pending'
        if (columns.completed.find(t => t.id === id)) return 'completed'
        return null
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

    return (
        <div className="flex gap-6 w-full h-full min-h-[500px]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <KanbanColumn id="pending" title="To Do" tasks={columns.pending} />
                <KanbanColumn id="completed" title="Done" tasks={columns.completed} />

                <DragOverlay>
                    {activeTask ? <KanbanItem task={activeTask} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
