import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

// Simple in-memory database
const transactions: Array<{
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  type: "loan" | "payment"
  description: string
  createdAt: string
  updatedAt: string
}> = []

const users: Array<{
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}> = []

// POST /api/transactions/settle - Settle balance with a friend
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { friendId } = await request.json()

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 })
    }

    // Check if friend exists
    const friend = users.find((user) => user.id === friendId)
    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 })
    }

    // Calculate current balance
    const friendTransactions = transactions.filter(
      (transaction) =>
        (transaction.fromUserId === currentUser.id && transaction.toUserId === friendId) ||
        (transaction.fromUserId === friendId && transaction.toUserId === currentUser.id),
    )

    let balance = 0
    friendTransactions.forEach((transaction) => {
      if (transaction.type === "loan") {
        if (transaction.fromUserId === currentUser.id) {
          balance += transaction.amount
        } else {
          balance -= transaction.amount
        }
      } else if (transaction.type === "payment") {
        if (transaction.fromUserId === currentUser.id) {
          balance -= transaction.amount
        } else {
          balance += transaction.amount
        }
      }
    })

    if (Math.abs(balance) < 0.01) {
      return NextResponse.json({ error: "No outstanding balance to settle" }, { status: 400 })
    }

    // Create settlement transaction
    const settlementAmount = Math.abs(balance)
    const settlementTransaction = {
      id: Date.now().toString(),
      fromUserId: balance < 0 ? currentUser.id : friendId,
      toUserId: balance < 0 ? friendId : currentUser.id,
      amount: settlementAmount,
      type: "payment" as const,
      description: "Balance settlement",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    transactions.push(settlementTransaction)

    return NextResponse.json({
      message: "Balance settled successfully",
      settlement: {
        amount: settlementAmount,
        paidBy: balance < 0 ? currentUser.name : friend.name,
        receivedBy: balance < 0 ? friend.name : currentUser.name,
        transaction: settlementTransaction,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
