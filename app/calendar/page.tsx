"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { EnhancedCalendar } from "@/components/enhanced-calendar"
import { TaskDetailModal } from "@/components/task-detail-modal"
import { TaskFormModal } from "@/components/task-form-modal"
import type { Task } from "@/lib/types"
import { getTasks } from "@/app/actions/task-actions"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, RefreshCw, CalendarIcon, List, Settings } from "lucide-react"
// Add the import for getProfile
import { getProfile } from "@/app/actions/profile-actions"
import { TaskSearchFilter } from "@/components/task-search-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedTaskCard } from "@/components/enhanced-task-card"
import { useToast } from "@/components/ui/use-toast"
// Add this import at the top of the file with the other imports
import { VoiceAssistantHelp } from "@/components/voice-assistant-help"

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(undefined)
  const [newTaskHour, setNewTaskHour] = useState<number | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined)
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [categories, setCategories] = useState<string[]>([])
  const [userId, setUserId] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  // Add a function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const profileResult = await getProfile()
      if (profileResult.success && profileResult.user) {
        setBackgroundImage(profileResult.user.calendarBackground || undefined)
        setUserId(profileResult.user.id)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  // Function to fetch tasks with better error handling
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching tasks...")
      const fetchedTasks = await getTasks()

      console.log("Tasks fetched:", fetchedTasks)

      if (Array.isArray(fetchedTasks)) {
        console.log(`Successfully fetched ${fetchedTasks.length} tasks`)
        setTasks(fetchedTasks)
        setFilteredTasks(fetchedTasks)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(fetchedTasks.map((task) => task.category).filter(Boolean))) as string[]
        setCategories(uniqueCategories)
      } else {
        console.error("Fetched tasks is not an array:", fetchedTasks)
        setTasks([])
        setFilteredTasks([])
        setError("Failed to load tasks. Please try again later.")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("An error occurred while loading tasks.")
      setTasks([])
      setFilteredTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch tasks on initial load and when refreshKey changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchUserProfile()
        await fetchTasks()
      } catch (error) {
        console.error("Error in fetchData:", error)
      }
    }

    fetchData()
  }, [refreshKey, fetchTasks])

  // Add a manual refresh function
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  const handleAddTask = (date: Date, hour: number) => {
    setNewTaskDate(date)
    setNewTaskHour(hour)
    setSelectedTask(null) // Reset selected task to ensure we're creating a new task
    setIsFormModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(false)
    setIsFormModalOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const formData = new FormData()
      formData.append("id", taskId)

      // Import dynamically to avoid issues
      const { deleteTask } = await import("@/app/actions/task-actions")
      await deleteTask(formData)

      setTasks(tasks.filter((task) => task.id !== taskId))
      setFilteredTasks(filteredTasks.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleToggleCompletion = async (taskId: string, showCelebration = false) => {
    try {
      const formData = new FormData()
      formData.append("id", taskId)

      // Import dynamically to avoid issues
      const { toggleTaskCompletion } = await import("@/app/actions/task-actions")
      await toggleTaskCompletion(formData)

      // Find the task to check if it's being completed (vs. uncompleted)
      const task = tasks.find((t) => t.id === taskId)
      const isCompleting = task ? !task.completed : false

      // Update the tasks state
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
      setFilteredTasks(
        filteredTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
      )

      // Show celebration if completing the task and showCelebration is true
      if (isCompleting && showCelebration) {
        // Show a success toast
        toast({
          title: "Congratulations! 🎉",
          description: "You've successfully completed the task!",
          variant: "default",
        })

        // Confetti animation
        const launchConfetti = async () => {
          try {
            const confetti = (await import("canvas-confetti")).default

            // Initial burst - center
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
              disableForReducedMotion: true,
            })

            // Left side burst after a short delay
            setTimeout(() => {
              confetti({
                particleCount: 40,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.5 },
                colors: ["#ff0000", "#ffa500", "#ffff00", "#00ff00", "#0000ff"],
                disableForReducedMotion: true,
              })
            }, 250)

            // Right side burst after another short delay
            setTimeout(() => {
              confetti({
                particleCount: 40,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.5 },
                colors: ["#ff69b4", "#00ffff", "#ff1493", "#ffd700", "#ff6347"],
                disableForReducedMotion: true,
              })
            }, 500)

            // Final center burst for grand finale
            setTimeout(() => {
              confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.5 },
                colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
                disableForReducedMotion: true,
              })
            }, 800)
          } catch (error) {
            console.error("Error launching confetti:", error)
          }
        }

        // Launch confetti
        launchConfetti()
      }
    } catch (error) {
      console.error("Failed to toggle task completion:", error)
    }
  }

  // Handle form modal close with refresh
  const handleFormModalClose = (shouldRefresh = false) => {
    setIsFormModalOpen(false)
    if (shouldRefresh) {
      handleRefresh()
    }
  }

  // Handle search and filtering
  const handleSearch = (filters: any) => {
    let filtered = [...tasks]

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) || (task.description || "").toLowerCase().includes(searchLower),
      )
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter((task) => task.category === filters.category)
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority)
    }

    // Filter by status
    if (filters.status) {
      if (filters.status === "completed") {
        filtered = filtered.filter((task) => task.completed)
      } else if (filters.status === "pending") {
        filtered = filtered.filter((task) => !task.completed)
      }
    }

    // Filter by date range
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from)
      fromDate.setHours(0, 0, 0, 0)

      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate >= fromDate
      })

      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to)
        toDate.setHours(23, 59, 59, 999)

        filtered = filtered.filter((task) => {
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate)
          return taskDate <= toDate
        })
      }
    }

    setFilteredTasks(filtered)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Calendar</h1>
        </div>

        <div className="flex items-center justify-between">
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              onClick={() => {
                if (userId) window.open(`/api/calendar/${userId}`, "_blank")
              }}
              variant="outline"
              className="flex items-center gap-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
            >
              <CalendarIcon size={16} />
              <span className="hidden sm:inline">Export .ics</span>
            </Button>

            <Button
              onClick={() => {
                // First reset all states
                setSelectedTask(null)
                setNewTaskDate(new Date())
                setNewTaskHour(new Date().getHours())
                // Then open the modal with a slight delay to ensure state is updated
                setTimeout(() => {
                  setIsFormModalOpen(true)
                }, 10)
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Task</span>
            </Button>

            <VoiceAssistantHelp />

            <Button variant="outline" size="icon" onClick={() => router.push("/settings")} aria-label="Settings">
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Task search and filter */}
      <div className="mb-6">
        <TaskSearchFilter onSearch={handleSearch} categories={categories} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[800px] bg-gray-50 rounded-xl">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-white rounded-xl border shadow">
          <div className="text-red-500 mb-4">{error}</div>
          <div className="flex justify-center gap-4">
            <Button onClick={handleRefresh} variant="outline">
              Refresh
            </Button>
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
          </div>
        </div>
      ) : (
        <div>
          {filteredTasks.length === 0 ? (
            <div className="text-center p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p>No tasks found. Create a new task or adjust your filters.</p>
            </div>
          ) : (
            <div className="text-right mb-2">
              <span className="text-sm text-gray-500">
                Showing {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                {filteredTasks.length !== tasks.length && ` (filtered from ${tasks.length})`}
              </span>
            </div>
          )}

          <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
            <TabsList className="mb-4">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <EnhancedCalendar
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
                backgroundImage={backgroundImage}
              />
            </TabsContent>

            <TabsContent value="list">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No tasks found</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <EnhancedTaskCard
                          key={task.id}
                          task={task}
                          onToggleCompletion={handleToggleCompletion}
                          onDelete={handleDeleteTask}
                          onEdit={handleEditTask}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onComplete={(taskId, completed) => handleToggleCompletion(taskId)}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        open={isFormModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleFormModalClose(true) // Refresh when closing the form
          } else {
            setIsFormModalOpen(open)
          }
        }}
        initialDate={newTaskDate}
        initialHour={newTaskHour}
        taskToEdit={isFormModalOpen && selectedTask ? selectedTask : null}
      />
    </div>
  )
}
