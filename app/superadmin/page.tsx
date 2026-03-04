"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { LogoutButton } from "@/components/logout-button"
import { getCurrentUser, getAllUsers, deleteUser, updateUser, suspendUser, unsuspendUser, hardDeleteUser, forceDisable2FA, getGlobalStats, exportSystemData, getDetailedSystemHealth } from "@/app/actions/user-actions"
import { getSystemSettings, updateSystemSettings } from "@/app/actions/system-actions"
import {
  getAllAdmins,
  deleteAdmin,
  updateAdmin,
  createAdmin,
  getPendingAdmins,
  approveAdmin,
  rejectAdmin,
  updateAdminSecretCode,
  getAdminSecretCode,
} from "@/app/actions/admin-actions"
import { getAuditLogs } from "@/app/actions/audit-actions"

export default function SuperadminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState<any>(null)
  const [detailedHealth, setDetailedHealth] = useState<any>(null)
  const [systemSettings, setSystemSettings] = useState({ maintenance_mode: "false", global_announcement: "" })
  const [adminSecretCode, setAdminSecretCode] = useState("")
  const [newSecretCode, setNewSecretCode] = useState("")
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editingAdmin, setEditingAdmin] = useState<any>(null)
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  const fetchData = async () => {
    try {
      const currentUser = await getCurrentUser()

      if (!currentUser || !currentUser.isSuperadmin) {
        router.push("/login")
        return
      }

      setUser(currentUser)

      // Fetch users
      const allUsers = await getAllUsers()
      setUsers(allUsers || [])

      // Fetch global stats & health
      const [stats, healthData, settingsData] = await Promise.all([
        getGlobalStats(),
        getDetailedSystemHealth(),
        getSystemSettings()
      ])

      setGlobalStats(stats)
      if (healthData?.success) setDetailedHealth(healthData.stats)
      if (settingsData?.success) setSystemSettings(settingsData.settings as any)

      // Fetch admins
      const allAdmins = await getAllAdmins()
      console.log("Fetched admins:", allAdmins)
      setAdmins(allAdmins || [])

      // Fetch pending admin requests
      const pendingRequests = await getPendingAdmins()
      console.log("Fetched pending admin requests:", pendingRequests)
      setPendingAdmins(pendingRequests || [])

      // Fetch current admin secret code
      const currentCode = await getAdminSecretCode()
      setAdminSecretCode(currentCode)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
      // Fetch audit logs
      const logs = await getAuditLogs()
      setAuditLogs(logs || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [router])

  // Handle admin secret code update
  const handleUpdateSecretCode = async () => {
    if (!newSecretCode) {
      toast({
        title: "Error",
        description: "Please enter a new secret code",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updateAdminSecretCode(newSecretCode)
      if (result.success) {
        setAdminSecretCode(newSecretCode)
        setNewSecretCode("")
        toast({
          title: "Success",
          description: "Admin secret code updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update secret code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating secret code:", error)
      toast({
        title: "Error",
        description: "Failed to update secret code",
        variant: "destructive",
      })
    }
  }

  // Handle admin creation
  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      await createAdmin(newAdmin)
      setNewAdmin({ name: "", email: "", password: "" })
      fetchData()
      toast({
        title: "Success",
        description: "Admin created successfully",
      })
    } catch (error) {
      console.error("Error creating admin:", error)
      toast({
        title: "Error",
        description: "Failed to create admin",
        variant: "destructive",
      })
    }
  }

  // Handle admin approval
  const handleApproveAdmin = async (adminId: any) => {
    try {
      const result = await approveAdmin(adminId)
      if (result.success) {
        fetchData()
        toast({
          title: "Success",
          description: "Admin approved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to approve admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error approving admin:", error)
      toast({
        title: "Error",
        description: "Failed to approve admin",
        variant: "destructive",
      })
    }
  }

  // Handle admin rejection
  const handleRejectAdmin = async (adminId: any) => {
    try {
      const result = await rejectAdmin(adminId)
      if (result.success) {
        fetchData()
        toast({
          title: "Success",
          description: "Admin request rejected",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to reject admin request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting admin:", error)
      toast({
        title: "Error",
        description: "Failed to reject admin request",
        variant: "destructive",
      })
    }
  }

  // Handle admin deletion
  const handleDeleteAdmin = async (adminId: any) => {
    try {
      await deleteAdmin(adminId)
      fetchData()
      toast({
        title: "Success",
        description: "Admin deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting admin:", error)
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  // Handle user deletion
  const handleDeleteUser = async (userId: any) => {
    try {
      await deleteUser(userId)
      fetchData()
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  // Handle admin update
  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return

    try {
      const adminData: Record<string, any> = {
        name: editingAdmin.name,
        email: editingAdmin.email,
      }

      if (editingAdmin.newPassword) {
        adminData.password = editingAdmin.newPassword
      }

      await updateAdmin(editingAdmin.id, adminData)
      setEditingAdmin(null)
      fetchData()
      toast({
        title: "Success",
        description: "Admin updated successfully",
      })
    } catch (error) {
      console.error("Error updating admin:", error)
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    try {
      const result = await exportSystemData()
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `checkit_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast({ title: "Success", description: "Data exported successfully" })
      } else {
        toast({ title: "Error", description: result.message || "Failed to export data", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" })
    }
  }

  const handleUpdateSettings = async () => {
    try {
      const result = await updateSystemSettings(systemSettings as Record<string, string>)
      if (result.success) {
        toast({ title: "Success", description: "System settings updated successfully" })
      } else {
        toast({ title: "Error", description: result.message || "Failed to update settings", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Superadmin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Logged in as <span className="font-medium text-foreground">{user?.name}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending Admin Requests</TabsTrigger>
            <TabsTrigger value="admins">Admin Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="text-xl">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-indigo-400">{globalStats?.totalUsers || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-400">{globalStats?.totalTasks || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-xl">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-emerald-400">{globalStats?.totalActiveSessions || 0}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Admin Requests</CardTitle>
                <CardDescription>Approve or reject pending admin registration requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAdmins.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No pending admin requests</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Requested</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pendingAdmins.map((admin) => (
                          <tr key={admin.id}>
                            <td className="px-4 py-3 text-sm">{admin.name}</td>
                            <td className="px-4 py-3 text-sm">{admin.email}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(Number(admin.createdAt)).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                onClick={() => handleApproveAdmin(admin.id)}
                              >
                                Approve
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRejectAdmin(admin.id)}>
                                Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>View and manage all admins in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="mb-4 text-lg font-medium">Create New Admin</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label htmlFor="admin-name">Name</Label>
                      <Input
                        id="admin-name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleCreateAdmin}>Create Admin</Button>
                    </div>
                  </div>
                </div>

                {admins.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No admins found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {admins.map((admin) => (
                          <tr key={admin.id}>
                            <td className="px-4 py-3 text-sm">{admin.name}</td>
                            <td className="px-4 py-3 text-sm">{admin.email}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(Number(admin.createdAt)).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                onClick={() => setEditingAdmin(admin)}
                              >
                                Edit
                              </Button>
                              {admin.id !== user?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the admin account.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteAdmin(admin.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {admin.id === user?.id && (
                                <span className="text-xs font-medium px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                                  You (Protected)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>Live trail of administrative actions and system updates</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No audit logs found</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{log.adminName}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.action.includes('Delete') ? 'bg-red-500/10 text-red-500' :
                                log.action.includes('Approve') ? 'bg-emerald-500/10 text-emerald-500' :
                                  'bg-indigo-500/10 text-indigo-500'
                                }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                              {log.details || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{log.ipAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Last Login</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Failed Logins</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3 text-sm">{user.name}</td>
                            <td className="px-4 py-3 text-sm">{user.email}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(Number(user.createdAt)).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {user.lastLogin ? new Date(Number(user.lastLogin)).toLocaleDateString() : "Never"}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {user.failedLoginAttempts > 0 ? <span className="text-destructive font-medium">{user.failedLoginAttempts}</span> : <span className="text-muted-foreground">0</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingUser(user)}>
                                Edit
                              </Button>
                              {user.id !== user?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the user account.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {user.id === user?.id && (
                                <span className="text-xs font-medium px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                                  You (Protected)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>Detailed System Health</CardTitle>
                <CardDescription>Live metrics of database usage and system stability</CardDescription>
              </CardHeader>
              <CardContent>
                {detailedHealth ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Server Uptime</h4>
                      <p className="text-2xl font-bold">{Math.floor(detailedHealth.uptime ?? 0 / 60)} mins</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Active Sessions</h4>
                      <p className="text-2xl font-bold">{detailedHealth.activeSessions}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Superadmins</h4>
                      <p className="text-2xl font-bold">{detailedHealth.superadmins}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Standard Admins</h4>
                      <p className="text-2xl font-bold">{detailedHealth.admins}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Suspended Users</h4>
                      <p className="text-2xl font-bold text-destructive">{detailedHealth.suspendedUsers}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Completed Tasks</h4>
                      <p className="text-2xl font-bold text-emerald-500">{detailedHealth.completedTasks}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Total Users</h4>
                      <p className="text-2xl font-bold text-indigo-500">{detailedHealth.totalUsers}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <h4 className="text-sm font-medium text-muted-foreground">Total Tasks</h4>
                      <p className="text-2xl font-bold text-purple-500">{detailedHealth.totalTasks}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Real-time metrics unavailable.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Superadmin Settings</CardTitle>
                <CardDescription>Manage system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Admin Registration Secret Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">This code is required for admin registration</p>
                    <div className="flex items-center gap-4">
                      <div className="border rounded-md px-4 py-2 bg-muted/50 flex-1">
                        {adminSecretCode || "No code set"}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="New secret code"
                          value={newSecretCode}
                          onChange={(e) => setNewSecretCode(e.target.value)}
                        />
                        <Button onClick={handleUpdateSecretCode}>Update</Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Global Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">Locks out non-admin users from accessing the application</p>
                        </div>
                        <input
                          type="checkbox"
                          id="maintenance-mode"
                          className="h-6 w-6"
                          checked={systemSettings?.maintenance_mode === "true"}
                          onChange={(e) => setSystemSettings({ ...systemSettings, maintenance_mode: e.target.checked ? "true" : "false" })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="global-announcement">Global Announcement</Label>
                        <Input
                          id="global-announcement"
                          placeholder="Display a banner to all users..."
                          value={systemSettings?.global_announcement || ""}
                          onChange={(e) => setSystemSettings({ ...systemSettings, global_announcement: e.target.value })}
                        />
                      </div>

                      <Button onClick={handleUpdateSettings}>Save Global Preferences</Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Data Management</h3>
                    <Button variant="outline" onClick={handleExportData}>Export Users & Tasks (CSV)</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="New password"
                  value={editingUser.newPassword || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium text-destructive mb-3">Advanced Danger Zone</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={editingUser.isSuspended ? "outline" : "secondary"}
                  className={editingUser.isSuspended ? "border-emerald-500 text-emerald-500" : "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30"}
                  onClick={async () => {
                    const action = editingUser.isSuspended ? unsuspendUser(editingUser.id) : suspendUser(editingUser.id);
                    const res = await action;
                    if (res.success) {
                      toast({ title: "Success", description: res.message });
                      fetchData();
                      setEditingUser(null);
                    } else {
                      toast({ title: "Error", description: res.message, variant: "destructive" });
                    }
                  }}
                >
                  {editingUser.isSuspended ? "Unsuspend User" : "Suspend User (Lock & Kick)"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  onClick={async () => {
                    const res = await forceDisable2FA(editingUser.id);
                    if (res.success) {
                      toast({ title: "Success", description: res.message });
                      fetchData();
                    } else {
                      toast({ title: "Error", description: res.message, variant: "destructive" });
                    }
                  }}
                >
                  Force Disable 2FA
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Are you ABSOLUTELY sure? This wipes all tasks, sessions, and data for this user forever!")) {
                      const res = await hardDeleteUser(editingUser.id);
                      if (res.success) {
                        toast({ title: "Wiped", description: res.message });
                        fetchData();
                        setEditingUser(null);
                      } else {
                        toast({ title: "Error", description: res.message, variant: "destructive" });
                      }
                    }
                  }}
                >
                  Hard Wipe User Data
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  try {
                    const userData: Record<string, any> = {
                      name: editingUser.name,
                      email: editingUser.email,
                    }
                    if (editingUser.newPassword) {
                      userData.password = editingUser.newPassword
                    }
                    await updateUser(editingUser.id, userData)
                    fetchData()
                    setEditingUser(null)
                    toast({
                      title: "Success",
                      description: "User updated successfully",
                    })
                  } catch (error) {
                    console.error("Error updating user:", error)
                    toast({
                      title: "Error",
                      description: "Failed to update user",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Admin Dialog */}
      {editingAdmin && (
        <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Admin</DialogTitle>
              <DialogDescription>Update admin information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-admin-name">Name</Label>
                <Input
                  id="edit-admin-name"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-admin-email">Email</Label>
                <Input
                  id="edit-admin-email"
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-admin-password">New Password (leave blank to keep current)</Label>
                <Input
                  id="edit-admin-password"
                  type="password"
                  placeholder="New password"
                  value={editingAdmin.newPassword || ""}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, newPassword: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateAdmin}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
