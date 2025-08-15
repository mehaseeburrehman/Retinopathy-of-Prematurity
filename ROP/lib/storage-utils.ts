// Utility functions for managing user-specific storage

export function clearAllUserData(userId: string) {
  try {
    // Clear user-specific predictions
    localStorage.removeItem(`retinal-ai-predictions-${userId}`)

    // Clear any other user-specific data
    // Add more user-specific keys here as needed

    console.log(`Cleared all data for user ${userId}`)
  } catch (error) {
    console.error("Error clearing user data:", error)
  }
}

export function migrateOldPredictions(userId: string) {
  try {
    // Check for old predictions without user ID
    const oldPredictions = localStorage.getItem("retinal-ai-predictions")
    if (oldPredictions) {
      console.log("Found old predictions, clearing them for security")
      localStorage.removeItem("retinal-ai-predictions")
    }
  } catch (error) {
    console.error("Error migrating old predictions:", error)
  }
}

export function getUserStorageKey(userId: string, dataType: string): string {
  return `retinal-ai-${dataType}-${userId}`
}
