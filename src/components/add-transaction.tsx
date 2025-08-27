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
import { PlusCircle, Upload, X, ImageIcon } from "lucide-react"

export function AddTransaction() {
  const { friends } = useFriends()
  const { addTransaction } = useTransactions()
  const [selectedFriend, setSelectedFriend] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"loan" | "payment">("loan")
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("cash")
  const [proofImage, setProofImage] = useState("")
  const [imagePreview, setImagePreview] = useState("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a blob URL for preview
      const blobUrl = URL.createObjectURL(file)
      setImagePreview(blobUrl)
      // In a real app, you'd upload to a service like Vercel Blob
      // For now, we'll use a placeholder URL
      setProofImage(`https://example.com/uploads/${file.name}`)
    }
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview("")
    setProofImage("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFriend && amount && description) {
      addTransaction(
        selectedFriend,
        Number.parseFloat(amount),
        description,
        type,
        paymentMethod,
        proofImage || undefined,
      )
      setSelectedFriend("")
      setAmount("")
      setDescription("")
      setType("loan")
      setPaymentMethod("cash")
      removeImage()
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: "online" | "cash") => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="proofImage">Transaction Proof (Optional)</Label>
            <div className="space-y-3">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload a screenshot or photo as proof</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Transaction proof preview"
                      className="h-16 w-16 object-cover rounded border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Image uploaded</p>
                      <p className="text-xs text-muted-foreground">Transaction proof attached</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
