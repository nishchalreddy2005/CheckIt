import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AdminModal } from "@/components/admin-modal"
import { Home3DPreview } from "@/components/home-3d-preview"
import { getCurrentUser } from "@/app/actions/user-actions"

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col min-h-screen text-white bg-transparent">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030014]/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span className="font-bold text-white leading-none">C</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">CheckIt</h1>
          </div>
          {user ? (
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
              <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Dashboard
              </Link>
            </nav>
          ) : (
            <nav className="ml-auto flex gap-4 sm:gap-6">
              <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Register
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-6 md:py-10 lg:py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white drop-shadow-lg">
                    Visualize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Productivity</span> in 3D
                  </h2>
                  <p className="max-w-[600px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    CheckIt transforms your tasks into an interactive 3D landscape. Watch your productivity grow as you
                    complete tasks and build your own productivity universe.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row pt-4">
                  {user ? (
                    <Link href="/dashboard">
                      <Button className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border-none">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border-none">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/demo">
                    <Button variant="outline" className="px-8 border-white/20 text-white hover:bg-white/10 bg-white/5 backdrop-blur-md">
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
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">Next-Generation Features</h2>
                <p className="max-w-[900px] text-white/60 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  TaskSphere combines powerful task management with engaging 3D visualization
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 max-w-5xl">
                <div className="glass-card flex flex-col items-center space-y-4 p-8 rounded-2xl">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
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
                      className="h-8 w-8 text-indigo-400"
                    >
                      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">3D Visualization</h3>
                  <p className="text-sm text-white/60">See your tasks come to life in an interactive 3D core</p>
                </div>
                <div className="glass-card flex flex-col items-center space-y-4 p-8 rounded-2xl">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
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
                      className="h-8 w-8 text-cyan-400"
                    >
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Progress Tracking</h3>
                  <p className="text-sm text-white/60">Watch your productivity constellation grow as you complete tasks</p>
                </div>
                <div className="glass-card flex flex-col items-center space-y-4 p-8 rounded-2xl">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
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
                      className="h-8 w-8 text-pink-400"
                    >
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18" />
                      <path d="m9 16 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Task Management</h3>
                  <p className="text-sm text-white/60">Organize, prioritize, and complete tasks with unmatched fluid ease</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 py-6 bg-[#030014]/80 backdrop-blur-md">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-sm text-white/50">© 2026 CheckIt. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <Link href="/terms" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <AdminModal />
          </div>
        </div>
      </footer>
    </div>
  )
}
