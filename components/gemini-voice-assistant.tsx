"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

// Task creation data structure
interface TaskCreationData {
  title: string
  priority: string
  category: string
  dueDate: Date
  description: string
}

export function GeminiVoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [geminiResponse, setGeminiResponse] = useState("")
  const [conversationContext, setConversationContext] = useState<string[]>([])
  const [errorCount, setErrorCount] = useState(0)
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
        const transcript = event.results[event.results.length - 1][0].transcript.trim()
        setTranscript(transcript)
        console.log("Heard:", transcript) // Debug log
        processWithGemini(transcript)
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
  }, [isListening, toast])

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start()
        speak("Voice assistant activated. How can I help you with your tasks?")

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

  // Safe fetch that won't cause logout on error
  const safeFetch = async (url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options)

      // If we get a 401 Unauthorized, don't throw an error that would cause a logout
      // Instead, return a custom response that indicates auth issues
      if (response.status === 401) {
        console.warn("Authentication issue detected, but preventing automatic logout")
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: "Authentication required",
            preventLogout: true,
          }),
        }
      }

      return response
    } catch (error) {
      console.error("Network error in safeFetch:", error)
      // Return a fake response object instead of throwing
      return {
        ok: false,
        status: 0,
        statusText: "Network Error",
        json: async () => ({
          success: false,
          error: "Network error, please check your connection",
        }),
      }
    }
  }

  // Get application context for Gemini
  const getApplicationContext = async () => {
    try {
      // Get database info
      const dbInfoResponse = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_database_info",
        }),
      })

      let dbInfo = { success: false, dbInfo: "Database info unavailable" }
      if (dbInfoResponse.ok) {
        dbInfo = await dbInfoResponse.json()
      }

      // Get task stats
      const taskStatsResponse = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_task_stats",
        }),
      })

      let taskStats = { success: false, stats: "Task stats unavailable" }
      if (taskStatsResponse.ok) {
        taskStats = await taskStatsResponse.json()
      }

      // Get all tasks
      const tasksResponse = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_tasks",
        }),
      })

      let tasksData = { success: false, tasks: [] }
      if (tasksResponse.ok) {
        tasksData = await tasksResponse.json()
      }

      // Format tasks for context - limit to 15 tasks to keep prompt size manageable
      const tasksContext = Array.isArray(tasksData.tasks)
        ? tasksData.tasks
            .slice(0, 15)
            .map((task: any) => {
              const dueDate = format(new Date(task.dueDate), "yyyy-MM-dd")
              const status = task.completed ? "completed" : "not completed"
              return `- ${task.title} (${task.priority} priority, category: ${task.category}, due: ${dueDate}, ${status})`
            })
            .join("\n")
        : "No tasks found or unable to retrieve tasks."

      return {
        dbInfo: dbInfo.success ? dbInfo.dbInfo : "Database info unavailable",
        taskStats: taskStats.success ? taskStats.stats : "Task stats unavailable",
        tasks: tasksContext || "No tasks found.",
        tasksCount: tasksData.success && Array.isArray(tasksData.tasks) ? tasksData.tasks.length : 0,
      }
    } catch (error) {
      console.error("Error getting application context:", error)
      return {
        dbInfo: "Error retrieving database info",
        taskStats: "Error retrieving task stats",
        tasks: "Error retrieving tasks",
        tasksCount: 0,
      }
    }
  }

  // Process transcript with Gemini
  const processWithGemini = async (userInput: string) => {
    setIsProcessing(true)
    try {
      // Update conversation context
      const updatedContext = [...conversationContext]
      updatedContext.push(`User: ${userInput}`)
      if (updatedContext.length > 10) updatedContext.shift() // Keep last 10 exchanges
      setConversationContext(updatedContext)

      // Get application context
      const appContext = await getApplicationContext()

      // Create a comprehensive prompt for Gemini with full application context
      const prompt = `
You are a voice-controlled task management assistant for the TaskSphere application. You have direct access to the application's database and functionality.

## APPLICATION CONTEXT
Current date: ${format(new Date(), "yyyy-MM-dd")}
Current page: ${typeof window !== "undefined" ? window.location.pathname : "Unknown"}
Database info: ${JSON.stringify(appContext.dbInfo)}
Task statistics: ${JSON.stringify(appContext.taskStats)}

## AVAILABLE TASKS (${appContext.tasksCount} total, showing up to 15)
${appContext.tasks}

## CONVERSATION HISTORY
${updatedContext.join("\n")}

## AVAILABLE ACTIONS
You can perform the following actions directly:
1. create_task - Create a new task with title, description, dueDate, category, and priority
2. delete_task - Delete a task by title or ID
3. toggle_task - Mark a task as complete or incomplete by title or ID
4. get_tasks_by_date - Get tasks for a specific date
5. get_upcoming_tasks - Get upcoming tasks
6. search_tasks - Search for tasks by query
7. navigate - Navigate to different pages in the application

## USER REQUEST
"${userInput}"

## INSTRUCTIONS
1. Analyze the user's request and determine the appropriate action
2. Respond with a JSON object in this format:
{
  "action": "one of [create_task, delete_task, toggle_task, get_tasks_by_date, get_upcoming_tasks, search_tasks, navigate, respond]",
  "actionData": {
    // Data specific to the action
    // For create_task: title, description, dueDate, category, priority
    // For delete_task/toggle_task: id or title
    // For get_tasks_by_date: date
    // For search_tasks: query
    // For navigate: path
  },
  "responseMessage": "A natural language response to the user"
}

3. If the user's request doesn't require a specific action, use "respond" as the action and provide a helpful response.
4. Be conversational but concise in your responseMessage.
5. If you need more information to complete a task, ask for it in the responseMessage.
6. For dates, accept various formats and convert to YYYY-MM-DD.
7. For task creation, infer reasonable defaults if information is missing.
`

      console.log("Sending request to Gemini API")

      // Call the Gemini API
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      console.log("Received response from API, status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error details:", errorData)

        // If we're getting too many errors, provide a more permanent error message
        setErrorCount((prev) => prev + 1)

        // If there's an API error, provide a fallback response
        const fallbackResponse = {
          action: "respond",
          responseMessage:
            errorCount > 2
              ? "I'm having persistent trouble connecting to my services. Please check your internet connection or try again later."
              : "I'm having trouble connecting to my services right now. Could you try again in a moment?",
        }

        setGeminiResponse(fallbackResponse.responseMessage)
        speak(fallbackResponse.responseMessage)

        // Don't throw here - just log the error and continue
        console.error(`API request failed with status ${response.status}: ${errorData.error || "Unknown error"}`)
        return
      }

      // Reset error count on successful response
      setErrorCount(0)

      const data = await response.json()
      console.log("Gemini response data:", data)

      // Process the Gemini response
      if (data.response) {
        try {
          // Try to parse the JSON response
          let parsedResponse

          // Extract JSON from the response if needed
          // Fixed regex patterns to properly match JSON in various formats
          const jsonMatch =
            data.response.match(/```json\n([\s\S]*?)\n```/) ||
            data.response.match(/```([\s\S]*?)```/) ||
            data.response.match(/(\{[\s\S]*\})/)

          if (jsonMatch) {
            const jsonContent = jsonMatch[1] || jsonMatch[0]
            console.log("Extracted JSON:", jsonContent)
            parsedResponse = JSON.parse(jsonContent)
          } else {
            console.log("Attempting to parse full response as JSON")
            parsedResponse = JSON.parse(data.response)
          }

          console.log("Parsed response:", parsedResponse)

          // Fallback for malformed responses
          if (!parsedResponse.responseMessage) {
            parsedResponse.responseMessage = "I understood your request and am processing it now."
          }

          if (!parsedResponse.action) {
            parsedResponse.action = "respond"
          }

          // Update conversation context with assistant's response
          const assistantResponse = `Assistant: ${parsedResponse.responseMessage}`
          const newContext = [...updatedContext, assistantResponse]
          if (newContext.length > 10) newContext.shift() // Keep last 10 exchanges
          setConversationContext(newContext)

          setGeminiResponse(parsedResponse.responseMessage)
          speak(parsedResponse.responseMessage)

          // Execute the appropriate action based on Gemini's response
          if (parsedResponse.action !== "respond") {
            await executeAction(parsedResponse.action, parsedResponse.actionData || {})
          }
        } catch (error) {
          console.error("Error parsing Gemini response:", error)
          console.log("Raw response:", data.response)

          // Provide a fallback response for parsing errors
          const errorMessage =
            "I understood what you said, but I'm having trouble processing it correctly. Could you try rephrasing your request?"
          setGeminiResponse(errorMessage)
          speak(errorMessage)
        }
      } else {
        const noResponseMessage = "I didn't get a proper response from my services. Please try again."
        setGeminiResponse(noResponseMessage)
        speak(noResponseMessage)
      }
    } catch (error) {
      console.error("Error processing with Gemini:", error)

      // Provide a user-friendly error message
      const errorMessage =
        "I encountered a technical issue while processing your request. Please try again in a moment."
      setGeminiResponse(errorMessage)
      speak(errorMessage)

      toast({
        title: "Voice Assistant Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Execute the action determined by Gemini
  const executeAction = async (action: string, actionData: any) => {
    console.log("Executing action:", action, "with actionData:", actionData)

    try {
      switch (action) {
        case "create_task":
          await handleCreateTask(actionData)
          break
        case "delete_task":
          await handleDeleteTask(actionData)
          break
        case "toggle_task":
          await handleToggleTask(actionData)
          break
        case "get_tasks_by_date":
          await handleTasksForDate(actionData)
          break
        case "get_upcoming_tasks":
          await handleUpcomingTasks()
          break
        case "search_tasks":
          await handleSearchTasks(actionData)
          break
        case "navigate":
          handleNavigation(actionData)
          break
        default:
          // No additional action needed
          break
      }
    } catch (error) {
      console.error("Error executing action:", error)
      toast({
        title: "Action Error",
        description: `Error executing ${action}: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Handle creating a new task
  const handleCreateTask = async (taskParams: any) => {
    try {
      if (!taskParams.title) {
        return // Gemini should have asked for more info in the response
      }

      // Call the API directly
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_task",
          actionData: taskParams,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if this is an auth error that would cause logout
        if (result.preventLogout) {
          toast({
            title: "Authentication Required",
            description: "Please log in to create tasks.",
            variant: "destructive",
          })
          return
        }

        throw new Error(result.error || `Failed to create task: ${response.status}`)
      }

      // Show a toast notification
      toast({
        title: "Task Created",
        description: `"${taskParams.title}" has been added to your tasks.`,
        variant: "success",
      })

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error Creating Task",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle deleting a task
  const handleDeleteTask = async (taskParams: any) => {
    try {
      // Call the API directly
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_task",
          actionData: taskParams,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if this is an auth error that would cause logout
        if (result.preventLogout) {
          toast({
            title: "Authentication Required",
            description: "Please log in to delete tasks.",
            variant: "destructive",
          })
          return
        }

        throw new Error(result.error || `Failed to delete task: ${response.status}`)
      }

      // Show a toast notification
      toast({
        title: "Task Deleted",
        description: result.task ? `"${result.task.title}" has been removed.` : "Task has been removed.",
        variant: "default",
      })

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error Deleting Task",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle toggling a task's completion status
  const handleToggleTask = async (taskParams: any) => {
    try {
      // Call the API directly
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle_task",
          actionData: taskParams,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if this is an auth error that would cause logout
        if (result.preventLogout) {
          toast({
            title: "Authentication Required",
            description: "Please log in to update tasks.",
            variant: "destructive",
          })
          return
        }

        throw new Error(result.error || `Failed to toggle task: ${response.status}`)
      }

      const taskStatus = result.task?.completed ? "completed" : "reopened"

      // Show a toast notification
      toast({
        title: `Task ${taskStatus}`,
        description: result.task ? `"${result.task.title}" has been ${taskStatus}.` : `Task has been ${taskStatus}.`,
        variant: "success",
      })

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error toggling task:", error)
      toast({
        title: "Error Updating Task",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle getting tasks for a specific date
  const handleTasksForDate = async (params: any) => {
    try {
      if (!params.date) return

      // Call the API directly
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_tasks_by_date",
          actionData: params,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Don't throw for read operations, just log
        console.error("Error getting tasks for date:", result.error)
        return
      }

      // Show a toast notification
      toast({
        title: `Tasks for ${result.date}`,
        description: `Found ${result.tasks.length} tasks.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error getting tasks for date:", error)
    }
  }

  // Handle getting upcoming tasks
  const handleUpcomingTasks = async () => {
    try {
      // Call the API directly
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_upcoming_tasks",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Don't throw for read operations, just log
        console.error("Error getting upcoming tasks:", result.error)
        return
      }

      // Show a toast notification
      toast({
        title: "Upcoming Tasks",
        description: `You have ${result.tasks.length} upcoming tasks.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error getting upcoming tasks:", error)
    }
  }

  // Handle searching for tasks
  const handleSearchTasks = async (params: any) => {
    try {
      if (!params.query) return

      // Call the API directly
      const response = await safeFetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "search_tasks",
          actionData: params,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Don't throw for read operations, just log
        console.error("Error searching tasks:", result.error)
        return
      }

      // Show a toast notification
      toast({
        title: "Search Results",
        description: `Found ${result.tasks.length} tasks matching "${params.query}"`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error searching tasks:", error)
    }
  }

  // Handle navigation
  const handleNavigation = (params: any) => {
    try {
      if (!params.path) return

      // Navigate to the specified path
      router.push(params.path)

      // Show a toast notification
      toast({
        title: "Navigating",
        description: `Going to ${params.path}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error navigating:", error)
    }
  }

  // Initialize speech synthesis voices
  useEffect(() => {
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
        {(transcript || isProcessing || isSpeaking || geminiResponse) && (
          <div className="bg-white p-3 rounded-lg shadow-lg max-w-xs">
            {transcript && <p className="text-sm mb-1">"{transcript}"</p>}
            {geminiResponse && <p className="text-xs text-blue-600 mb-1">{geminiResponse}</p>}
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
