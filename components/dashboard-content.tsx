"use client"

import { useState, useEffect } from "react"
import { TaskList } from "@/components/task-list"
import { TaskSearchFilter } from "@/components/task-search-filter"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Task } from "@/lib/types"

interface DashboardContentProps {
  tasks: Task[]
  userId?: string
  categories: string[]
}

export function DashboardContent({ tasks: initialTasks, userId, categories }: DashboardContentProps) {
  const router = useRouter()
  const [filter, setFilter] = useState("all")
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: "",
    category: "",
    priority: "",
    status: "",
    dateRange: { from: "", to: "" },
  })
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks)
  const [refreshKey, setRefreshKey] = useState(0)

  // Apply search filters to tasks
  useEffect(() => {
    let filtered = [...initialTasks]

    // Filter by search term
    if (searchFilters.searchTerm) {
      const searchLower = searchFilters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) || task.description.toLowerCase().includes(searchLower),
      )
    }

    // Filter by category
    if (searchFilters.category) {
      filtered = filtered.filter((task) => task.category === searchFilters.category)
    }

    // Filter by priority
    if (searchFilters.priority) {
      filtered = filtered.filter((task) => task.priority === searchFilters.priority)
    }

    // Filter by status
    if (searchFilters.status) {
      if (searchFilters.status === "completed") {
        filtered = filtered.filter((task) => task.completed)
      } else if (searchFilters.status === "pending") {
        filtered = filtered.filter((task) => !task.completed)
      }
    }

    // Filter by date range
    if (searchFilters.dateRange.from) {
      const fromDate = new Date(searchFilters.dateRange.from)
      fromDate.setHours(0, 0, 0, 0)

      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.dueDate)
        return taskDate >= fromDate
      })

      if (searchFilters.dateRange.to) {
        const toDate = new Date(searchFilters.dateRange.to)
        toDate.setHours(23, 59, 59, 999)

        filtered = filtered.filter((task) => {
          const taskDate = new Date(task.dueDate)
          return taskDate <= toDate
        })
      }
    }

    setFilteredTasks(filtered)
  }, [initialTasks, searchFilters, refreshKey])

  // Add this after the existing useEffect for filtering tasks
  useEffect(() => {
    // Set up an interval to refresh the tasks every 5 seconds
    const refreshInterval = setInterval(() => {
      router.refresh()
    }, 5000)

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval)
  }, [router])

  // Handle search and filtering
  const handleSearch = (filters) => {
    setSearchFilters(filters)
  }

  // Force refresh
  const handleRefresh = () => {
    router.refresh()
    // Also do a hard refresh
    window.location.href = window.location.href
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="text-sm h-9"
          >
            All Tasks
          </Button>
          <Button
            variant={filter === "today" ? "default" : "outline"}
            onClick={() => setFilter("today")}
            className="text-sm h-9"
          >
            Today
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
            className="text-sm h-9"
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className="text-sm h-9"
          >
            Completed
          </Button>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <TaskSearchFilter onSearch={handleSearch} categories={categories} />

      <TaskList initialTasks={filteredTasks} filter={filter} userId={userId} searchFilters={searchFilters} />
    </div>
  )
}
