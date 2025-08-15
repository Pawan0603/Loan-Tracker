import mongoose, { type Document, Schema } from "mongoose"

export interface IFriend extends Document {
  _id: string
  requester: mongoose.Types.ObjectId
  recipient: mongoose.Types.ObjectId
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt: Date
}

const FriendSchema = new Schema<IFriend>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester is required"],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

// Ensure unique friend relationships
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true })

// Create compound indexes for better query performance
FriendSchema.index({ requester: 1, status: 1 })
FriendSchema.index({ recipient: 1, status: 1 })

// Prevent users from sending friend requests to themselves
FriendSchema.pre("save", function (next) {
  if (this.requester.equals(this.recipient)) {
    next(new Error("Cannot send friend request to yourself"))
  } else {
    next()
  }
})

export default mongoose.models.Friend || mongoose.model<IFriend>("Friend", FriendSchema)
