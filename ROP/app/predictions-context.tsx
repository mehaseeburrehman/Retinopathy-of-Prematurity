"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

interface Prediction {
  class: string
  confidence: number
}

interface PredictionResult {
  predictions: Prediction[]
  topPrediction: Prediction
  timestamp: Date
  imageUrl?: string
  fileName?: string
  userId: string // Add user ID to predictions
}

interface PredictionsContextType {
  predictions: PredictionResult[]
  addPrediction: (prediction: Omit<PredictionResult, "userId">) => void
  clearPredictions: () => void
  isLoading: boolean
}

const PredictionsContext = createContext<PredictionsContextType | undefined>(undefined)

export function PredictionsProvider({ children }: { children: React.ReactNode }) {
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading, isHydrated } = useAuth()

  useEffect(() => {
    // Wait for auth to finish loading and hydration
    if (!isHydrated || authLoading) {
      return
    }

    // If no user, clear predictions and stop loading
    if (!user) {
      setPredictions([])
      setIsLoading(false)
      return
    }

    // Load user-specific predictions
    const loadUserPredictions = () => {
      try {
        const userStorageKey = `retinal-ai-predictions-${user.id}`
        const stored = localStorage.getItem(userStorageKey)

        if (stored) {
          const parsedPredictions = JSON.parse(stored)
            .filter((p: any) => p.userId === user.id) // Double-check user ID
            .map((p: any) => ({
              ...p,
              timestamp: new Date(p.timestamp),
            }))

          console.log(`✅ Loaded ${parsedPredictions.length} predictions for user ${user.email}`)
          setPredictions(parsedPredictions)
        } else {
          console.log(`📝 No existing predictions found for user ${user.email}`)
          setPredictions([])
        }
      } catch (error) {
        console.error("Error loading predictions from localStorage:", error)
        // Clear corrupted data for this user only
        const userStorageKey = `retinal-ai-predictions-${user.id}`
        localStorage.removeItem(userStorageKey)
        setPredictions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadUserPredictions()
  }, [user, authLoading, isHydrated])

  const addPrediction = (prediction: Omit<PredictionResult, "userId">) => {
    if (!user) {
      console.warn("Cannot add prediction: no user logged in")
      return
    }

    const predictionWithUser: PredictionResult = {
      ...prediction,
      userId: user.id,
    }

    const newPredictions = [predictionWithUser, ...predictions]
    setPredictions(newPredictions)

    try {
      const userStorageKey = `retinal-ai-predictions-${user.id}`
      localStorage.setItem(userStorageKey, JSON.stringify(newPredictions))
      console.log(`💾 Saved prediction for user ${user.email} (${newPredictions.length} total)`)
    } catch (error) {
      console.error("Error saving predictions to localStorage:", error)
    }
  }

  const clearPredictions = () => {
    if (!user) {
      console.warn("Cannot clear predictions: no user logged in")
      return
    }

    setPredictions([])
    try {
      const userStorageKey = `retinal-ai-predictions-${user.id}`
      localStorage.removeItem(userStorageKey)
      console.log(`🗑️ Cleared all predictions for user ${user.email}`)
    } catch (error) {
      console.error("Error clearing predictions from localStorage:", error)
    }
  }

  return (
    <PredictionsContext.Provider value={{ predictions, addPrediction, clearPredictions, isLoading }}>
      {children}
    </PredictionsContext.Provider>
  )
}

export function usePredictions() {
  const context = useContext(PredictionsContext)
  if (context === undefined) {
    throw new Error("usePredictions must be used within a PredictionsProvider")
  }
  return context
}
