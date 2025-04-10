"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

export type TaskFilters = {
  searchTerm: string
  category: string
  priority: string
  status: string
  dateRange: {
    from?: Date
    to?: Date
  }
}

interface TaskSearchFilterProps {
  onSearch: (filters: TaskFilters) => void
  categories: string[]
}

export function TaskSearchFilter({ onSearch, categories }: TaskSearchFilterProps) {
  const [filters, setFilters] = useState<TaskFilters>({
    searchTerm: "",
    category: "",
    priority: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
    status: "",
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Update active filters list
  useEffect(() => {
    const active = []
    if (filters.category) active.push(`Category: ${filters.category}`)
    if (filters.priority) active.push(`Priority: ${filters.priority}`)
    if (filters.status) active.push(`Status: ${filters.status}`)
    if (filters.dateRange.from) active.push("Date range")
    setActiveFilters(active)
  }, [filters])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value
    setFilters((prev) => ({ ...prev, searchTerm: newSearchTerm }))
    // Apply search immediately when search term changes
    onSearch({
      ...filters,
      searchTerm: newSearchTerm,
    })
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }))
    // Apply filter immediately when category changes
    onSearch({
      ...filters,
      category: value,
    })
  }

  // Handle date range change
  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: range,
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      category: "",
      priority: "",
      dateRange: {
        from: undefined,
        to: undefined,
      },
      status: "",
    })
  }

  // Apply filters
  const applyFilters = () => {
    onSearch(filters)
  }

  // Remove a specific filter
  const removeFilter = (filter: string) => {
    if (filter.startsWith("Category:")) {
      setFilters((prev) => ({ ...prev, category: "" }))
    } else if (filter.startsWith("Priority:")) {
      setFilters((prev) => ({ ...prev, priority: "" }))
    } else if (filter.startsWith("Status:")) {
      setFilters((prev) => ({ ...prev, status: "" }))
    } else if (filter === "Date range") {
      setFilters((prev) => ({
        ...prev,
        dateRange: { from: undefined, to: undefined },
      }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>

        {/* Category Dropdown - Added directly to the main interface */}
        <div className="w-full sm:w-48">
          <Select value={filters.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={applyFilters}>Search</Button>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              {filter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter(filter)} />
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
