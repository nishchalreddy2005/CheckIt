"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createTask } from "@/app/actions/task-actions-create"
import { getTasks, deleteTask, toggleTaskCompletion, getTaskStats } from "@/app/actions/task-actions"

type ConversationStep =
  | "idle"
  | "greeting"
  | "awaiting_command"
  // Create task flow
  | "create_title"
  | "create_priority"
  | "create_category"
  | "create_date"
  | "create_time"
  | "creating_task"
  // Complete task flow
  | "complete_which"
  // Delete task flow
  | "delete_which"
  | "delete_confirm"
  // Task info / status flow
  | "task_info"
  // Followup
  | "ask_more"

interface TaskDraft {
  title: string
  priority: string
  category: string
  dueDate: string
}

interface TaskMatch {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
}

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [assistantResponse, setAssistantResponse] = useState("")
  const [conversationStep, setConversationStep] = useState<ConversationStep>("idle")
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({ title: "", priority: "", category: "", dueDate: "" })
  const taskDraftRef = useRef<TaskDraft>({ title: "", priority: "", category: "", dueDate: "" })
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; text: string }[]>([])
  const [matchedTasks, setMatchedTasks] = useState<TaskMatch[]>([])
  const [pendingDeleteTask, setPendingDeleteTask] = useState<TaskMatch | null>(null)
  const recognitionRef = useRef<any>(null)
  const speakingRef = useRef(false)
  const { toast } = useToast()
  const router = useRouter()
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(false)
  const stepRef = useRef<ConversationStep>("idle")

  useEffect(() => { stepRef.current = conversationStep }, [conversationStep])

  // Initialize Speech Recognition
  useEffect(() => {
    let SR: any = null
    if (typeof window !== "undefined") {
      // @ts-ignore
      SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) setSpeechRecognitionAvailable(true)
    }
    if (SR) {
      recognitionRef.current = new SR()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript.trim()
        setTranscript(text)
        addChat("user", text)
        handleUserInput(text)
      }
      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.error("Speech error:", event.error)
        }
      }
      recognitionRef.current.onend = () => {
        // Only auto-restart if NOT idle, NOT creating, and NOT while TTS is speaking
        if (stepRef.current !== "idle" && stepRef.current !== "creating_task" && !speakingRef.current) {
          setTimeout(() => {
            if (stepRef.current !== "idle" && recognitionRef.current && !speakingRef.current) {
              try { recognitionRef.current.start() } catch (e) { }
            }
          }, 800)
        }
      }
    }
    return () => { if (recognitionRef.current) try { recognitionRef.current.stop() } catch (e) { } }
  }, [])

  const addChat = useCallback((role: "user" | "assistant", text: string) => {
    setChatHistory(prev => [...prev.slice(-10), { role, text }])
  }, [])

  const speak = useCallback((text: string, onDone?: () => void) => {
    if ("speechSynthesis" in window) {
      // Stop recognition while speaking to prevent self-listening
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) { }
      }
      setIsSpeaking(true)
      speakingRef.current = true
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.onend = () => {
        setIsSpeaking(false)
        speakingRef.current = false
        if (onDone) {
          // Custom callback (e.g. greeting flow)
          setTimeout(() => onDone(), 500)
        } else if (stepRef.current !== "idle" && stepRef.current !== "creating_task" && recognitionRef.current) {
          // Wait a beat after TTS finishes, then start listening
          setTimeout(() => {
            if (!speakingRef.current && recognitionRef.current) {
              try { recognitionRef.current.start() } catch (e) { }
            }
          }, 800)
        }
      }
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const respond = useCallback((msg: string, nextStep: ConversationStep, onDone?: () => void) => {
    setAssistantResponse(msg)
    addChat("assistant", msg)
    setConversationStep(nextStep)
    stepRef.current = nextStep
    speak(msg, onDone)
  }, [addChat, speak])

  // ===== MAIN COMMAND ROUTER =====
  const handleUserInput = useCallback((input: string) => {
    const lower = input.toLowerCase().trim()
    const step = stepRef.current

    switch (step) {
      case "awaiting_command":
        routeCommand(lower, input)
        break
      case "create_title":
        handleCreateTitle(input)
        break
      case "create_priority":
        handleCreatePriority(lower)
        break
      case "create_category":
        handleCreateCategory(input)
        break
      case "create_date":
        handleCreateDate(lower)
        break
      case "create_time":
        handleCreateTime(lower)
        break
      case "complete_which":
        handleCompleteWhich(lower)
        break
      case "delete_which":
        handleDeleteWhich(lower)
        break
      case "delete_confirm":
        handleDeleteConfirm(lower)
        break
      case "ask_more":
        handleAskMore(lower, input)
        break
      default:
        break
    }
  }, [])

  // ===== COMMAND ROUTING =====
  const routeCommand = (lower: string, raw: string) => {
    // Create task
    if (lower.includes("create") || lower.includes("add") || lower.includes("new task")) {
      setTaskDraft({ title: "", priority: "", category: "", dueDate: "" })
      respond("Sure! What is the task title?", "create_title")
    }
    // Complete / mark done
    else if (lower.includes("complete") || lower.includes("finish") || lower.includes("done") || lower.includes("mark")) {
      respond("Which task would you like to mark as complete? Tell me the task name.", "complete_which")
    }
    // Delete
    else if (lower.includes("delete") || lower.includes("remove")) {
      respond("Which task would you like to delete? Tell me the task name.", "delete_which")
    }
    // Task status / summary
    else if (lower.includes("status") || lower.includes("summary") || lower.includes("how many") || lower.includes("progress") || lower.includes("report")) {
      fetchTaskStatus()
    }
    // List tasks
    else if (lower.includes("list") || lower.includes("show") || lower.includes("what are my") || lower.includes("tasks")) {
      fetchAndListTasks()
    }
    // Navigation
    else if (lower.includes("dashboard") || lower.includes("home")) {
      router.push("/dashboard")
      respond("Navigating to dashboard. Is there anything else I can do?", "ask_more")
    }
    else if (lower.includes("calendar")) {
      router.push("/calendar")
      respond("Opening your calendar! Anything else?", "ask_more")
    }
    else if (lower.includes("profile")) {
      router.push("/profile")
      respond("Going to your profile. Is there anything else?", "ask_more")
    }
    else if (lower.includes("setting")) {
      router.push("/settings")
      respond("Opening settings. Anything else?", "ask_more")
    }
    else if (lower.includes("focus")) {
      router.push("/dashboard")
      respond("To start a focus session, please select a task from the dashboard. Anything else?", "ask_more")
    }
    // Goodbye
    else if (lower.includes("no") || lower.includes("nothing") || lower.includes("bye") || lower.includes("stop") || lower.includes("close") || lower.includes("exit") || lower.includes("quit")) {
      respond("Goodbye! Have a productive day!", "idle")
      setTimeout(() => deactivate(), 2000)
    }
    // Fallback — try NLP
    else {
      processWithNLP(raw)
    }
  }

  // ===== CREATE TASK FLOW =====
  const handleCreateTitle = (input: string) => {
    const updated = { ...taskDraftRef.current, title: input }
    setTaskDraft(updated)
    taskDraftRef.current = updated
    respond(`Got it: "${input}". What priority? High, medium, or low?`, "create_priority")
  }

  const handleCreatePriority = (lower: string) => {
    let priority = "medium"
    if (lower.includes("high")) priority = "high"
    else if (lower.includes("low")) priority = "low"
    const updated = { ...taskDraftRef.current, priority }
    setTaskDraft(updated)
    taskDraftRef.current = updated
    respond(`Priority: ${priority}. What category? For example: work, health, personal, or learning.`, "create_category")
  }

  const handleCreateCategory = (input: string) => {
    const category = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
    const updated = { ...taskDraftRef.current, category }
    setTaskDraft(updated)
    taskDraftRef.current = updated
    respond(`Category: ${category}. What date is it due? You can say a date like "March 5th", "tomorrow", or "15th".`, "create_date")
  }

  const handleCreateDate = (lower: string) => {
    const parsedDate = parseNaturalDate(lower)
    const updated = { ...taskDraftRef.current, dueDate: parsedDate }
    setTaskDraft(updated)
    taskDraftRef.current = updated
    respond(`Date set. What time? You can say something like "3 PM", "10:30 AM", or "9 in the morning".`, "create_time")
  }

  const handleCreateTime = async (lower: string) => {
    const time = parseNaturalTime(lower)
    const draft = taskDraftRef.current
    const fullDateTime = `${draft.dueDate}T${time}`
    console.log("[VoiceAssistant] Creating task with draft:", draft, "dateTime:", fullDateTime)
    setConversationStep("creating_task")
    stepRef.current = "creating_task"
    setIsProcessing(true)
    try {
      const fd = new FormData()
      fd.append("title", draft.title)
      fd.append("description", "")
      fd.append("dueDate", fullDateTime)
      fd.append("category", draft.category)
      fd.append("priority", draft.priority)
      console.log("[VoiceAssistant] Calling createTask with:", { title: draft.title, category: draft.category, priority: draft.priority, dueDate: fullDateTime })
      const result = await createTask(fd)
      console.log("[VoiceAssistant] createTask result:", result)
      router.refresh()
      respond(`Task "${draft.title}" has been created successfully! Is there anything else I can do for you?`, "ask_more")
    } catch (e) {
      console.error("[VoiceAssistant] createTask error:", e)
      respond("Sorry, I couldn't create the task. Is there anything else?", "ask_more")
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== COMPLETE TASK FLOW =====
  const handleCompleteWhich = async (lower: string) => {
    setIsProcessing(true)
    try {
      const allTasks = await getTasks()
      const pending = allTasks.filter(t => !t.completed)
      const match = pending.find(t => t.title.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase()))

      if (match) {
        const fd = new FormData()
        fd.append("id", match.id)
        await toggleTaskCompletion(fd)
        router.refresh()
        respond(`Done! "${match.title}" is now marked as complete. Is there anything else?`, "ask_more")
      } else if (pending.length === 0) {
        respond("You have no pending tasks. Everything is already complete! Anything else?", "ask_more")
      } else {
        const names = pending.slice(0, 5).map(t => t.title).join(", ")
        respond(`I couldn't find that task. Your pending tasks are: ${names}. Which one would you like to complete?`, "complete_which")
      }
    } catch (e) {
      respond("Sorry, I couldn't complete the task. Is there anything else?", "ask_more")
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== DELETE TASK FLOW =====
  const handleDeleteWhich = async (lower: string) => {
    setIsProcessing(true)
    try {
      const allTasks = await getTasks()
      const match = allTasks.find(t => t.title.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase()))

      if (match) {
        setPendingDeleteTask({ id: match.id, title: match.title, completed: !!match.completed, priority: match.priority || "medium", category: match.category || "General" })
        respond(`Are you sure you want to delete "${match.title}"? Say yes or no.`, "delete_confirm")
      } else {
        const names = allTasks.slice(0, 5).map(t => t.title).join(", ")
        respond(`I couldn't find that task. Your tasks include: ${names}. Which one would you like to delete?`, "delete_which")
      }
    } catch (e) {
      respond("Sorry, I couldn't find your tasks. Is there anything else?", "ask_more")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteConfirm = async (lower: string) => {
    if (lower.includes("yes") || lower.includes("yeah") || lower.includes("sure") || lower.includes("confirm")) {
      if (pendingDeleteTask) {
        setIsProcessing(true)
        try {
          const fd = new FormData()
          fd.append("id", pendingDeleteTask.id)
          await deleteTask(fd)
          router.refresh()
          respond(`"${pendingDeleteTask.title}" has been deleted. Is there anything else?`, "ask_more")
        } catch (e) {
          respond("Sorry, I couldn't delete the task. Is there anything else?", "ask_more")
        } finally {
          setIsProcessing(false)
          setPendingDeleteTask(null)
        }
      }
    } else {
      setPendingDeleteTask(null)
      respond("Okay, I won't delete it. Is there anything else I can do?", "ask_more")
    }
  }

  // ===== TASK STATUS =====
  const fetchTaskStatus = async () => {
    setIsProcessing(true)
    try {
      const stats = await getTaskStats()
      const msg = `You have ${stats.total} tasks in total. ${stats.completed} completed, ${stats.total - stats.completed} remaining. ` +
        Object.entries(stats.categories).map(([cat, data]) => `${cat}: ${data.completed} of ${data.total} done`).join(". ") +
        ". Is there anything else?"
      respond(msg, "ask_more")
    } catch (e) {
      respond("Sorry, I couldn't fetch your task status. Is there anything else?", "ask_more")
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== LIST TASKS =====
  const fetchAndListTasks = async () => {
    setIsProcessing(true)
    try {
      const allTasks = await getTasks()
      const pending = allTasks.filter(t => !t.completed)
      if (pending.length === 0) {
        respond("You have no pending tasks. Everything is done! Is there anything else?", "ask_more")
      } else {
        const list = pending.slice(0, 7).map((t, i) => `${i + 1}. ${t.title} - ${t.priority} priority`).join(". ")
        respond(`You have ${pending.length} pending tasks. Here are the top ones: ${list}. Is there anything else?`, "ask_more")
      }
    } catch (e) {
      respond("Sorry, I couldn't fetch your tasks. Is there anything else?", "ask_more")
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== ASK MORE (Followup) =====
  const handleAskMore = (lower: string, raw: string) => {
    if (lower.includes("yes") || lower.includes("yeah") || lower.includes("sure") || lower.includes("another")) {
      respond("What would you like to do?", "awaiting_command")
    } else if (lower.includes("no") || lower.includes("nothing") || lower.includes("bye") || lower.includes("that's all") || lower.includes("stop")) {
      respond("Goodbye! Have a productive day!", "idle")
      setTimeout(() => deactivate(), 2000)
    } else {
      // Treat as a new command
      routeCommand(lower, raw)
    }
  }

  // ===== NLP FALLBACK =====
  const processWithNLP = async (userInput: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: userInput }),
      })
      if (!response.ok) throw new Error("NLP Error")
      const data = await response.json()
      if (data.response) {
        const { action, actionData, responseMessage } = data.response
        const msg = responseMessage || "Done."
        setAssistantResponse(msg)
        addChat("assistant", msg)
        speak(msg)
        if (action === "navigate" && actionData?.path) router.push(actionData.path)
        else if (action && action !== "respond") router.refresh()
        setTimeout(() => respond("Is there anything else I can do for you?", "ask_more"), 3000)
      }
    } catch (e) {
      respond("I didn't understand that. Could you try again? You can say things like: create a task, complete a task, delete a task, show my tasks, task status, or navigate to dashboard.", "awaiting_command")
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== DATE PARSER (returns YYYY-MM-DD only) =====
  const parseNaturalDate = (input: string): string => {
    const now = new Date()
    const lower = input.toLowerCase()

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (lower.includes("today")) return formatDate(now)
    if (lower.includes("tomorrow")) {
      const d = new Date(now); d.setDate(d.getDate() + 1)
      return formatDate(d)
    }
    if (lower.includes("next week")) {
      const d = new Date(now); d.setDate(d.getDate() + 7)
      return formatDate(d)
    }

    // Try parsing month + day (e.g., "March 5th", "5th March", "march 15")
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    for (let m = 0; m < months.length; m++) {
      if (lower.includes(months[m])) {
        const numMatch = lower.match(/(\d{1,2})/)
        if (numMatch) {
          const day = parseInt(numMatch[1])
          const d = new Date(now.getFullYear(), m, day)
          if (d < now) d.setFullYear(d.getFullYear() + 1)
          return formatDate(d)
        }
      }
    }

    // Try plain number as day of current/next month (e.g., "the 15th", "15")
    const dayMatch = lower.match(/(\d{1,2})/)
    if (dayMatch) {
      const day = parseInt(dayMatch[1])
      if (day >= 1 && day <= 31) {
        const d = new Date(now.getFullYear(), now.getMonth(), day)
        if (d < now) d.setMonth(d.getMonth() + 1)
        return formatDate(d)
      }
    }

    // Day names (fallback)
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const d = new Date(now)
        let diff = i - d.getDay()
        if (diff <= 0) diff += 7
        d.setDate(d.getDate() + diff)
        return formatDate(d)
      }
    }

    // Default: tomorrow
    const d = new Date(now); d.setDate(d.getDate() + 1)
    return formatDate(d)
  }

  // ===== TIME PARSER (returns HH:mm) =====
  const parseNaturalTime = (input: string): string => {
    const lower = input.toLowerCase().replace(/[.]/g, '')

    // Match patterns like "3 PM", "3:30 PM", "15:00", "10 30 AM"
    const timeMatch = lower.match(/(\d{1,2})[:\s]?(\d{2})?\s*(am|pm|a\.?m\.?|p\.?m\.?)?/)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const period = timeMatch[3]

      if (period) {
        if (period.startsWith('p') && hours < 12) hours += 12
        if (period.startsWith('a') && hours === 12) hours = 0
      }

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    // Word-based times
    if (lower.includes("noon") || lower.includes("midday")) return "12:00"
    if (lower.includes("midnight")) return "00:00"
    if (lower.includes("morning")) return "09:00"
    if (lower.includes("afternoon")) return "14:00"
    if (lower.includes("evening")) return "18:00"
    if (lower.includes("night")) return "21:00"

    // Default: 9 AM
    return "09:00"
  }

  // ===== ACTIVATE / DEACTIVATE =====
  const activate = () => {
    setIsListening(true)
    setChatHistory([])
    setTranscript("")
    setAssistantResponse("")
    const greeting = "Welcome to CheckIt! I am your voice assistant. What can I do for you? You can say: create a task, complete a task, delete a task, show my tasks, task status, or navigate somewhere."
    setConversationStep("greeting")
    stepRef.current = "greeting"
    addChat("assistant", greeting)
    setAssistantResponse(greeting)

    if ("speechSynthesis" in window) {
      setIsSpeaking(true)
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(greeting)
      utterance.rate = 1.0
      utterance.onend = () => {
        setIsSpeaking(false)
        setConversationStep("awaiting_command")
        stepRef.current = "awaiting_command"
        if (recognitionRef.current) {
          try { recognitionRef.current.start() } catch (e) { }
        }
      }
      window.speechSynthesis.speak(utterance)
    }
  }

  const deactivate = () => {
    setIsListening(false)
    setConversationStep("idle")
    stepRef.current = "idle"
    if (recognitionRef.current) try { recognitionRef.current.stop() } catch (e) { }
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setTimeout(() => { setChatHistory([]); setTranscript(""); setAssistantResponse("") }, 2000)
  }

  const toggleListening = () => { isListening ? deactivate() : activate() }

  if (!speechRecognitionAvailable) return null

  // Step label
  const stepLabel: Record<ConversationStep, string> = {
    idle: "", greeting: "Listening...", awaiting_command: "Waiting for your command...",
    create_title: "Tell me the task title", create_priority: "High, Medium, or Low?",
    create_category: "Which category?", create_date: "What date?", create_time: "What time?",
    creating_task: "Creating task...",
    complete_which: "Which task to complete?", delete_which: "Which task to delete?",
    delete_confirm: "Yes or No?", task_info: "Fetching status...", ask_more: "Anything else?",
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end space-y-2">
        {isListening && (
          <div className="glass-panel rounded-2xl shadow-2xl w-[320px] border border-white/10 backdrop-blur-xl bg-slate-900/80 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-indigo-600/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-sm font-semibold text-white">CheckIt Assistant</span>
              </div>
              <button onClick={deactivate} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${msg.role === "user"
                    ? "bg-indigo-500/30 text-indigo-100 border border-indigo-500/20"
                    : "bg-white/5 text-white/80 border border-white/5"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-3 py-2 rounded-xl text-sm text-white/50 border border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" /> Processing...
                  </div>
                </div>
              )}
              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-3 py-2 rounded-xl text-sm text-indigo-300 border border-white/5 flex items-center gap-2">
                    <Volume2 className="h-3 w-3" /> Speaking...
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{stepLabel[conversationStep]}</span>
              {isListening && conversationStep !== "idle" && (
                <div className="flex items-center gap-1">
                  <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                  <span className="text-[10px] text-red-300">LIVE</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex space-x-2 items-center">
          {isListening && (
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-30" />
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
          <Button
            onClick={toggleListening}
            size="icon"
            className={`shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 rounded-full h-14 w-14 ${isListening ? "bg-red-500 hover:bg-red-600 border-red-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {isListening ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
