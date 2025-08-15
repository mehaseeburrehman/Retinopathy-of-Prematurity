"use client"

import type React from "react"
import { useAuth } from "./auth-context"
import { Navigation } from "./navigation"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isHydrated } = useAuth()

  // Show loading spinner during hydration or auth operations
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{!isHydrated ? "Loading..." : "Authenticating..."}</p>
        </div>
      </div>
    )
  }

  // If no user, show children (login page)
  if (!user) {
    return <div className="min-h-screen">{children}</div>
  }

  // If user exists, show navigation + children
  return (
    <div className="min-h-screen">
      <Navigation />
      {children}
    </div>
  )
}
