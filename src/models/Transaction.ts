import mongoose, { type Document, Schema } from "mongoose"

export interface ITransaction extends Document {
  _id: string
  from: mongoose.Types.ObjectId
  to: mongoose.Types.ObjectId
  amount: number
  description: string
  type: "loan" | "payment"
  status: "pending" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "From user is required"],
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "To user is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: "Amount must be a valid positive number",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    type: {
      type: String,
      enum: ["loan", "payment"],
      required: [true, "Transaction type is required"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for better query performance
TransactionSchema.index({ from: 1, createdAt: -1 })
TransactionSchema.index({ to: 1, createdAt: -1 })
TransactionSchema.index({ from: 1, to: 1, createdAt: -1 })
TransactionSchema.index({ type: 1, status: 1 })

// Prevent users from creating transactions with themselves
TransactionSchema.pre("save", function (next) {
  if (this.from.equals(this.to)) {
    next(new Error("Cannot create transaction with yourself"))
  } else {
    next()
  }
})

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
