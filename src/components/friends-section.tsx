"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useFriends } from "@/hooks/use-friends"
import { useTransactions } from "@/hooks/use-transactions"
import { useAuth } from "@/hooks/use-auth"
import { TransactionHistory } from "@/components/transaction-history"
import { UserPlus, Users, Mail, Check, X, Trash2, ArrowLeft, User, Clock } from "lucide-react"

interface Friend {
  id: string
  name: string
  email: string
}

export function FriendsSection() {
  const { user } = useAuth()
  const { friends, friendRequests, sentRequests, addFriend, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriends()
  const { transactions, balances } = useTransactions()
  const [newFriendEmail, setNewFriendEmail] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFriendEmail.trim()) {
      addFriend(newFriendEmail.trim())
      setNewFriendEmail("")
    }
  }

  const getFriendBalance = (friendId: string) => {
    const balance = balances.find((b) => b.friend.id === friendId)
    return balance?.balance || 0
  }

  const getPendingTransactions = (friendId: string) => {
    return transactions.filter((transaction) => {
      const isWithFriend = transaction.fromUser.id === friendId || transaction.toUser.id === friendId
      const isPending = transaction.status === "pending"
      return isWithFriend && isPending
    })
  }

  if (selectedFriend) {
    const balance = getFriendBalance(selectedFriend.id)
    const pendingTransactions = getPendingTransactions(selectedFriend.id)

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFriend(null)} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle>{selectedFriend.name}</CardTitle>
                <CardDescription>{selectedFriend.email}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  removeFriend(selectedFriend.id)
                  setSelectedFriend(null)
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Friend
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p
                      className={`text-2xl font-bold ${
                        balance > 0
                          ? "text-green-600 dark:text-green-400"
                          : balance < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {balance >= 0 ? "+" : ""}₹{balance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {balance > 0 && "They owe you"}
                      {balance < 0 && "You owe them"}
                      {balance === 0 && "All settled"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">
                      {
                        transactions.filter(
                          (t) => t.fromUser.id === selectedFriend.id || t.toUser.id === selectedFriend.id,
                        ).length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pending Items</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {pendingTransactions.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {pendingTransactions.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Transactions
                  </CardTitle>
                  <CardDescription>Transactions awaiting completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingTransactions.map((transaction) => {
                      const isUserSender = transaction.fromUser.id === user?.id
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20"
                        >
                          <div>
                            <p className="font-medium">
                              {transaction.type === "loan"
                                ? isUserSender
                                  ? `You lent ₹${transaction.amount}`
                                  : `You borrowed ₹${transaction.amount}`
                                : isUserSender
                                  ? `You paid ₹${transaction.amount}`
                                  : `You received ₹${transaction.amount}`}
                            </p>
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.paymentMethod} • {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Pending
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All transactions with {selectedFriend.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionHistory friendId={selectedFriend.id} />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Friend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Friend
          </CardTitle>
          <CardDescription>Send a friend request by email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFriend} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="friend-email" className="sr-only">
                Friend's Email
              </Label>
              <Input
                id="friend-email"
                type="email"
                placeholder="Enter friend's email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Send Request</Button>
          </form>
        </CardContent>
      </Card>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Friend Requests
              <Badge variant="secondary">{friendRequests.length}</Badge>
            </CardTitle>
            <CardDescription>People who want to be your friend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.fromUserName}</p>
                    <p className="text-sm text-gray-500">{request.fromUserEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectFriendRequest(request.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sent Requests
              <Badge variant="outline">{sentRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Friend requests you've sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Request sent</p>
                    <p className="text-sm text-gray-500">Waiting for response</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Friends
            <Badge variant="secondary">{friends.length}</Badge>
          </CardTitle>
          <CardDescription>Click on any friend to view details and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No friends yet. Add some friends to start tracking loans!</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => {
                const balance = getFriendBalance(friend.id)
                const pendingCount = getPendingTransactions(friend.id).length

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                        {pendingCount > 0 && (
                          <p className="text-xs text-orange-600 dark:text-orange-400">
                            {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          balance > 0
                            ? "text-green-600 dark:text-green-400"
                            : balance < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {balance >= 0 ? "+" : ""}₹{balance.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {balance > 0 && "owes you"}
                        {balance < 0 && "you owe"}
                        {balance === 0 && "settled"}
                      </p>
                    </div>
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
