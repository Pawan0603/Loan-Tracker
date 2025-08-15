import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Friend from "@/models/Friend"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/friends - Get user's friends list
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    // Get all accepted friendships where current user is involved
    const friendships = await Friend.find({
      $or: [
        { requester: currentUser._id, status: "accepted" },
        { recipient: currentUser._id, status: "accepted" },
      ],
    }).populate("requester recipient", "name email")

    // Format friends list
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requester._id.toString() === currentUser._id.toString() ? friendship.recipient : friendship.requester

      return {
        id: friend._id,
        name: friend.name,
        email: friend.email,
        friendshipId: friendship._id,
        connectedAt: friendship.updatedAt,
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error("Get friends error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/friends - Send friend request
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await connectDB()

    // Find target user
    const targetUser = await User.findOne({ email: email.toLowerCase() })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 })
    }

    // Check if friendship or request already exists
    const existingRelation = await Friend.findOne({
      $or: [
        { requester: currentUser._id, recipient: targetUser._id },
        { requester: targetUser._id, recipient: currentUser._id },
      ],
    })

    if (existingRelation) {
      if (existingRelation.status === "accepted") {
        return NextResponse.json({ error: "Already friends with this user" }, { status: 409 })
      } else if (existingRelation.status === "pending") {
        return NextResponse.json({ error: "Friend request already exists" }, { status: 409 })
      }
    }

    // Create friend request
    const newRequest = new Friend({
      requester: currentUser._id,
      recipient: targetUser._id,
      status: "pending",
    })

    await newRequest.save()
    await newRequest.populate("recipient", "name email")

    return NextResponse.json({
      message: "Friend request sent successfully",
      request: {
        id: newRequest._id,
        toUser: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
        },
        status: newRequest.status,
        createdAt: newRequest.createdAt,
      },
    })
  } catch (error) {
    console.error("Send friend request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
