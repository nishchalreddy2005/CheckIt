"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TaskStats } from "@/lib/types"

interface BarChartProps {
  stats: TaskStats
  title?: string
  description?: string
}

export function BarChart({
  stats,
  title = "Task Statistics",
  description = "Visualization of your tasks",
}: BarChartProps) {
  const [view, setView] = useState<"categories" | "completion">("categories")

  // Calculate the maximum value for scaling
  const categoryMax = Math.max(
    ...Object.values(stats.categories).map((cat) => cat.total),
    1, // Ensure we don't divide by zero
  )

  const completionData = [
    { label: "Completed", value: stats.completed, color: "bg-green-500" },
    { label: "Pending", value: stats.total - stats.completed, color: "bg-amber-500" },
  ]

  const completionMax = stats.total || 1 // Ensure we don't divide by zero

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Tabs defaultValue="categories" className="mt-2" onValueChange={(value) => setView(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {view === "categories" ? (
          <div className="space-y-4">
            {Object.entries(stats.categories).length > 0 ? (
              Object.entries(stats.categories).map(([category, data]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{category}</span>
                    <span className="text-muted-foreground">
                      {data.completed}/{data.total} ({Math.round((data.completed / data.total) * 100) || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(data.total / categoryMax) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${(data.completed / categoryMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">No categories available</div>
            )}
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {completionData.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.value} ({Math.round((item.value / completionMax) * 100)}%)
                  </span>
                </div>
                <div className="h-4 w-full rounded-sm bg-gray-100">
                  <div
                    className={`h-full rounded-sm ${item.color}`}
                    style={{ width: `${(item.value / completionMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4">
              <div className="text-sm font-medium">Overall Completion</div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(stats.completed / completionMax) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground text-right">
                {Math.round((stats.completed / stats.total) * 100) || 0}% Complete
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
