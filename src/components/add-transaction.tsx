"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFriends } from "@/hooks/use-friends"
import { useTransactions } from "@/hooks/use-transactions"
import { PlusCircle } from "lucide-react"

export function AddTransaction() {
  const { friends } = useFriends()
  const { addTransaction } = useTransactions()
  const [selectedFriend, setSelectedFriend] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"loan" | "payment">("loan")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFriend && amount && description) {
      addTransaction(selectedFriend, Number.parseFloat(amount), description, type)
      setSelectedFriend("")
      setAmount("")
      setDescription("")
      setType("loan")
    }
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Transaction
          </CardTitle>
          <CardDescription>Record a loan or payment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">You need to add friends first before recording transactions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add Transaction
        </CardTitle>
        <CardDescription>Record a loan or payment with a friend</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="friend">Friend</Label>
              <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a friend" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map((friend) => (
                    <SelectItem key={friend.id} value={friend.id}>
                      {friend.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select value={type} onValueChange={(value: "loan" | "payment") => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loan">I lent money</SelectItem>
                  <SelectItem value="payment">I received payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What was this for? (e.g., dinner, movie tickets, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
