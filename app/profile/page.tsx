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
  searchParams: { verified?: string; tab?: string }
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

    // Determine which tab to show
    const activeTab = searchParams.tab || "profile"

    // Check if email was just verified
    const justVerified = searchParams.verified === "true"

    return (
      <div className="flex min-h-screen flex-col">
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
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>Manage your public profile information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <ProfilePictureSection user={user} />
                        <div className="text-center mt-2">
                          <Link href="/profile/manage-picture" className="text-sm text-primary hover:underline">
                            Manage profile picture
                          </Link>
                        </div>
                      </div>
                      <ProfileForm user={user} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="account" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account</CardTitle>
                      <CardDescription>Manage your account settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">Email</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.emailVerified && (
                          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">Member Since</h3>
                        <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="pt-4 border-t mt-6">
                        <DeleteAccount />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Change your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChangePassword />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TwoFactorSetup user={user} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity</CardTitle>
                      <CardDescription>Your task activity and statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-4 w-4 text-muted-foreground"
                            >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.taskCount}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-4 w-4 text-muted-foreground"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.completedTasks}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              className="h-4 w-4 text-muted-foreground"
                            >
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <path d="M2 10h20" />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {stats.taskCount > 0 ? Math.round((stats.completedTasks / stats.taskCount) * 100) : 0}%
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">Categories</h3>
                        <div className="space-y-1">
                          {stats.categories.length > 0 ? (
                            stats.categories.map((category) => (
                              <div key={category} className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                                <span>{category}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No categories yet</p>
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
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="mb-4">We encountered an error loading your profile.</p>
        <a href="/dashboard" className="text-primary hover:underline">
          Return to Dashboard
        </a>
      </div>
    )
  }
}
