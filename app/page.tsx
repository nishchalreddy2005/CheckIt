import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AdminModal } from "@/components/admin-modal"
import { Home3DPreview } from "@/components/home-3d-preview"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight">CheckIt</h1>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-sm font-medium hover:underline">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-6 md:py-10 lg:py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Visualize Your Productivity in 3D</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    CheckIt transforms your tasks into an interactive 3D landscape. Watch your productivity grow as you
                    complete tasks and build your own productivity universe.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button className="px-8">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button variant="outline" className="px-8">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[500px] aspect-square rounded-xl shadow-lg overflow-hidden">
                <Home3DPreview />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Key Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  TaskSphere combines powerful task management with engaging 3D visualization
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 max-w-4xl">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-purple-600"
                    >
                      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">3D Visualization</h3>
                  <p className="text-sm text-gray-500">See your tasks come to life in an interactive 3D environment</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-purple-600"
                    >
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Progress Tracking</h3>
                  <p className="text-sm text-gray-500">Watch your productivity landscape grow as you complete tasks</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-purple-600"
                    >
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18" />
                      <path d="m9 16 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Task Management</h3>
                  <p className="text-sm text-gray-500">Organize, prioritize, and complete tasks with ease</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-sm text-gray-500">© 2025 CheckIt. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <Link href="/terms" className="text-sm font-medium hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm font-medium hover:underline">
              Privacy Policy
            </Link>
            <AdminModal />
          </div>
        </div>
      </footer>
    </div>
  )
}
