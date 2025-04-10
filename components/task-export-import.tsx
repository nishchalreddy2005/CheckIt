"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Upload, AlertCircle, Check } from "lucide-react"
import type { Task } from "@/lib/types"
import { importTasks } from "@/app/actions/task-actions"

interface TaskExportImportProps {
  tasks: Task[]
  onImportComplete: () => void
}

export function TaskExportImport({ tasks, onImportComplete }: TaskExportImportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [importedTasks, setImportedTasks] = useState<Task[]>([])
  const [isImporting, setIsImporting] = useState(false)

  // Handle export
  const handleExport = () => {
    try {
      // Create a JSON string of the tasks
      const tasksJson = JSON.stringify(tasks, null, 2)

      // Create a blob and download link
      const blob = new Blob([tasksJson], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      // Set up the download
      link.href = url
      link.download = `tasks-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)

      // Trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export tasks:", error)
    }
  }

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    setImportSuccess(null)
    setImportedTasks([])

    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/json") {
      setImportError("Please select a JSON file")
      return
    }

    setImportFile(file)

    // Read the file to preview the tasks
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsedTasks = JSON.parse(content)

        if (!Array.isArray(parsedTasks)) {
          setImportError("Invalid file format. Expected an array of tasks.")
          return
        }

        // Validate the tasks
        const validTasks = parsedTasks.filter((task) => task.title && task.dueDate && task.category && task.priority)

        if (validTasks.length === 0) {
          setImportError("No valid tasks found in the file")
          return
        }

        setImportedTasks(validTasks)
        setImportSuccess(`Found ${validTasks.length} tasks to import`)
      } catch (error) {
        console.error("Failed to parse JSON:", error)
        setImportError("Failed to parse the file. Please ensure it's a valid JSON file.")
      }
    }

    reader.readAsText(file)
  }

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!importFile || importedTasks.length === 0) return

    setIsImporting(true)

    try {
      const fileContent = await importFile.text()
      const result = await importTasks(fileContent)

      if (result.success) {
        setImportSuccess(`Successfully imported ${result.count} tasks`)
        setImportDialogOpen(false)
        setConfirmDialogOpen(false)
        onImportComplete()
      } else {
        setImportError(result.message || "Failed to import tasks")
      }
    } catch (error) {
      console.error("Failed to import tasks:", error)
      setImportError("An error occurred while importing tasks")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleExport}
          disabled={tasks.length === 0}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Tasks</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select a JSON file containing tasks to import. The file should contain an array of task objects.
                </p>

                <Input type="file" accept=".json" onChange={handleFileChange} className="cursor-pointer" />
              </div>

              {importError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              {importSuccess && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">{importSuccess}</AlertDescription>
                </Alert>
              )}

              {importedTasks.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium">Preview:</p>
                  <ul className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {importedTasks.slice(0, 5).map((task, index) => (
                      <li key={index} className="py-1 border-b last:border-0">
                        {task.title} - {task.category} ({task.priority})
                      </li>
                    ))}
                    {importedTasks.length > 5 && (
                      <li className="py-1 text-muted-foreground">...and {importedTasks.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmDialogOpen(true)} disabled={importedTasks.length === 0 || !!importError}>
                Import Tasks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will import {importedTasks.length} tasks. Duplicate tasks may be created if they have the same
                title and due date.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImportConfirm} disabled={isImporting}>
                {isImporting ? "Importing..." : "Import"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
