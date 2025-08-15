export { getCurrentUser, type IUser as User } from "@/lib/auth-utils"
export { default as connectDB } from "@/lib/mongodb"

// Legacy compatibility - redirect to new auth utilities
export function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
  }
}
