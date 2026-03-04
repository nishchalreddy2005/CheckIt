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
  searchParams: Promise<{ tab?: string }>
}) {
  // Get the current user
  const user = await getCurrentUser()

  // If no user is logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // Determine which tab to show
  const params = await searchParams
  const activeTab = params.tab || "account"

  return (
    <div className="flex min-h-screen flex-col text-white bg-transparent">
      <ProfileHeader user={user} />

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="relative py-6 lg:gap-10 lg:py-8">
          <div className="mx-auto min-w-0">
            <Tabs defaultValue={activeTab} className="space-y-4">
              <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                <TabsTrigger value="account" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Account</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Security</TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-indigo-500/50 data-[state=active]:text-white text-white/60 rounded-lg transition-all">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-4">
                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-white drop-shadow-md">Account Settings</CardTitle>
                    <CardDescription className="text-white/60">Manage your account preferences and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountSettings user={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-white drop-shadow-md">Security Settings</CardTitle>
                    <CardDescription className="text-white/60">Manage your security settings and two-factor authentication</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SecuritySettings user={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-white drop-shadow-md">Calendar Settings</CardTitle>
                    <CardDescription className="text-white/60">Customize your calendar appearance and behavior</CardDescription>
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
