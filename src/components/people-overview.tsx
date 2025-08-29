"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTransactions } from "@/hooks/use-transactions"
import { useAuth } from "@/hooks/use-auth"
import { TransactionHistory } from "@/components/transaction-history"
import { ArrowLeft, User } from "lucide-react"

interface PersonBalance {
  id: string
  name: string
  email: string
  balance: number // positive means they owe you, negative means you owe them
  transactionCount: number
}

export function PeopleOverview() {
  const { user } = useAuth()
  const { transactions } = useTransactions()
  const [selectedPerson, setSelectedPerson] = useState<PersonBalance | null>(null)

  // Calculate balances for each person
  const peopleBalances: PersonBalance[] = transactions.reduce((acc: PersonBalance[], transaction) => {
    const isUserSender = transaction.fromUser.id === user?.id
    const otherPersonId = isUserSender ? transaction.toUser.id : transaction.fromUser.id
    const otherPersonName = isUserSender ? transaction.toUser.name : transaction.fromUser.name
    const otherPersonEmail = isUserSender ? transaction.toUser.email : transaction.fromUser.email

    // Find existing person or create new one
    let person = acc.find((p) => p.id === otherPersonId)
    if (!person) {
      person = {
        id: otherPersonId,
        name: otherPersonName,
        email: otherPersonEmail,
        balance: 0,
        transactionCount: 0,
      }
      acc.push(person)
    }

    // Calculate balance change
    let balanceChange = 0
    if (transaction.type === "loan") {
      // If user lent money, they should receive it back (positive balance)
      // If user borrowed money, they owe it (negative balance)
      balanceChange = isUserSender ? transaction.amount : -transaction.amount
    } else if (transaction.type === "payment") {
      // If user paid, it reduces what they owe (positive balance change)
      // If user received payment, it reduces what others owe them (negative balance change)
      balanceChange = isUserSender ? -transaction.amount : transaction.amount
    }

    person.balance += balanceChange
    person.transactionCount += 1

    return acc
  }, [])

  // Sort by absolute balance amount (highest first)
  peopleBalances.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))

  useEffect(() => {
    console.log("selectedPerson", selectedPerson)
  }, [selectedPerson]);

  if (selectedPerson) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedPerson(null)} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Transactions with {selectedPerson.name}</CardTitle>
              <CardDescription>
                Balance: {selectedPerson.balance >= 0 ? "+" : ""}₹{selectedPerson.balance.toFixed(2)}
                {selectedPerson.balance > 0 && " (they owe you)"}
                {selectedPerson.balance < 0 && " (you owe them)"}
                {selectedPerson.balance === 0 && " (settled)"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionHistory friendId={selectedPerson.id} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>People Overview</CardTitle>
        <CardDescription>Your financial relationships with friends</CardDescription>
      </CardHeader>
      <CardContent>
        {peopleBalances.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No financial relationships yet. Add friends and start recording transactions!
          </p>
        ) : (
          <div className="space-y-3">
            {peopleBalances.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedPerson(person)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.transactionCount} transaction{person.transactionCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      person.balance > 0
                        ? "text-green-600 dark:text-green-400"
                        : person.balance < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {person.balance >= 0 ? "+" : ""}₹{person.balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {person.balance > 0 && "owes you"}
                    {person.balance < 0 && "you owe"}
                    {person.balance === 0 && "settled"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
