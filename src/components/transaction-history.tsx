"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTransactions } from "@/hooks/use-transactions"
import { useAuth } from "@/hooks/use-auth"
import { History, ArrowUpRight, ArrowDownLeft, Handshake } from "lucide-react"

export function TransactionHistory() {
  const { transactions, balances, settleBalance } = useTransactions()
  const { user } = useAuth()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (transaction: any, isUserSender: boolean) => {
    if (transaction.type === "loan") {
      return isUserSender ? (
        <ArrowUpRight className="h-4 w-4 text-green-600" />
      ) : (
        <ArrowDownLeft className="h-4 w-4 text-red-600" />
      )
    } else {
      return isUserSender ? (
        <ArrowUpRight className="h-4 w-4 text-blue-600" />
      ) : (
        <ArrowDownLeft className="h-4 w-4 text-green-600" />
      )
    }
  }

  const getTransactionText = (transaction: any, isUserSender: boolean) => {
    if (transaction.type === "loan") {
      return isUserSender
        ? `You lent ₹${transaction.amount} to ${transaction.toUserName}`
        : `You borrowed ₹${transaction.amount} from ${transaction.fromUserName}`
    } else {
      return isUserSender
        ? `You paid ₹${transaction.amount} to ${transaction.toUserName}`
        : `You received ₹${transaction.amount} from ${transaction.fromUserName}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Outstanding Balances */}
      {balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Outstanding Balances
            </CardTitle>
            <CardDescription>Current balances with your friends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balances
                .filter((balance) => Math.abs(balance.amount) > 0.01)
                .map((balance) => (
                  <div key={balance.friendId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{balance.friendName}</p>
                      <p className="text-sm text-gray-500">
                        {balance.amount > 0
                          ? `Owes you ₹${balance.amount.toFixed(2)}`
                          : `You owe ₹${Math.abs(balance.amount).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={balance.amount > 0 ? "default" : "destructive"}>
                        {balance.amount > 0
                          ? `+₹${balance.amount.toFixed(2)}`
                          : `-₹${Math.abs(balance.amount).toFixed(2)}`}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => settleBalance(balance.friendId)}>
                        Settle
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>All your loan and payment activities</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet. Start by adding a loan or payment!</p>
          ) : (
            <div className="space-y-3">
              {transactions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((transaction) => {
                  const isUserSender = transaction.fromUserId === user?.id
                  return (
                    <div key={transaction.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-1">{getTransactionIcon(transaction, isUserSender)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{getTransactionText(transaction, isUserSender)}</p>
                        <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <Badge variant={transaction.type === "loan" ? "default" : "secondary"}>
                        {transaction.type === "loan" ? "Loan" : "Payment"}
                      </Badge>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
