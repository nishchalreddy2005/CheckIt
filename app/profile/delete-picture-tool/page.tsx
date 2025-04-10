import { redirect } from "next/navigation"
import { getRobustCurrentUser } from "@/app/actions/user-actions-robust"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { SimpleDeleteButton } from "@/components/simple-delete-button"

export default async function DeletePictureToolPage() {
  try {
    // Get the current user with robust error handling
    const user = await getRobustCurrentUser()

    // If no user is logged in, redirect to login page
    if (!user) {
      redirect("/login")
    }

    // Default profile picture if none exists
    const profilePic = user.profilePicture || `/placeholder.svg?height=200&width=200`

    return (
      <div className="container max-w-md mx-auto py-8 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture Deletion Tool</CardTitle>
            <CardDescription>This tool helps you delete your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-background shadow-lg">
                <Image
                  src={profilePic || "/placeholder.svg"}
                  alt={`${user.name}'s profile picture`}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold">{user.name}</h2>
              {user.profilePicture ? (
                <p className="text-sm text-green-600">You have a profile picture</p>
              ) : (
                <p className="text-sm text-gray-500">You don't have a profile picture</p>
              )}
            </div>

            {user.profilePicture && <SimpleDeleteButton />}
          </CardContent>
        </Card>

        <Link href="/profile">
          <Button variant="outline" className="w-full">
            Back to Profile
          </Button>
        </Link>
      </div>
    )
  } catch (error) {
    console.error("Error in DeletePictureToolPage:", error)

    // Show error page
    return (
      <div className="container max-w-md mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>There was an error loading this page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-500">{error instanceof Error ? error.message : "An unexpected error occurred"}</p>
            <Link href="/profile">
              <Button variant="outline" className="w-full">
                Back to Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
}
