// Admin utilities for managing users and their data

export interface UserDataSummary {
  userId: string
  email?: string
  name?: string
  predictionsCount: number
  lastActivity?: Date
}

export class AdminUtils {
  // Get all users and their data summary
  static getAllUsersData(): UserDataSummary[] {
    if (typeof window === "undefined") return []

    const users: UserDataSummary[] = []
    const keys = Object.keys(localStorage)

    // Get current user info
    const currentUserData = localStorage.getItem("retinal-ai-user")
    let currentUser = null
    if (currentUserData) {
      try {
        currentUser = JSON.parse(currentUserData)
      } catch (e) {
        console.error("Invalid current user data")
      }
    }

    // Find all prediction keys
    const predictionKeys = keys.filter((key) => key.startsWith("retinal-ai-predictions-"))

    predictionKeys.forEach((key) => {
      const userId = key.replace("retinal-ai-predictions-", "")
      const data = localStorage.getItem(key)

      if (data) {
        try {
          const predictions = JSON.parse(data)
          const lastPrediction = predictions[0]

          users.push({
            userId,
            email: currentUser?.id === userId ? currentUser.email : "Unknown",
            name: currentUser?.id === userId ? currentUser.name : "Unknown",
            predictionsCount: predictions.length,
            lastActivity: lastPrediction ? new Date(lastPrediction.timestamp) : undefined,
          })
        } catch (e) {
          console.error(`Error parsing data for user ${userId}:`, e)
        }
      }
    })

    return users.sort((a, b) => {
      if (!a.lastActivity) return 1
      if (!b.lastActivity) return -1
      return b.lastActivity.getTime() - a.lastActivity.getTime()
    })
  }

  // Delete a specific user's data
  static deleteUserData(userId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      // Remove user's predictions
      const predictionKey = `retinal-ai-predictions-${userId}`
      localStorage.removeItem(predictionKey)

      // If this is the current user, also remove their session
      const currentUserData = localStorage.getItem("retinal-ai-user")
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData)
        if (currentUser.id === userId) {
          localStorage.removeItem("retinal-ai-user")
          console.log(`🗑️ Deleted current user session for ${userId}`)
        }
      }

      console.log(`🗑️ Deleted all data for user ${userId}`)
      return true
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error)
      return false
    }
  }

  // Delete specific predictions for a user
  static deleteUserPredictions(userId: string, predictionIndices: number[]): boolean {
    if (typeof window === "undefined") return false

    try {
      const predictionKey = `retinal-ai-predictions-${userId}`
      const data = localStorage.getItem(predictionKey)

      if (!data) {
        console.log(`No predictions found for user ${userId}`)
        return false
      }

      const predictions = JSON.parse(data)

      // Remove predictions at specified indices (in reverse order to maintain indices)
      predictionIndices
        .sort((a, b) => b - a)
        .forEach((index) => {
          if (index >= 0 && index < predictions.length) {
            predictions.splice(index, 1)
          }
        })

      // Save updated predictions
      localStorage.setItem(predictionKey, JSON.stringify(predictions))
      console.log(`🗑️ Deleted ${predictionIndices.length} predictions for user ${userId}`)
      return true
    } catch (error) {
      console.error(`Error deleting predictions for user ${userId}:`, error)
      return false
    }
  }

  // Clear all app data
  static clearAllData(): boolean {
    if (typeof window === "undefined") return false

    try {
      const keys = Object.keys(localStorage)
      const appKeys = keys.filter((key) => key.startsWith("retinal-ai-"))

      appKeys.forEach((key) => {
        localStorage.removeItem(key)
      })

      console.log(`🗑️ Cleared all app data (${appKeys.length} keys):`, appKeys)
      return true
    } catch (error) {
      console.error("Error clearing all data:", error)
      return false
    }
  }

  // Export user data
  static exportUserData(userId: string): string | null {
    if (typeof window === "undefined") return null

    try {
      const predictionKey = `retinal-ai-predictions-${userId}`
      const data = localStorage.getItem(predictionKey)

      if (!data) return null

      const predictions = JSON.parse(data)
      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        predictionsCount: predictions.length,
        predictions: predictions.map((pred: any) => ({
          fileName: pred.fileName,
          topPrediction: pred.topPrediction,
          predictions: pred.predictions,
          timestamp: pred.timestamp,
        })),
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error(`Error exporting data for user ${userId}:`, error)
      return null
    }
  }

  // Get detailed info about current storage usage
  static getStorageInfo() {
    if (typeof window === "undefined") return null

    const keys = Object.keys(localStorage)
    const appKeys = keys.filter((key) => key.startsWith("retinal-ai-"))

    let totalSize = 0
    const keyInfo = appKeys.map((key) => {
      const value = localStorage.getItem(key) || ""
      const size = new Blob([value]).size
      totalSize += size

      return {
        key,
        size: `${(size / 1024).toFixed(2)} KB`,
        type: key.includes("predictions-") ? "predictions" : "user-session",
      }
    })

    return {
      totalKeys: appKeys.length,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      keys: keyInfo,
    }
  }
}

// Global functions for easy console access
if (typeof window !== "undefined") {
  ;(window as any).adminUtils =
    AdminUtils(window as any).deleteUser =
    AdminUtils.deleteUserData(window as any).clearAllData =
    AdminUtils.clearAllData(window as any).getAllUsers =
    AdminUtils.getAllUsersData(window as any).getStorageInfo =
      AdminUtils.getStorageInfo
}
