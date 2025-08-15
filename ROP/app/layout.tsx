import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./auth-context"
import { PredictionsProvider } from "./predictions-context"
import AppLayout from "./app-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RetinalAI - ROP Classification",
  description: "AI-powered retinal image analysis for ROP classification",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PredictionsProvider>
            <AppLayout>{children}</AppLayout>
          </PredictionsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
