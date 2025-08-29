"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./use-auth"

interface Notification {
  id: string
  type: "friend_request" | "transaction" | "payment" | "settlement"
  title: string
  message: string
  createdAt: string
  read: boolean
}

interface RealtimeContextType {
  notifications: Notification[]
  unreadCount: number
  isOnline: boolean
  lastSync: string | null
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadNotifications()
      setupRealtimeListeners()
      setupOnlineStatusListener()
    }

    return () => {
      // Cleanup listeners
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [user])

  const loadNotifications = () => {
    if (!user) return

    const userNotifications = JSON.parse(localStorage.getItem(`udhar-notifications-${user.id}`) || "[]")
    setNotifications(userNotifications)
    setUnreadCount(userNotifications.filter((n: Notification) => !n.read).length)
  }

  const setupRealtimeListeners = () => {
    // Listen for localStorage changes across tabs
    window.addEventListener("storage", handleStorageChange)

    // Periodic sync every 30 seconds
    const syncInterval = setInterval(() => {
      syncData()
    }, 120000)

    return () => clearInterval(syncInterval)
  }

  const handleOnlineStatus = () => {
    setIsOnline(navigator.onLine)
    if (navigator.onLine) {
      syncData()
    }
  }

  const setupOnlineStatusListener = () => {
    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)
    setIsOnline(navigator.onLine)
  }

  const handleStorageChange = (e: StorageEvent) => {
    if (!user) return

    // Reload data when localStorage changes in other tabs
    if (e.key === "udhar-friend-requests" || e.key === "udhar-transactions" || e.key === "udhar-friends") {
      setLastSync(new Date().toISOString())

      // Trigger custom events to notify other hooks
      window.dispatchEvent(new CustomEvent("udhar-data-changed", { detail: { key: e.key } }))
    }

    // Reload notifications when they change
    if (e.key === `udhar-notifications-${user.id}`) {
      loadNotifications()
    }
  }

  const syncData = () => {
    if (!user) return
    setLastSync(new Date().toISOString())
    // Trigger data reload in other hooks
    window.dispatchEvent(new CustomEvent("udhar-sync-requested"))
  }

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    if (!user) return

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    }

    const userNotifications = JSON.parse(localStorage.getItem(`udhar-notifications-${user.id}`) || "[]")
    userNotifications.unshift(newNotification) // Add to beginning

    // Keep only last 50 notifications
    const trimmedNotifications = userNotifications.slice(0, 50)

    localStorage.setItem(`udhar-notifications-${user.id}`, JSON.stringify(trimmedNotifications))
    loadNotifications()

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }
  }

  const markAsRead = (notificationId: string) => {
    if (!user) return

    const userNotifications = JSON.parse(localStorage.getItem(`udhar-notifications-${user.id}`) || "[]")
    const updatedNotifications = userNotifications.map((n: Notification) =>
      n.id === notificationId ? { ...n, read: true } : n,
    )

    localStorage.setItem(`udhar-notifications-${user.id}`, JSON.stringify(updatedNotifications))
    loadNotifications()
  }

  const markAllAsRead = () => {
    if (!user) return

    const userNotifications = JSON.parse(localStorage.getItem(`udhar-notifications-${user.id}`) || "[]")
    const updatedNotifications = userNotifications.map((n: Notification) => ({ ...n, read: true }))

    localStorage.setItem(`udhar-notifications-${user.id}`, JSON.stringify(updatedNotifications))
    loadNotifications()
  }

  const clearNotifications = () => {
    if (!user) return

    localStorage.setItem(`udhar-notifications-${user.id}`, "[]")
    loadNotifications()
  }

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        isOnline,
        lastSync,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider")
  }
  return context
}
