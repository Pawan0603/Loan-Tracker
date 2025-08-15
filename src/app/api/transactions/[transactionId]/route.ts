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

// GET /api/transactions/[transactionId] - Get specific transaction
export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { transactionId } = params

    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Check if user is involved in this transaction
    if (transaction.fromUserId !== currentUser.id && transaction.toUserId !== currentUser.id) {
      return NextResponse.json({ error: "Not authorized to view this transaction" }, { status: 403 })
    }

    // Enrich with user details
    const fromUser = users.find((user) => user.id === transaction.fromUserId)
    const toUser = users.find((user) => user.id === transaction.toUserId)

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        fromUser: {
          id: fromUser?.id,
          name: fromUser?.name,
          email: fromUser?.email,
        },
        toUser: {
          id: toUser?.id,
          name: toUser?.name,
          email: toUser?.email,
        },
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/transactions/[transactionId] - Update transaction
export async function PUT(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { transactionId } = params
    const { amount, description } = await request.json()

    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Only the creator can edit the transaction
    if (transaction.fromUserId !== currentUser.id) {
      return NextResponse.json({ error: "Not authorized to edit this transaction" }, { status: 403 })
    }

    // Validation
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
    }

    // Update transaction
    if (amount !== undefined) {
      transaction.amount = Number.parseFloat(amount.toString())
    }
    if (description !== undefined) {
      transaction.description = description.trim()
    }
    transaction.updatedAt = new Date().toISOString()

    return NextResponse.json({
      message: "Transaction updated successfully",
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        updatedAt: transaction.updatedAt,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/transactions/[transactionId] - Delete transaction
export async function DELETE(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { transactionId } = params

    const transactionIndex = transactions.findIndex((t) => t.id === transactionId)
    if (transactionIndex === -1) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const transaction = transactions[transactionIndex]

    // Only the creator can delete the transaction
    if (transaction.fromUserId !== currentUser.id) {
      return NextResponse.json({ error: "Not authorized to delete this transaction" }, { status: 403 })
    }

    // Remove transaction
    transactions.splice(transactionIndex, 1)

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
