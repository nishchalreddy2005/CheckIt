import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileHeader } from "@/components/profile-header"
import { DashboardNav } from "@/components/dashboard-nav"
import { getCurrentUser } from "@/app/actions/user-actions"
import { AccountSettings } from "@/components/settings/account-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { CalendarSettings } from "@/components/settings/calendar-settings"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  // Get the current user
  const user = await getCurrentUser()

  // If no user is logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // Determine which tab to show
  const activeTab = searchParams.tab || "account"

  return (
    <div className="flex min-h-screen flex-col">
      <ProfileHeader user={user} />

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="relative py-6 lg:gap-10 lg:py-8">
          <div className="mx-auto min-w-0">
            <Tabs defaultValue={activeTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountSettings user={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your security settings and two-factor authentication</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SecuritySettings user={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar Settings</CardTitle>
                    <CardDescription>Customize your calendar appearance and behavior</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CalendarSettings user={user} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
