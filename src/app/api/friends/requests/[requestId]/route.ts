import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Friend from "@/models/Friend"
import { getCurrentUser } from "@/lib/auth-utils"

// PUT /api/friends/requests/[requestId] - Accept or reject friend request
export async function PUT(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { action } = await request.json() // "accept" or "reject"
    const { requestId } = params

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'accept' or 'reject'" }, { status: 400 })
    }

    await connectDB()

    // Find the friend request
    const friendRequest = await Friend.findById(requestId)
    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Check if current user is the recipient
    if (friendRequest.recipient.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: "Not authorized to respond to this request" }, { status: 403 })
    }

    if (friendRequest.status !== "pending") {
      return NextResponse.json({ error: "Friend request already processed" }, { status: 409 })
    }

    // Update request status
    friendRequest.status = action === "accept" ? "accepted" : "rejected"
    await friendRequest.save()

    return NextResponse.json({
      message: `Friend request ${action}ed successfully`,
      status: friendRequest.status,
    })
  } catch (error) {
    console.error("Update friend request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/friends/requests/[requestId] - Cancel friend request
export async function DELETE(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { requestId } = params

    await connectDB()

    // Find the friend request
    const friendRequest = await Friend.findById(requestId)
    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Check if current user is the sender
    if (friendRequest.requester.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: "Not authorized to cancel this request" }, { status: 403 })
    }

    if (friendRequest.status !== "pending") {
      return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 409 })
    }

    // Remove the request
    await Friend.findByIdAndDelete(requestId)

    return NextResponse.json({ message: "Friend request cancelled successfully" })
  } catch (error) {
    console.error("Cancel friend request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
