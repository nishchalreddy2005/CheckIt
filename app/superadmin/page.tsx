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
import { getCurrentUser, getAllUsers, deleteUser, updateUser } from "@/app/actions/user-actions"
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

export default function SuperadminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])
  const [pendingAdmins, setPendingAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminSecretCode, setAdminSecretCode] = useState("")
  const [newSecretCode, setNewSecretCode] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
  })

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
  const handleApproveAdmin = async (adminId) => {
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
  const handleRejectAdmin = async (adminId) => {
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
  const handleDeleteAdmin = async (adminId) => {
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
  const handleDeleteUser = async (userId) => {
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
      const adminData = {
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
            <TabsTrigger value="pending">Pending Admin Requests</TabsTrigger>
            <TabsTrigger value="admins">Admin Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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
                            <td className="px-4 py-3 text-sm text-right">
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingUser(user)}>
                                Edit
                              </Button>
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Superadmin Settings</CardTitle>
                <CardDescription>Manage system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
            <DialogFooter>
              <Button
                onClick={async () => {
                  try {
                    const userData = {
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
