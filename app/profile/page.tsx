import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/app/actions/user-actions"
import { getUserStats } from "@/app/actions/profile-actions"
import { ProfileForm } from "@/components/profile-form"
import { ProfileHeader } from "@/components/profile-header"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChangePassword } from "@/components/change-password"
import { DeleteAccount } from "@/components/delete-account"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import Link from "next/link"
import { ProfilePictureSection } from "@/components/profile-picture-section"

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; tab?: string }>
}) {
  try {
    // Get the current user
    const user = await getCurrentUser()

    // If no user is logged in, redirect to login page
    if (!user) {
      console.log("No user found in profile page, redirecting to login")
      redirect("/login")
    }

    // Get user stats
    const stats = await getUserStats(user.id)

    const params = await searchParams

    // Determine which tab to show
    const activeTab = params.tab || "profile"

    // Check if email was just verified
    const justVerified = params.verified === "true"

    return (
      <div className="flex min-h-screen flex-col text-white bg-transparent">
        <ProfileHeader user={user} />

        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
            <DashboardNav />
          </aside>
          <main className="relative py-6 lg:gap-10 lg:py-8">
            <div className="mx-auto min-w-0">
              {justVerified && (
                <Alert className="mb-4">
                  <AlertDescription>Your email has been successfully verified.</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue={activeTab} className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                  <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Profile</TabsTrigger>
                  <TabsTrigger value="account" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Account</TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Activity</TabsTrigger>
                  <TabsTrigger value="security" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                  <Card className="glass-card border-none">
                    <CardHeader>
                      <CardTitle className="text-white drop-shadow-md">Profile</CardTitle>
                      <CardDescription className="text-white/60">Manage your public profile information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <ProfilePictureSection user={user} />
                        <div className="text-center mt-2">
                          <Link href="/profile/manage-picture" className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                            Manage profile picture
                          </Link>
                        </div>
                      </div>
                      <ProfileForm user={user} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="account" className="space-y-4">
                  <Card className="glass-card border-none">
                    <CardHeader>
                      <CardTitle className="text-white drop-shadow-md">Account</CardTitle>
                      <CardDescription className="text-white/60">Manage your account settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium text-white/90">Email</h3>
                        <p className="text-sm text-white/60">{user.email}</p>
                        {user.emailVerified && (
                          <span className="inline-block px-2 py-1 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium text-white/90">Member Since</h3>
                        <p className="text-sm text-white/60">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="pt-4 border-t border-white/10 mt-6">
                        <DeleteAccount />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <Card className="glass-card border-none">
                    <CardHeader>
                      <CardTitle className="text-white drop-shadow-md">Password</CardTitle>
                      <CardDescription className="text-white/60">Change your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChangePassword />
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-none">
                    <CardHeader>
                      <CardTitle className="text-white drop-shadow-md">Two-Factor Authentication</CardTitle>
                      <CardDescription className="text-white/60">Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TwoFactorSetup user={user} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <Card className="glass-card border-none">
                    <CardHeader>
                      <CardTitle className="text-white drop-shadow-md">Activity</CardTitle>
                      <CardDescription className="text-white/60">Your task activity and statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-white/5 border border-white/10 rounded-2xl">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">Total Tasks</CardTitle>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-extrabold text-white drop-shadow-md">{stats.taskCount}</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border border-white/10 rounded-2xl">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">Completed Tasks</CardTitle>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-extrabold text-emerald-300 drop-shadow-md">{stats.completedTasks}</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border border-white/10 rounded-2xl">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">Completion Rate</CardTitle>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            >
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <path d="M2 10h20" />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-md">
                              {stats.taskCount > 0 ? Math.round((stats.completedTasks / stats.taskCount) * 100) : 0}%
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-lg font-bold mb-3 text-white drop-shadow-md">Categories</h3>
                        <div className="space-y-3">
                          {stats.categories.length > 0 ? (
                            stats.categories.map((category) => (
                              <div key={category} className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-indigo-500 mr-3 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                <span className="text-white/80 font-medium">{category}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-white/50 italic">No categories yet</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in profile page:", error)
    // Return a simple error UI instead of failing completely
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030014] text-white">
        <h1 className="text-2xl font-bold mb-4 drop-shadow-md text-pink-400">Something went wrong</h1>
        <p className="mb-4 text-white/70">We encountered an error loading your profile.</p>
        <a href="/dashboard" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors mt-4">
          Return to Dashboard
        </a>
      </div>
    )
  }
}
