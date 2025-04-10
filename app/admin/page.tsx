"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { getAllUsers, deleteUser, updateUser, createUser, getCurrentUser } from "@/app/actions/user-actions"
import { LogoutButton } from "@/components/logout-button"

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  async function checkAdminAndLoadUsers() {
    try {
      console.log("Admin page: Checking current user")
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        console.log("Admin page: No current user found")
        toast({
          title: "Access Denied",
          description: "You must be logged in as an admin to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!currentUser.isAdmin) {
        console.log("Admin page: User is not an admin")
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      console.log("Admin page: Admin verified, loading users")
      try {
        const allUsers = await getAllUsers()
        console.log(`Admin page: Loaded ${allUsers.length} users`)
        setUsers(allUsers)
      } catch (usersError) {
        console.error("Admin page: Error loading users:", usersError)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        })
        setUsers([])
      }
    } catch (error) {
      console.error("Admin page: Error checking admin status:", error)
      toast({
        title: "Error",
        description: "Failed to verify admin status. Please try again.",
        variant: "destructive",
      })
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAdminAndLoadUsers()
  }, [router])

  const handleEditUser = (user) => {
    setEditUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteUser = (user) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleAddUser = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
    })
    setIsAddDialogOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      const result = await updateUser(editUser.id, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditDialogOpen(false)
        // Refresh user list
        checkAdminAndLoadUsers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteUser(userToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        // Refresh user list
        checkAdminAndLoadUsers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      // Create FormData object for the createUser function
      const formDataObj = new FormData()
      const nameParts = formData.name.split(" ")
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

      formDataObj.append("email", formData.email)
      formDataObj.append("first-name", firstName)
      formDataObj.append("last-name", lastName)
      formDataObj.append("password", formData.password)
      formDataObj.append("confirm-password", formData.password)

      const result = await createUser(formDataObj)
      if (result.success) {
        toast({
          title: "Success",
          description: "User created successfully",
        })
        setIsAddDialogOpen(false)
        // Refresh user list
        checkAdminAndLoadUsers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Button onClick={handleAddUser}>Add User</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Created At</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="px-4 py-2">{user.name}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{new Date(Number(user.createdAt)).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No users found. Add a user to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (leave blank to keep current)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input id="add-name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
