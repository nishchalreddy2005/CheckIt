import { DirectTaskCreator } from "@/components/direct-task-creator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function QuickTaskPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link href="/dashboard">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quick Task Creation</h1>
        <p className="text-gray-500 mb-6">Create a new task quickly. It will automatically appear in your calendar.</p>
        <DirectTaskCreator />
      </div>
    </div>
  )
}
