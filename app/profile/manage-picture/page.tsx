import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/app/actions/user-actions"
import Image from "next/image"
import Link from "next/link"
import { DeleteProfilePictureButton } from "@/components/delete-profile-picture-button"

export default async function ManageProfilePicturePage() {
  // Get the current user
  const user = await getCurrentUser()

  // If no user is logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // Default profile picture if none exists
  const profilePic = user.profilePicture || `/placeholder.svg?height=300&width=300`

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Profile Picture</CardTitle>
          <CardDescription>View or delete your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="h-60 w-60 rounded-full overflow-hidden border-4 border-background shadow-lg">
              <Image
                src={profilePic || "/placeholder.svg"}
                alt={`${user.name}'s profile picture`}
                width={300}
                height={300}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">{user.name}</h2>
          </div>

          <div className="flex justify-center gap-4">
            {user.profilePicture && <DeleteProfilePictureButton />}

            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
