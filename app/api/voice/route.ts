import { type NextRequest, NextResponse } from "next/server"
import { getTasks } from "@/app/actions/task-actions"
import { createTask } from "@/app/actions/task-actions-create"
import { deleteTask, toggleTaskCompletion } from "@/app/actions/task-actions"
import nlp from "compromise"
import natural from "natural"

// Initialize the Intent Classifier
const classifier = new natural.BayesClassifier()

// Training data for our NLP model
classifier.addDocument("create a new task", "create_task")
classifier.addDocument("add task", "create_task")
classifier.addDocument("remind me to", "create_task")
classifier.addDocument("i need to", "create_task")
classifier.addDocument("make a task", "create_task")

classifier.addDocument("delete task", "delete_task")
classifier.addDocument("remove task", "delete_task")
classifier.addDocument("cancel task", "delete_task")
classifier.addDocument("erase", "delete_task")
classifier.addDocument("wipe out", "delete_task")

classifier.addDocument("complete task", "toggle_task")
classifier.addDocument("mark task as done", "toggle_task")
classifier.addDocument("finish task", "toggle_task")
classifier.addDocument("i finished", "toggle_task")
classifier.addDocument("completed", "toggle_task")

classifier.addDocument("what are my tasks", "get_tasks")
classifier.addDocument("show me my tasks", "get_tasks")
classifier.addDocument("list tasks", "get_tasks")

classifier.addDocument("go to calendar", "navigate")
classifier.addDocument("open settings", "navigate")
classifier.addDocument("show me dashboard", "navigate")

classifier.train()

export async function POST(request: NextRequest) {
    try {
        const { transcript } = await request.json()

        // 1. Identify Intent using Natural
        let intent = classifier.classify(transcript.toLowerCase())

        // 2. Extract Entities using Compromise
        const doc = nlp(transcript)
        // @ts-ignore
        const dates = doc.dates().json()

        // 3. Find task title based on remainder after verbs/keywords
        let targetTask = transcript
            .replace(/(create|add|remind me to|i need to|delete|remove|cancel|erase|complete|mark as done|finish|task)/gi, '')
            .replace(/tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi, '')
            .replace(/at \d+(am|pm)?/gi, '')
            .replace(/for \d+(am|pm)?/gi, '')
            .trim()

        let actionData: any = {}
        let responseMessage = "I understood your request."

        if (intent === "create_task") {
            if (!targetTask) {
                return NextResponse.json({ response: { action: "respond", responseMessage: "What would you like to call the task?" } })
            }

            const formData = new FormData()
            formData.append("title", targetTask)
            formData.append("description", "")

            // Parse date if Compromise found one
            if (dates && dates.length > 0) {
                let parsedDate = new Date()
                try {
                    // naive parsing from compromise
                    parsedDate = new Date(dates[0].dates.start || dates[0].text || Date.now())
                } catch (e) { }
                if (isNaN(parsedDate.getTime())) parsedDate = new Date()
                formData.append("dueDate", parsedDate.toISOString())
                responseMessage = `I've created the task "${targetTask}" for ${parsedDate.toLocaleDateString()}.`
            } else {
                formData.append("dueDate", new Date().toISOString())
                responseMessage = `I've created the task "${targetTask}".`
            }
            formData.append("category", "Work")
            formData.append("priority", "medium")

            await createTask(formData)

        } else if (intent === "delete_task") {
            if (!targetTask) return NextResponse.json({ response: { action: "respond", responseMessage: "Which task do you want to delete?" } })

            const tasksL = await getTasks()
            // fuzzy match title
            const foundTask = tasksL.find((t: any) => t.title.toLowerCase().includes(targetTask.toLowerCase()))

            if (foundTask) {
                const fd = new FormData(); fd.append("id", foundTask.id)
                await deleteTask(fd)
                responseMessage = `I deleted the task "${foundTask.title}".`
            } else {
                responseMessage = `I couldn't find a task matching "${targetTask}".`
                intent = "respond"
            }
            actionData = { id: foundTask?.id }

        } else if (intent === "toggle_task") {
            if (!targetTask) return NextResponse.json({ response: { action: "respond", responseMessage: "Which task did you finish?" } })

            const tasksL = await getTasks()
            const foundTask = tasksL.find((t: any) => t.title.toLowerCase().includes(targetTask.toLowerCase()))

            if (foundTask) {
                const fd = new FormData(); fd.append("id", foundTask.id)
                await toggleTaskCompletion(fd)
                responseMessage = `I've marked "${foundTask.title}" as complete. Great job!`
            } else {
                responseMessage = `I couldn't find a task matching "${targetTask}".`
                intent = "respond"
            }
            actionData = { id: foundTask?.id }

        } else if (intent === "get_tasks") {
            const tasksL = await getTasks()
            const pending = tasksL.filter((t: any) => !t.completed).length
            responseMessage = `You currently have ${pending} pending tasks on your list.`

        } else if (intent === "navigate") {
            if (transcript.toLowerCase().includes("calendar")) {
                actionData = { path: "/calendar" }
                responseMessage = "Opening your calendar."
            } else if (transcript.toLowerCase().includes("settings") || transcript.toLowerCase().includes("profile")) {
                actionData = { path: "/settings" }
                responseMessage = "Opening your settings."
            } else {
                actionData = { path: "/dashboard" }
                responseMessage = "Going to the dashboard."
            }
        }

        return NextResponse.json({
            response: {
                action: intent,
                actionData: actionData,
                responseMessage: responseMessage
            }
        })
    } catch (error) {
        console.error("NLP Error:", error)
        return NextResponse.json({ response: { action: "respond", responseMessage: "I encountered a processing error while analyzing your voice." } })
    }
}
