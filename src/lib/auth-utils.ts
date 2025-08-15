import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server"
import User, { type IUser } from "@/models/User"
import connectDB from "@/lib/mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(request: NextRequest): Promise<IUser | null> {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    await connectDB()
    const user = await User.findById(decoded.userId).select("-password")
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export function createAuthResponse(user: IUser, token: string) {
  const response = new Response(
    JSON.stringify({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  )

  // Set HTTP-only cookie
  response.headers.set(
    "Set-Cookie",
    `auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  )

  return response
}
