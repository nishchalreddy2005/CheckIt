"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { getTasks, createTask, deleteTask, toggleTaskCompletion } from "@/app/actions/task-actions"
import { useToast } from "@/components/ui/use-toast"
import { format, addDays, isValid } from "date-fns"
import { useRouter } from "next/navigation"

// Conversation states for the voice assistant
type ConversationState =
  | "idle"
  | "collecting_task_title"
  | "collecting_task_priority"
  | "collecting_task_category"
  | "collecting_task_due_date"
  | "collecting_task_description"
  | "confirming_task"

// Task creation data structure
interface TaskCreationData {
  title: string
  priority: string
  category: string
  dueDate: Date
  description: string
}

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState>("idle")
  const [taskData, setTaskData] = useState<TaskCreationData>({
    title: "",
    priority: "medium",
    category: "Work",
    dueDate: new Date(),
    description: "",
  })
  // Set requireWakeWord to false by default
  const [requireWakeWord, setRequireWakeWord] = useState(false)
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(false)

  // Initialize speech recognition
  useEffect(() => {
    let SpeechRecognition: any = null
    if (typeof window !== "undefined") {
      // @ts-ignore - SpeechRecognition is not in the TypeScript types yet
      SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechRecognitionAvailable(true)
      } else {
        toast({
          title: "Voice Assistant Not Available",
          description: "Speech recognition is not supported in your browser.",
          variant: "destructive",
        })
      }
    }

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
        setTranscript(transcript)
        console.log("Heard:", transcript) // Debug log

        // Process the transcript based on the current conversation state
        if (conversationState === "idle") {
          // In idle state, process command directly (no wake word required)
          processCommand(transcript)
        } else {
          // In a conversation flow, process the response based on the current state
          processConversationResponse(transcript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        if (event.error === "no-speech") {
          // Restart listening if no speech was detected
          if (isListening) {
            recognitionRef.current.stop()
            setTimeout(() => {
              if (isListening) recognitionRef.current.start()
            }, 100)
          }
        } else {
          toast({
            title: "Voice Assistant Error",
            description: `Error: ${event.error}. Please try again.`,
            variant: "destructive",
          })
          setIsListening(false)
        }
      }

      recognitionRef.current.onend = () => {
        // Restart if still in listening mode
        if (isListening && recognitionRef.current) {
          recognitionRef.current.start()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening, toast, conversationState, requireWakeWord])

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      // Reset conversation state when stopping listening
      setConversationState("idle")
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start()
        speak("Voice assistant activated. What would you like to do?")

        toast({
          title: "Voice Assistant Activated",
          description: "Speak your command directly.",
          variant: "default",
        })
      }
      setIsListening(true)
    }
  }

  // Speak text using speech synthesis
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      console.log("Speaking:", text) // Debug log
      setIsSpeaking(true)

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set voice properties for better clarity
      utterance.rate = 1.0 // Normal speed
      utterance.pitch = 1.0 // Normal pitch
      utterance.volume = 1.0 // Full volume

      // Get available voices and try to set a good one
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        // Try to find a good English voice
        const englishVoice =
          voices.find((voice) => voice.lang.includes("en-") && !voice.name.includes("Google")) || voices[0]
        utterance.voice = englishVoice
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(utterance)
    } else {
      console.error("Speech synthesis not supported")
    }
  }

  // Process conversation responses based on current state
  const processConversationResponse = (response: string) => {
    console.log("Processing conversation response:", response, "State:", conversationState) // Debug log

    switch (conversationState) {
      case "collecting_task_title":
        if (response.includes("cancel") || response.includes("stop")) {
          speak("Task creation cancelled.")
          setConversationState("idle")
          resetTaskData()
        } else {
          setTaskData((prev) => ({ ...prev, title: response }))
          speak("What priority should this task have? Say high, medium, or low.")
          setConversationState("collecting_task_priority")
        }
        break

      case "collecting_task_priority":
        if (response.includes("cancel") || response.includes("stop")) {
          speak("Task creation cancelled.")
          setConversationState("idle")
          resetTaskData()
        } else if (response.includes("high")) {
          setTaskData((prev) => ({ ...prev, priority: "high" }))
          speak("Priority set to high. What category is this task?")
          setConversationState("collecting_task_category")
        } else if (response.includes("low")) {
          setTaskData((prev) => ({ ...prev, priority: "low" }))
          speak("Priority set to low. What category is this task?")
          setConversationState("collecting_task_category")
        } else {
          setTaskData((prev) => ({ ...prev, priority: "medium" }))
          speak("Priority set to medium. What category is this task?")
          setConversationState("collecting_task_category")
        }
        break

      case "collecting_task_category":
        if (response.includes("cancel") || response.includes("stop")) {
          speak("Task creation cancelled.")
          setConversationState("idle")
          resetTaskData()
        } else {
          // Extract the category - use the whole response as category
          const category = response.charAt(0).toUpperCase() + response.slice(1)
          setTaskData((prev) => ({ ...prev, category }))
          speak("When is this task due? Say today, tomorrow, next week, or a specific date.")
          setConversationState("collecting_task_due_date")
        }
        break

      case "collecting_task_due_date":
        if (response.includes("cancel") || response.includes("stop")) {
          speak("Task creation cancelled.")
          setConversationState("idle")
          resetTaskData()
        } else {
          let dueDate = new Date()

          if (response.includes("tomorrow")) {
            dueDate = addDays(new Date(), 1)
          } else if (response.includes("next week")) {
            dueDate = addDays(new Date(), 7)
          } else if (response.includes("today")) {
            // Already set to today
          } else {
            // Try to extract a date if mentioned - enhanced date parsing
            const parsedDate = parseSpokenDate(response)
            if (parsedDate) {
              dueDate = parsedDate
            }
          }

          setTaskData((prev) => ({ ...prev, dueDate }))
          speak("Would you like to add a description for this task?")
          setConversationState("collecting_task_description")
        }
        break

      case "collecting_task_description":
        if (response.includes("no") || response.includes("skip")) {
          setTaskData((prev) => ({ ...prev, description: "" }))
          confirmTaskCreation()
        } else if (response.includes("cancel") || response.includes("stop")) {
          speak("Task creation cancelled.")
          setConversationState("idle")
          resetTaskData()
        } else {
          setTaskData((prev) => ({ ...prev, description: response }))
          confirmTaskCreation()
        }
        break

      case "confirming_task":
        if (response.includes("yes") || response.includes("confirm") || response.includes("create")) {
          createTaskFromData()
        } else if (response.includes("no") || response.includes("cancel") || response.includes("stop")) {
          speak("Task creation cancelled.")
          setConversationState("idle")
          resetTaskData()
        } else {
          speak("I didn't understand. Please say yes to confirm or no to cancel.")
        }
        break

      default:
        // If we're in an unknown state, reset to idle
        setConversationState("idle")
    }
  }

  // Parse a spoken date in various formats
  const parseSpokenDate = (dateText: string): Date | null => {
    try {
      // Format: "9th May 2025" or "9 May 2025" or "May 9th 2025" or "May 9 2025"
      const dateRegex1 =
        /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i
      const dateRegex2 =
        /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/i

      // Format: "09/05/2025" or "9/5/2025" or "09-05-2025" or "9-5-2025"
      const dateRegex3 = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/

      // Format: "2025/05/09" or "2025-05-09"
      const dateRegex4 = /(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/

      let match
      let date = null

      if ((match = dateText.match(dateRegex1))) {
        const day = Number.parseInt(match[1], 10)
        const monthStr = match[2].toLowerCase()
        const year = Number.parseInt(match[3], 10)

        const months = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
        ]
        const month = months.indexOf(monthStr)

        if (month !== -1 && day > 0 && day <= 31) {
          date = new Date(year, month, day)
        }
      } else if ((match = dateText.match(dateRegex2))) {
        const monthStr = match[1].toLowerCase()
        const day = Number.parseInt(match[2], 10)
        const year = Number.parseInt(match[3], 10)

        const months = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
        ]
        const month = months.indexOf(monthStr)

        if (month !== -1 && day > 0 && day <= 31) {
          date = new Date(year, month, day)
        }
      } else if ((match = dateText.match(dateRegex3))) {
        // Assuming DD/MM/YYYY format
        const day = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10) - 1 // JS months are 0-indexed
        const year = Number.parseInt(match[3], 10)

        if (month >= 0 && month < 12 && day > 0 && day <= 31) {
          date = new Date(year, month, day)
        }
      } else if ((match = dateText.match(dateRegex4))) {
        // YYYY/MM/DD format
        const year = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10) - 1 // JS months are 0-indexed
        const day = Number.parseInt(match[3], 10)

        if (month >= 0 && month < 12 && day > 0 && day <= 31) {
          date = new Date(year, month, day)
        }
      }

      // Check if the date is valid
      if (date && isValid(date)) {
        return date
      }

      return null
    } catch (error) {
      console.error("Error parsing date:", error)
      return null
    }
  }

  // Reset task data
  const resetTaskData = () => {
    setTaskData({
      title: "",
      priority: "medium",
      category: "Work",
      dueDate: new Date(),
      description: "",
    })
  }

  // Confirm task creation
  const confirmTaskCreation = () => {
    const { title, priority, category, dueDate } = taskData
    const formattedDate = format(dueDate, "MMMM do, yyyy")

    speak(
      `I'll create a ${priority} priority task titled "${title}" in the ${category} category, due on ${formattedDate}. Confirm by saying yes or cancel by saying no.`,
    )
    setConversationState("confirming_task")
  }

  // Create task from collected data
  const createTaskFromData = async () => {
    try {
      const formData = new FormData()
      formData.append("title", taskData.title)
      formData.append("description", taskData.description)
      formData.append("dueDate", taskData.dueDate.toISOString())
      formData.append("category", taskData.category)
      formData.append("priority", taskData.priority)

      await createTask(formData)

      speak(`Task "${taskData.title}" created successfully.`)

      // Reset conversation state and task data
      setConversationState("idle")
      resetTaskData()

      // Show a toast notification
      toast({
        title: "Task Created",
        description: `"${taskData.title}" has been added to your tasks.`,
        variant: "success",
      })

      // Force refresh the page to show the new task
      // Use router.refresh() first for a soft refresh
      router.refresh()

      // Then do a hard refresh after a short delay if needed
      setTimeout(() => {
        window.location.href = window.location.href
      }, 1000)
    } catch (error) {
      console.error("Error creating task:", error)
      speak("I couldn't create that task. Please try again.")
      setConversationState("idle")
      resetTaskData()
    }
  }

  // Process voice commands
  const processCommand = async (command: string) => {
    console.log("Processing command:", command) // Debug log
    setIsProcessing(true)

    try {
      // Create task command - start conversation flow
      if (
        containsAny(command, [
          "create task",
          "add task",
          "new task",
          "add a new task",
          "create a task",
          "make a task",
          "create new task",
          "i need to add a task",
          "i want to create a task",
        ])
      ) {
        // Extract title if provided in the command
        let initialTitle = ""
        const titleMatch =
          command.match(/called\s+(.+?)(?:\s+with|$)/) ||
          command.match(/titled\s+(.+?)(?:\s+with|$)/) ||
          command.match(/named\s+(.+?)(?:\s+with|$)/)

        if (titleMatch && titleMatch[1]) {
          initialTitle = titleMatch[1].trim()
          setTaskData((prev) => ({ ...prev, title: initialTitle }))
          speak(
            `Creating a task called "${initialTitle}". What priority should this task have? Say high, medium, or low.`,
          )
          setConversationState("collecting_task_priority")
        } else {
          // If no title was provided, ask for it
          speak("What would you like to name this task?")
          setConversationState("collecting_task_title")
        }
      }
      // Delete task command
      else if (
        containsAny(command, [
          "delete task",
          "remove task",
          "erase task",
          "get rid of task",
          "delete the task",
          "remove the task",
          "can you delete",
          "can you remove",
        ])
      ) {
        await handleDeleteTask(command)
      }
      // Complete task command
      else if (
        containsAny(command, [
          "complete task",
          "mark as complete",
          "finish task",
          "mark task as done",
          "mark task complete",
          "mark as done",
          "complete the task",
          "finish the task",
          "task is done",
        ])
      ) {
        await handleCompleteTask(command)
      }
      // Undo completed task command
      else if (
        containsAny(command, [
          "undo task",
          "undo completed task",
          "mark task as incomplete",
          "reopen task",
          "unmark task",
          "mark task as not done",
          "task is not complete",
          "task is not done",
        ])
      ) {
        await handleUndoTask(command)
      }
      // Query tasks for today
      else if (
        containsAny(command, [
          "what are my tasks today",
          "tasks for today",
          "what tasks do i have today",
          "show today's tasks",
          "show tasks for today",
          "today's tasks",
          "what do i need to do today",
          "what's on my schedule today",
          "what's on my agenda today",
        ])
      ) {
        await handleTasksToday()
      }
      // Query tasks for a specific date
      else if (
        containsAny(command, [
          "what are my tasks on",
          "tasks for",
          "what tasks do i have on",
          "show tasks for",
          "what's on my schedule for",
          "what's on my agenda for",
          "what do i need to do on",
        ])
      ) {
        await handleTasksForDate(command)
      }
      // Query tasks to be completed today
      else if (
        containsAny(command, [
          "tasks to be completed today",
          "incomplete tasks today",
          "pending tasks today",
          "what tasks need to be done today",
          "what's left to do today",
          "what's pending today",
        ])
      ) {
        await handleTasksToBeCompletedToday()
      }
      // Query upcoming tasks
      else if (
        containsAny(command, [
          "upcoming tasks",
          "future tasks",
          "what's coming up",
          "what tasks are coming up",
          "what's on my schedule soon",
          "what's ahead",
        ])
      ) {
        await handleUpcomingTasks()
      }
      // Query task count
      else if (
        containsAny(command, ["how many tasks", "task count", "count my tasks", "number of tasks", "total tasks"])
      ) {
        await handleTaskCount()
      }
      // Search for a specific task
      else if (
        containsAny(command, [
          "find task",
          "search for task",
          "look for task",
          "find a task",
          "search for a task",
          "find the task",
          "search task",
          "can you find",
        ])
      ) {
        await handleFindTask(command)
      }
      // Open calendar
      else if (
        containsAny(command, [
          "open calendar",
          "show calendar",
          "go to calendar",
          "take me to calendar",
          "navigate to calendar",
          "switch to calendar",
          "view calendar",
        ])
      ) {
        speak("Opening calendar view.")
        router.push("/calendar")
      }
      // Help command
      else if (
        containsAny(command, [
          "help",
          "what can you do",
          "how do you work",
          "what commands",
          "show me commands",
          "list commands",
          "how to use",
        ])
      ) {
        speak(
          "I can help you manage your tasks. You can say: create task, delete task, complete task, undo task, what are my tasks today, find task, open calendar, upcoming tasks, or how many tasks do I have.",
        )
      }
      // Unknown command
      else {
        speak("I didn't understand that command. Try saying 'help' to learn what I can do.")
      }
    } catch (error) {
      console.error("Error processing command:", error)
      speak("I encountered an error processing your request. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Helper function to check if a string contains any of the phrases
  const containsAny = (text: string, phrases: string[]): boolean => {
    return phrases.some((phrase) => text.includes(phrase))
  }

  // Extract task name from command
  const extractTaskName = (command: string, prefixes: string[]): string | null => {
    for (const prefix of prefixes) {
      if (command.includes(prefix)) {
        const parts = command.split(prefix)
        if (parts.length > 1 && parts[1].trim()) {
          return parts[1].trim()
        }
      }
    }
    return null
  }

  // Handle delete task command
  const handleDeleteTask = async (command: string) => {
    try {
      // Extract task title to delete with more flexible matching
      const prefixes = [
        "delete task ",
        "remove task ",
        "erase task ",
        "get rid of task ",
        "delete the task ",
        "remove the task ",
        "can you delete ",
        "can you remove ",
      ]

      const taskTitle = extractTaskName(command, prefixes)

      if (!taskTitle) {
        speak("Please specify which task you want to delete.")
        return
      }

      // Get all tasks
      const tasks = await getTasks()

      // Find the task with the matching title
      const taskToDelete = tasks.find((task) => task.title.toLowerCase().includes(taskTitle.toLowerCase()))

      if (!taskToDelete) {
        speak(`I couldn't find a task with the title containing "${taskTitle}".`)
        return
      }

      // Create form data for deletion
      const formData = new FormData()
      formData.append("id", taskToDelete.id)

      // Delete the task
      await deleteTask(formData)

      speak(`Task "${taskToDelete.title}" deleted successfully.`)

      // Show a toast notification
      toast({
        title: "Task Deleted",
        description: `"${taskToDelete.title}" has been removed from your tasks.`,
        variant: "default",
      })

      // Force refresh the page to update the task list
      router.refresh()

      // Then do a hard refresh after a short delay if needed
      setTimeout(() => {
        window.location.href = window.location.href
      }, 1000)
    } catch (error) {
      console.error("Error deleting task:", error)
      speak("I couldn't delete that task. Please try again.")
    }
  }

  // Handle complete task command
  const handleCompleteTask = async (command: string) => {
    try {
      // Extract task title to complete with more flexible matching
      const prefixes = [
        "complete task ",
        "mark as complete ",
        "finish task ",
        "mark task as done ",
        "mark task complete ",
        "mark as done ",
        "complete the task ",
        "finish the task ",
        "task is done ",
      ]

      const taskTitle = extractTaskName(command, prefixes)

      if (!taskTitle) {
        speak("Please specify which task you want to mark as complete.")
        return
      }

      // Get all tasks
      const tasks = await getTasks()

      // Find the task with the matching title
      const taskToComplete = tasks.find(
        (task) => task.title.toLowerCase().includes(taskTitle.toLowerCase()) && !task.completed,
      )

      if (!taskToComplete) {
        speak(`I couldn't find an incomplete task with the title containing "${taskTitle}".`)
        return
      }

      // Create form data for completion
      const formData = new FormData()
      formData.append("id", taskToComplete.id)

      // Complete the task
      await toggleTaskCompletion(formData)

      speak(`Task "${taskToComplete.title}" marked as complete.`)

      // Show a toast notification
      toast({
        title: "Task Completed",
        description: `"${taskToComplete.title}" has been marked as complete.`,
        variant: "success",
      })

      // Force refresh the page to update the task list
      router.refresh()

      // Then do a hard refresh after a short delay if needed
      setTimeout(() => {
        window.location.href = window.location.href
      }, 1000)
    } catch (error) {
      console.error("Error completing task:", error)
      speak("I couldn't complete that task. Please try again.")
    }
  }

  // Handle undo completed task command
  const handleUndoTask = async (command: string) => {
    try {
      // Extract task title to undo with more flexible matching
      const prefixes = [
        "undo task ",
        "undo completed task ",
        "mark task as incomplete ",
        "reopen task ",
        "unmark task ",
        "mark task as not done ",
        "task is not complete ",
        "task is not done ",
      ]

      const taskTitle = extractTaskName(command, prefixes)

      if (!taskTitle) {
        speak("Please specify which task you want to mark as incomplete.")
        return
      }

      // Get all tasks
      const tasks = await getTasks()

      // Find the task with the matching title
      const taskToUndo = tasks.find(
        (task) => task.title.toLowerCase().includes(taskTitle.toLowerCase()) && task.completed,
      )

      if (!taskToUndo) {
        speak(`I couldn't find a completed task with the title containing "${taskTitle}".`)
        return
      }

      // Create form data for undoing completion
      const formData = new FormData()
      formData.append("id", taskToUndo.id)

      // Undo the task completion
      await toggleTaskCompletion(formData)

      speak(`Task "${taskToUndo.title}" marked as incomplete.`)

      // Show a toast notification
      toast({
        title: "Task Reopened",
        description: `"${taskToUndo.title}" has been marked as incomplete.`,
        variant: "default",
      })

      // Force refresh the page to update the task list
      router.refresh()

      // Then do a hard refresh after a short delay if needed
      setTimeout(() => {
        window.location.href = window.location.href
      }, 1000)
    } catch (error) {
      console.error("Error undoing task completion:", error)
      speak("I couldn't undo that task. Please try again.")
    }
  }

  // Handle find task command
  const handleFindTask = async (command: string) => {
    try {
      // Extract task title to find with more flexible matching
      const prefixes = [
        "find task ",
        "search for task ",
        "look for task ",
        "find a task ",
        "search for a task ",
        "find the task ",
        "search task ",
        "can you find ",
      ]

      const taskTitle = extractTaskName(command, prefixes)

      if (!taskTitle) {
        speak("Please specify which task you want to find.")
        return
      }

      // Get all tasks
      const tasks = await getTasks()

      // Find tasks with the matching title
      const matchingTasks = tasks.filter((task) => task.title.toLowerCase().includes(taskTitle.toLowerCase()))

      if (matchingTasks.length === 0) {
        speak(`I couldn't find any tasks with the title containing "${taskTitle}".`)
        return
      }

      // Speak the number of matching tasks
      speak(`I found ${matchingTasks.length} ${matchingTasks.length === 1 ? "task" : "tasks"} matching "${taskTitle}".`)

      // After a short pause, read out the details of each task
      setTimeout(() => {
        matchingTasks.forEach((task, index) => {
          setTimeout(() => {
            const priorityText =
              task.priority === "high" ? "high priority" : task.priority === "low" ? "low priority" : "medium priority"
            const statusText = task.completed ? "completed" : "not completed"
            const dueDate = format(new Date(task.dueDate), "MMMM do, yyyy")

            speak(`Task ${index + 1}: ${task.title}. ${priorityText}. Due on ${dueDate}. Status: ${statusText}.`)
          }, index * 4000) // Space out the speaking of each task
        })
      }, 1500)

      // Show a toast notification with the search results
      toast({
        title: "Search Results",
        description: `Found ${matchingTasks.length} tasks matching "${taskTitle}"`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error finding task:", error)
      speak("I couldn't search for that task. Please try again.")
    }
  }

  // Handle query for tasks on a specific date
  const handleTasksForDate = async (command: string) => {
    try {
      // Extract the date from the command
      const dateText = command
        .replace(
          /what are my tasks on|tasks for|what tasks do i have on|show tasks for|what tasks do i have on|show tasks for|what's on my schedule for|what's on my agenda for|what do i need to do on/gi,
          "",
        )
        .trim()

      if (!dateText) {
        speak("Please specify a date to check tasks for.")
        return
      }

      // Parse the date
      const specificDate = parseSpokenDate(dateText)

      if (!specificDate) {
        speak(`I couldn't understand the date "${dateText}". Please try again with a different format.`)
        return
      }

      // Format the date for comparison and display
      const dateForComparison = specificDate.toISOString().split("T")[0]
      const formattedDate = format(specificDate, "MMMM do, yyyy")

      // Get all tasks
      const tasks = await getTasks()

      // Filter tasks for the specific date
      const tasksOnDate = tasks.filter((task) => {
        const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
        return taskDate === dateForComparison
      })

      if (tasksOnDate.length === 0) {
        speak(`You don't have any tasks scheduled for ${formattedDate}.`)
      } else {
        // First, give a summary
        speak(`You have ${tasksOnDate.length} tasks for ${formattedDate}.`)

        // Then, after a short pause, read out the details of each task
        setTimeout(() => {
          tasksOnDate.forEach((task, index) => {
            setTimeout(() => {
              const priorityText =
                task.priority === "high"
                  ? "high priority"
                  : task.priority === "low"
                    ? "low priority"
                    : "medium priority"
              const statusText = task.completed ? "completed" : "not completed"
              speak(
                `Task ${index + 1}: ${task.title}. ${priorityText}. Category: ${task.category}. Status: ${statusText}.`,
              )
            }, index * 4000) // Space out the speaking of each task
          })
        }, 1500)
      }
    } catch (error) {
      console.error("Error getting tasks for date:", error)
      speak("I couldn't retrieve your tasks for that date. Please try again.")
    }
  }

  // Handle query for today's tasks
  const handleTasksToday = async () => {
    try {
      // Get all tasks
      const tasks = await getTasks()

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Filter tasks for today
      const todayTasks = tasks.filter((task) => {
        const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
        return taskDate === today
      })

      if (todayTasks.length === 0) {
        speak("You don't have any tasks scheduled for today.")
      } else {
        // First, give a summary
        speak(`You have ${todayTasks.length} tasks for today.`)

        // Then, after a short pause, read out the details of each task
        setTimeout(() => {
          todayTasks.forEach((task, index) => {
            setTimeout(() => {
              const priorityText =
                task.priority === "high"
                  ? "high priority"
                  : task.priority === "low"
                    ? "low priority"
                    : "medium priority"
              const statusText = task.completed ? "completed" : "not completed"
              speak(
                `Task ${index + 1}: ${task.title}. ${priorityText}. Category: ${task.category}. Status: ${statusText}.`,
              )
            }, index * 4000) // Space out the speaking of each task
          })
        }, 1500)
      }
    } catch (error) {
      console.error("Error getting today's tasks:", error)
      speak("I couldn't retrieve your tasks for today. Please try again.")
    }
  }

  // Handle query for tasks to be completed today
  const handleTasksToBeCompletedToday = async () => {
    try {
      // Get all tasks
      const tasks = await getTasks()

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Filter tasks for today that are not completed
      const incompleteTasks = tasks.filter((task) => {
        const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
        return taskDate === today && !task.completed
      })

      if (incompleteTasks.length === 0) {
        speak("You don't have any incomplete tasks for today. Great job!")
      } else {
        // First, give a summary
        speak(`You have ${incompleteTasks.length} tasks to complete today.`)

        // Then, after a short pause, read out the details of each task
        setTimeout(() => {
          incompleteTasks.forEach((task, index) => {
            setTimeout(() => {
              const priorityText =
                task.priority === "high"
                  ? "high priority"
                  : task.priority === "low"
                    ? "low priority"
                    : "medium priority"
              speak(`Task ${index + 1}: ${task.title}. ${priorityText}. Category: ${task.category}.`)
            }, index * 4000) // Space out the speaking of each task
          })
        }, 1500)
      }
    } catch (error) {
      console.error("Error getting incomplete tasks:", error)
      speak("I couldn't retrieve your incomplete tasks for today. Please try again.")
    }
  }

  // Handle query for upcoming tasks
  const handleUpcomingTasks = async () => {
    try {
      // Get all tasks
      const tasks = await getTasks()

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Filter tasks for upcoming (future dates, not completed)
      const upcomingTasks = tasks.filter((task) => {
        const taskDate = new Date(task.dueDate).toISOString().split("T")[0]
        return taskDate > today && !task.completed
      })

      if (upcomingTasks.length === 0) {
        speak("You don't have any upcoming tasks scheduled.")
      } else {
        // Sort by date
        upcomingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

        // Get the next 5 tasks or fewer
        const nextTasks = upcomingTasks.slice(0, 5)

        const taskList = nextTasks
          .map((task) => {
            const date = format(new Date(task.dueDate), "MMMM do")
            return `${task.title} on ${date}`
          })
          .join(", ")

        speak(`You have ${upcomingTasks.length} upcoming tasks. The next ${nextTasks.length} are: ${taskList}`)
      }
    } catch (error) {
      console.error("Error getting upcoming tasks:", error)
      speak("I couldn't retrieve your upcoming tasks. Please try again.")
    }
  }

  // Handle query for task count
  const handleTaskCount = async () => {
    try {
      // Get all tasks
      const tasks = await getTasks()

      // Count completed and incomplete tasks
      const completedTasks = tasks.filter((task) => task.completed)
      const incompleteTasks = tasks.filter((task) => !task.completed)

      speak(
        `You have a total of ${tasks.length} tasks. ${completedTasks.length} are completed and ${incompleteTasks.length} are still pending.`,
      )
    } catch (error) {
      console.error("Error getting task count:", error)
      speak("I couldn't retrieve your task count. Please try again.")
    }
  }

  // Add this to the layout component to ensure the voice assistant is loaded
  useEffect(() => {
    // Initialize speech synthesis voices
    if ("speechSynthesis" in window) {
      // Load voices
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end space-y-2">
        {(transcript || isProcessing || isSpeaking || conversationState !== "idle") && (
          <div className="bg-white p-3 rounded-lg shadow-lg max-w-xs">
            {transcript && <p className="text-sm mb-1">"{transcript}"</p>}
            {conversationState !== "idle" && (
              <p className="text-xs text-blue-600 mb-1">
                {conversationState === "collecting_task_title" && "Waiting for task title..."}
                {conversationState === "collecting_task_priority" && "Waiting for priority..."}
                {conversationState === "collecting_task_category" && "Waiting for category..."}
                {conversationState === "collecting_task_due_date" && "Waiting for due date..."}
                {conversationState === "collecting_task_description" && "Waiting for description..."}
                {conversationState === "confirming_task" && "Waiting for confirmation..."}
              </p>
            )}
            {isProcessing && <p className="text-xs text-gray-500">Processing...</p>}
            {isSpeaking && (
              <div className="flex items-center text-xs text-gray-500">
                <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
                Speaking...
              </div>
            )}
          </div>
        )}
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "default"}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg animate-pulse hover:animate-none"
          style={{ zIndex: 9999 }} // Ensure it's above everything else
          aria-label={isListening ? "Stop voice assistant" : "Start voice assistant"}
        >
          {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
        </Button>
      </div>
    </div>
  )
}
