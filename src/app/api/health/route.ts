import { NextResponse } from "next/server"
import { systemHealthCheck } from "@/lib/sync-verification"

export async function GET() {
  try {
    const healthStatus = await systemHealthCheck()

    return NextResponse.json({
      status: "healthy",
      ...healthStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
