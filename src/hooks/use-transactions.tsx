"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./use-auth"
import { useFriends } from "./use-friends"
import { useRealtime } from "./use-realtime"

interface Transaction {
  id: string
  fromUser: {
    id: string
    name: string
    email: string
  }
  toUser: {
    id: string
    name: string
    email: string
  }
  amount: number
  description: string
  type: "loan" | "payment"
  createdAt: string
  updatedAt: string
}

interface Balance {
  friend: {
    id: string
    name: string
    email: string
  }
  balance: number // positive = they owe you, negative = you owe them
  status: "owes_you" | "you_owe" | "settled"
  transactionCount: number
  lastTransaction: string | null
}

interface TransactionsContextType {
  transactions: Transaction[]
  balances: Balance[]
  totalReceivable: number
  totalPayable: number
  netBalance: number
  addTransaction: (friendId: string, amount: number, description: string, type: "loan" | "payment") => Promise<void>
  settleBalance: (friendId: string) => Promise<void>
  getTransactionsWithFriend: (friendId: string) => Transaction[]
  loading: boolean
  error: string | null
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined)

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { friends } = useFriends()
  const { addNotification } = useRealtime()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [totalReceivable, setTotalReceivable] = useState(0)
  const [totalPayable, setTotalPayable] = useState(0)
  const [netBalance, setNetBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadTransactions()
      loadBalances()
      setupRealtimeListeners()
    }
  }, [user, friends])

  const setupRealtimeListeners = () => {
    const handleDataChange = () => {
      loadTransactions()
      loadBalances()
    }

    const handleSyncRequest = () => {
      loadTransactions()
      loadBalances()
    }

    window.addEventListener("udhar-data-changed", handleDataChange)
    window.addEventListener("udhar-sync-requested", handleSyncRequest)

    return () => {
      window.removeEventListener("udhar-data-changed", handleDataChange)
      window.removeEventListener("udhar-sync-requested", handleSyncRequest)
    }
  }

  const loadTransactions = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/transactions")

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load transactions")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Error loading transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadBalances = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/transactions/balances")

      if (response.ok) {
        const data = await response.json()
        setBalances(data.balances || [])
        setTotalReceivable(data.summary?.totalReceivable || 0)
        setTotalPayable(data.summary?.totalPayable || 0)
        setNetBalance(data.summary?.netBalance || 0)
      }
    } catch (error) {
      console.error("Error loading balances:", error)
    }
  }

  const addTransaction = async (friendId: string, amount: number, description: string, type: "loan" | "payment") => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          friendId,
          amount,
          description,
          type,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const friend = friends.find((f) => f.id === friendId)
        addNotification({
          type: "transaction",
          title: `${type === "loan" ? "Loan Added" : "Payment Recorded"}`,
          message: `₹${amount} ${type === "loan" ? "lent to" : "received from"} ${friend?.name || "friend"}`,
        })

        await loadTransactions()
        await loadBalances()
      } else {
        setError(data.error || "Failed to add transaction")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const settleBalance = async (friendId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/transactions/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: "settlement",
          title: "Balance Settled",
          message: data.message,
        })

        await loadTransactions()
        await loadBalances()
      } else {
        setError(data.error || "Failed to settle balance")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionsWithFriend = (friendId: string): Transaction[] => {
    return transactions.filter((t) => t.fromUser.id === friendId || t.toUser.id === friendId)
  }

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        balances,
        totalReceivable,
        totalPayable,
        netBalance,
        addTransaction,
        settleBalance,
        getTransactionsWithFriend,
        loading,
        error,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionsContext)
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionsProvider")
  }
  return context
}
