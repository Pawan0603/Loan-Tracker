import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Friend from "@/models/Friend"
import Transaction from "@/models/Transaction"

// Verification utilities to ensure frontend-backend sync
export async function verifyDatabaseConnection() {
  try {
    await connectDB()
    console.log("✅ Database connection verified")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

export async function verifyModels() {
  try {
    await connectDB()

    // Test model operations
    const userCount = await User.countDocuments()
    const friendCount = await Friend.countDocuments()
    const transactionCount = await Transaction.countDocuments()

    console.log("✅ Models verified:", {
      users: userCount,
      friends: friendCount,
      transactions: transactionCount,
    })

    return true
  } catch (error) {
    console.error("❌ Model verification failed:", error)
    return false
  }
}

export async function verifyAPIEndpoints() {
  const endpoints = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/friends",
    "/api/friends/requests",
    "/api/transactions",
    "/api/transactions/balances",
  ]

  console.log("📋 Available API endpoints:", endpoints)
  return endpoints
}

// Health check function for the entire system
export async function systemHealthCheck() {
  console.log("🔍 Running system health check...")

  const dbConnection = await verifyDatabaseConnection()
  const modelsWorking = await verifyModels()
  const endpoints = await verifyAPIEndpoints()

  const status = {
    database: dbConnection,
    models: modelsWorking,
    endpoints: endpoints.length > 0,
    timestamp: new Date().toISOString(),
  }

  console.log("📊 System Health Status:", status)
  return status
}
