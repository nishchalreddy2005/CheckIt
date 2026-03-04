"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function VoiceAssistantHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Voice Assistant Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-panel border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Voice Assistant Commands</DialogTitle>
          <DialogDescription>
            Use these voice commands to manage your tasks. Click the microphone button to start.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Task Creation</h3>
            <ul className="list-disc pl-5 text-sm">
              <li>"Create a new task"</li>
              <li>"Add task called [task name]"</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Task Management</h3>
            <ul className="list-disc pl-5 text-sm">
              <li>"Complete task [task name]"</li>
              <li>"Delete task [task name]"</li>
              <li>"Undo task [task name]"</li>
              <li>"Find task [task name]"</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Task Queries</h3>
            <ul className="list-disc pl-5 text-sm">
              <li>"What are my tasks today?"</li>
              <li>"What tasks do I have on [date]?"</li>
              <li>"How many tasks do I have?"</li>
              <li>"What are my upcoming tasks?"</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Navigation</h3>
            <ul className="list-disc pl-5 text-sm">
              <li>"Open calendar"</li>
              <li>"Help" or "What can you do?"</li>
            </ul>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Note: The voice assistant can understand variations of these commands. Speak naturally.
        </div>
      </DialogContent>
    </Dialog>
  )
}
