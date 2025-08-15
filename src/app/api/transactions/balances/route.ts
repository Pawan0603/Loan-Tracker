import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
import Friend from "@/models/Friend"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/transactions/balances - Get balances with all friends
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    // Get all accepted friendships
    const friendships = await Friend.find({
      $or: [
        { requester: currentUser._id, status: "accepted" },
        { recipient: currentUser._id, status: "accepted" },
      ],
    }).populate("requester recipient", "name email")

    // Extract friend IDs and details
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requester._id.toString() === currentUser._id.toString() ? friendship.recipient : friendship.requester

      return {
        id: friend._id,
        name: friend.name,
        email: friend.email,
      }
    })

    // Calculate balances with each friend
    const balances = await Promise.all(
      friends.map(async (friend) => {
        // Get transactions between current user and this friend
        const friendTransactions = await Transaction.find({
          $or: [
            { from: currentUser._id, to: friend.id },
            { from: friend.id, to: currentUser._id },
          ],
          status: "completed",
        }).sort({ createdAt: -1 })

        let balance = 0

        friendTransactions.forEach((transaction) => {
          if (transaction.type === "loan") {
            // If current user lent money, they should receive it back
            if (transaction.from.toString() === currentUser._id.toString()) {
              balance += transaction.amount
            } else {
              balance -= transaction.amount
            }
          } else if (transaction.type === "payment") {
            // If current user made payment, reduce what they owe
            if (transaction.from.toString() === currentUser._id.toString()) {
              balance -= transaction.amount
            } else {
              balance += transaction.amount
            }
          }
        })

        return {
          friend: {
            id: friend.id,
            name: friend.name,
            email: friend.email,
          },
          balance: Math.round(balance * 100) / 100, // Round to 2 decimal places
          status: balance > 0 ? "owes_you" : balance < 0 ? "you_owe" : "settled",
          transactionCount: friendTransactions.length,
          lastTransaction: friendTransactions.length > 0 ? friendTransactions[0].createdAt : null,
        }
      }),
    )

    // Calculate summary
    const totalReceivable = balances.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0)
    const totalPayable = balances.reduce((sum, b) => sum + (b.balance < 0 ? Math.abs(b.balance) : 0), 0)
    const netBalance = totalReceivable - totalPayable

    return NextResponse.json({
      balances,
      summary: {
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        totalPayable: Math.round(totalPayable * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Get balances error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
