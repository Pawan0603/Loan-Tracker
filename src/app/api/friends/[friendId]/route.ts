import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Friend from "@/models/Friend"
import { getCurrentUser } from "@/lib/auth-utils"

// DELETE /api/friends/[friendId] - Remove friend
export async function DELETE(request: NextRequest, { params }: { params: { friendId: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { friendId } = params

    await connectDB()

    // Find and remove the friendship (accepted friend relationship)
    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: currentUser._id, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: currentUser._id, status: "accepted" },
      ],
    })

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Friend removed successfully" })
  } catch (error) {
    console.error("Remove friend error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
