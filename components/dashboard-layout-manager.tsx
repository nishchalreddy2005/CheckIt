"use client"

import React, { useState, useEffect } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { updateUserPreferences } from "@/app/actions/user-actions"

interface SortableItemProps {
    id: string
    children: React.ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : "auto",
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div
                {...attributes}
                {...listeners}
                className="absolute left-[-30px] top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="h-5 w-5 text-indigo-400" />
            </div>
            {children}
        </div>
    )
}

interface DashboardLayoutManagerProps {
    initialLayout?: string[]
    childrenMap: Record<string, React.ReactNode>
}

export function DashboardLayoutManager({ initialLayout, childrenMap }: DashboardLayoutManagerProps) {
    const [items, setItems] = useState<string[]>(initialLayout || Object.keys(childrenMap))
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        if (initialLayout && initialLayout.length > 0) {
            setItems(initialLayout)
        }
    }, [initialLayout])

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string)
                const newIndex = items.indexOf(over?.id as string)
                const newItems = arrayMove(items, oldIndex, newIndex)

                // Save preferences
                updateUserPreferences({ dashboardLayout: newItems })

                return newItems
            })
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="space-y-8 pl-8">
                    {items.map((id) => (
                        <SortableItem key={id} id={id}>
                            {childrenMap[id]}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
