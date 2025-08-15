import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Friend from "@/models/Friend"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/friends/requests - Get pending friend requests
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    // Get pending requests sent to current user (incoming)
    const incomingRequests = await Friend.find({
      recipient: currentUser._id,
      status: "pending",
    }).populate("requester", "name email")

    // Get pending requests sent by current user (outgoing)
    const outgoingRequests = await Friend.find({
      requester: currentUser._id,
      status: "pending",
    }).populate("recipient", "name email")

    // Format incoming requests
    const formattedIncoming = incomingRequests.map((request) => ({
      id: request._id,
      fromUser: {
        id: request.requester._id,
        name: request.requester.name,
        email: request.requester.email,
      },
      createdAt: request.createdAt,
    }))

    // Format outgoing requests
    const formattedOutgoing = outgoingRequests.map((request) => ({
      id: request._id,
      toUser: {
        id: request.recipient._id,
        name: request.recipient.name,
        email: request.recipient.email,
      },
      createdAt: request.createdAt,
    }))

    return NextResponse.json({
      incoming: formattedIncoming,
      outgoing: formattedOutgoing,
    })
  } catch (error) {
    console.error("Get friend requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
