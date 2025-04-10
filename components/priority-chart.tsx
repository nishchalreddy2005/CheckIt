"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { Task } from "@/lib/types"

// Register Chart.js components
Chart.register(...registerables)

interface PriorityChartProps {
  tasks: Task[]
}

export function PriorityChart({ tasks }: PriorityChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Calculate priorities from tasks
    const priorities = {
      high: 0,
      medium: 0,
      low: 0,
    }

    // Safely count tasks by priority
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach((task) => {
        if (task.priority === "high") priorities.high++
        else if (task.priority === "medium") priorities.medium++
        else if (task.priority === "low") priorities.low++
      })
    }

    // Create new chart
    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["High", "Medium", "Low"],
        datasets: [
          {
            data: [priorities.high, priorities.medium, priorities.low],
            backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
            borderColor: ["#fef2f2", "#fffbeb", "#ecfdf5"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw as number
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
        cutout: "70%",
      },
    })

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [tasks])

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  )
}
