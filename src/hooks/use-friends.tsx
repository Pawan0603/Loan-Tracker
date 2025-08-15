"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./use-auth"
import { useRealtime } from "./use-realtime"

interface Friend {
  id: string
  name: string
  email: string
  status: "accepted" | "pending" | "sent"
  friendshipId?: string
  connectedAt?: string
}

interface FriendRequest {
  id: string
  fromUser?: {
    id: string
    name: string
    email: string
  }
  toUser?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface FriendsContextType {
  friends: Friend[]
  friendRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  addFriend: (email: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  rejectFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  loading: boolean
  error: string | null
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { addNotification } = useRealtime()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadFriendsData()
      setupRealtimeListeners()
    }
  }, [user])

  const setupRealtimeListeners = () => {
    const handleDataChange = () => {
      loadFriendsData()
    }

    const handleSyncRequest = () => {
      loadFriendsData()
    }

    window.addEventListener("udhar-data-changed", handleDataChange)
    window.addEventListener("udhar-sync-requested", handleSyncRequest)

    return () => {
      window.removeEventListener("udhar-data-changed", handleDataChange)
      window.removeEventListener("udhar-sync-requested", handleSyncRequest)
    }
  }

  const loadFriendsData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
      ])

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json()
        const friendsList = friendsData.friends.map((friend: any) => ({
          id: friend.id,
          name: friend.name,
          email: friend.email,
          status: "accepted" as const,
          friendshipId: friend.friendshipId,
          connectedAt: friend.connectedAt,
        }))
        setFriends(friendsList)
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setFriendRequests(requestsData.incoming || [])
        setSentRequests(requestsData.outgoing || [])
      }
    } catch (error) {
      setError("Failed to load friends data")
      console.error("Error loading friends data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addFriend = async (email: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: "friend_request",
          title: "Friend Request Sent",
          message: data.message,
        })
        await loadFriendsData()
      } else {
        setError(data.error || "Failed to send friend request")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "accept" }),
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: "friend_request",
          title: "Friend Added",
          message: data.message,
        })
        await loadFriendsData()
      } else {
        setError(data.error || "Failed to accept friend request")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      })

      const data = await response.json()

      if (response.ok) {
        await loadFriendsData()
      } else {
        setError(data.error || "Failed to reject friend request")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: "friend_request",
          title: "Friend Removed",
          message: data.message,
        })
        await loadFriendsData()
      } else {
        setError(data.error || "Failed to remove friend")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FriendsContext.Provider
      value={{
        friends,
        friendRequests,
        sentRequests,
        addFriend,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        loading,
        error,
      }}
    >
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends() {
  const context = useContext(FriendsContext)
  if (context === undefined) {
    throw new Error("useFriends must be used within a FriendsProvider")
  }
  return context
}
