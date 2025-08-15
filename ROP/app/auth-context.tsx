"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Handle hydration and check for stored user
    const checkAuth = () => {
      try {
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("retinal-ai-user")
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            // Validate stored user data
            if (userData && userData.id && userData.email && userData.name) {
              setUser(userData)
            } else {
              // Invalid stored data, clear it
              localStorage.removeItem("retinal-ai-user")
            }
          }
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error)
        // Clear corrupted data
        if (typeof window !== "undefined") {
          localStorage.removeItem("retinal-ai-user")
        }
      } finally {
        setIsHydrated(true)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Login failed" }
      }

      setUser(data.user)
      if (typeof window !== "undefined") {
        localStorage.setItem("retinal-ai-user", JSON.stringify(data.user))
      }
      router.push("/dashboard")

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Signup failed" }
      }

      setUser(data.user)
      if (typeof window !== "undefined") {
        localStorage.setItem("retinal-ai-user", JSON.stringify(data.user))
      }
      router.push("/dashboard")

      return { success: true }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: "Network error. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // FIXED: Only clear the current user session, NOT their data
    // Each user's predictions should persist in their own localStorage key

    // Clear user state
    setUser(null)

    if (typeof window !== "undefined") {
      // Only remove the current user session
      localStorage.removeItem("retinal-ai-user")

      // DO NOT clear user-specific predictions - they should persist!
      // Each user has their own key: `retinal-ai-predictions-${userId}`
      // This data should remain for when they log back in

      // Only clear legacy predictions storage (if any)
      localStorage.removeItem("retinal-ai-predictions")
    }

    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, isHydrated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
