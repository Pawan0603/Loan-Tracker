import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Create response and clear the auth cookie
    const response = NextResponse.json({ message: "Logged out successfully" })

    // Clear HTTP-only cookie
    response.headers.set(
      "Set-Cookie",
      `auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    )

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
