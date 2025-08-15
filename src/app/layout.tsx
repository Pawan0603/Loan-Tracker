import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { RealtimeProvider } from "@/hooks/use-realtime"
import { FriendsProvider } from "@/hooks/use-friends"
import { TransactionsProvider } from "@/hooks/use-transactions"
import { ThemeProvider } from "next-themes"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider>
          <RealtimeProvider>
            <FriendsProvider>
              <TransactionsProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                  {children}
                </ThemeProvider>
              </TransactionsProvider>
            </FriendsProvider>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
