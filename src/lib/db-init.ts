import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Friend from "@/models/Friend"
import Transaction from "@/models/Transaction"

// Initialize database connection and ensure indexes
export async function initializeDatabase() {
  try {
    await connectDB()

    // Ensure all models are registered and indexes are created
    await User.init()
    await Friend.init()
    await Transaction.init()

    console.log("✅ Database initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    await connectDB()
    return { connected: true, message: "Database connected successfully" }
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}
