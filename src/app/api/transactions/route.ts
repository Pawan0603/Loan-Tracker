import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
import User from "@/models/User"
import Friend from "@/models/Friend"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/transactions - Get user's transaction history
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get("friendId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    await connectDB()

    // Build query for transactions involving current user
    let query: any = {
      $or: [{ from: currentUser._id }, { to: currentUser._id }],
    }

    // Filter by friend if specified
    if (friendId) {
      query = {
        $or: [
          { from: currentUser._id, to: friendId },
          { from: friendId, to: currentUser._id },
        ],
      }
    }

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    // Get total count for pagination
    const total = await Transaction.countDocuments(query)

    // Format response
    const enrichedTransactions = transactions.map((transaction) => ({
      id: transaction._id,
      fromUser: {
        id: transaction.from._id,
        name: transaction.from.name,
        email: transaction.from.email,
      },
      toUser: {
        id: transaction.to._id,
        name: transaction.to.name,
        email: transaction.to.email,
      },
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod,
      proofImage: transaction.proofImage,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }))

    return NextResponse.json({
      transactions: enrichedTransactions,
      total,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { friendId, amount, type, description, paymentMethod, proofImage } = await request.json()

    // Validation
    if (!friendId || !amount || !type || !description || !paymentMethod) {
      return NextResponse.json(
        { error: "Friend, amount, type, description, and payment method are required" },
        { status: 400 },
      )
    }

    if (!["loan", "payment"].includes(type)) {
      return NextResponse.json({ error: "Type must be 'loan' or 'payment'" }, { status: 400 })
    }

    if (!["online", "cash"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Payment method must be 'online' or 'cash'" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
    }

    if (friendId === currentUser._id.toString()) {
      return NextResponse.json({ error: "Cannot create transaction with yourself" }, { status: 400 })
    }

    if (proofImage && typeof proofImage === "string" && proofImage.trim()) {
      const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i
      if (!imageUrlPattern.test(proofImage.trim())) {
        return NextResponse.json({ error: "Proof image must be a valid image URL" }, { status: 400 })
      }
    }

    await connectDB()

    // Check if friend exists and is actually a friend
    const friend = await User.findById(friendId)
    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 })
    }

    // Verify friendship exists
    const friendship = await Friend.findOne({
      $or: [
        { requester: currentUser._id, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: currentUser._id, status: "accepted" },
      ],
    })

    if (!friendship) {
      return NextResponse.json({ error: "You can only create transactions with friends" }, { status: 403 })
    }

    // Create transaction
    const newTransaction = new Transaction({
      from: currentUser._id,
      to: friendId,
      amount: Number.parseFloat(amount.toString()),
      type: type as "loan" | "payment",
      description: description.trim(),
      paymentMethod: paymentMethod as "online" | "cash",
      proofImage: proofImage && typeof proofImage === "string" ? proofImage.trim() : undefined,
      status: "completed",
    })

    await newTransaction.save()
    await newTransaction.populate("from to", "name email")

    return NextResponse.json({
      message: "Transaction created successfully",
      transaction: {
        id: newTransaction._id,
        fromUser: {
          id: newTransaction.from._id,
          name: newTransaction.from.name,
          email: newTransaction.from.email,
        },
        toUser: {
          id: newTransaction.to._id,
          name: newTransaction.to.name,
          email: newTransaction.to.email,
        },
        amount: newTransaction.amount,
        type: newTransaction.type,
        description: newTransaction.description,
        paymentMethod: newTransaction.paymentMethod,
        proofImage: newTransaction.proofImage,
        status: newTransaction.status,
        createdAt: newTransaction.createdAt,
        updatedAt: newTransaction.updatedAt,
      },
    })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
