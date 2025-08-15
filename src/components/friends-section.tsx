"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useFriends } from "@/hooks/use-friends"
import { UserPlus, Users, Mail, Check, X, Trash2 } from "lucide-react"

export function FriendsSection() {
  const { friends, friendRequests, sentRequests, addFriend, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriends()
  const [newFriendEmail, setNewFriendEmail] = useState("")

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFriendEmail.trim()) {
      addFriend(newFriendEmail.trim())
      setNewFriendEmail("")
    }
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
          <CardDescription>People you can lend money to or borrow from</CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No friends yet. Add some friends to start tracking loans!</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{friend.name}</p>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFriend(friend.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
