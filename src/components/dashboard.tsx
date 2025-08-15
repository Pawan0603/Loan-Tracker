"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useTransactions } from "@/hooks/use-transactions"
import { FriendsSection } from "@/components/friends-section"
import { AddTransaction } from "@/components/add-transaction"
import { TransactionHistory } from "@/components/transaction-history"
import { NotificationsPanel } from "@/components/notifications-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { Home, Users, History, Plus } from "lucide-react"

export function Dashboard() {
  const { user, logout } = useAuth()
  const { totalReceivable, totalPayable, netBalance, transactions } = useTransactions()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground">Manage your loans and track your finances</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <ThemeToggle />
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">You'll Receive</CardTitle>
                  <CardDescription>Money others owe you</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{totalReceivable.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">You Owe</CardTitle>
                  <CardDescription>Money you owe others</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{totalPayable.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle
                    className={`${netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    Net Balance
                  </CardTitle>
                  <CardDescription>Your overall balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {netBalance >= 0 ? "+" : ""}₹{netBalance.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest loan activities</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No transactions yet. Add friends and start recording loans!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((transaction) => {
                        const isUserSender = transaction.fromUserId === user?.id
                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {transaction.type === "loan"
                                  ? isUserSender
                                    ? `Lent to ${transaction.toUserName}`
                                    : `Borrowed from ${transaction.fromUserName}`
                                  : isUserSender
                                    ? `Paid to ${transaction.toUserName}`
                                    : `Received from ${transaction.fromUserName}`}
                              </p>
                              <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            </div>
                            <p className="font-bold">₹{transaction.amount}</p>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <AddTransaction />
          </TabsContent>

          <TabsContent value="friends">
            <FriendsSection />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
