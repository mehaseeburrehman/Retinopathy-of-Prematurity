// Debug utilities for checking user data isolation

export function debugUserData() {
  if (typeof window === "undefined") return

  console.log("🔍 Debug: Checking localStorage data...")

  // Get all localStorage keys
  const keys = Object.keys(localStorage)

  // Filter for our app's keys
  const appKeys = keys.filter((key) => key.startsWith("retinal-ai-"))

  console.log("📊 Found app data keys:", appKeys)

  // Show current user
  const currentUser = localStorage.getItem("retinal-ai-user")
  if (currentUser) {
    const user = JSON.parse(currentUser)
    console.log("👤 Current user:", user.email, `(ID: ${user.id})`)
  } else {
    console.log("👤 No current user")
  }

  // Show all user prediction keys
  const predictionKeys = appKeys.filter((key) => key.includes("predictions-"))
  console.log("📈 User prediction keys:", predictionKeys)

  predictionKeys.forEach((key) => {
    const data = localStorage.getItem(key)
    if (data) {
      const predictions = JSON.parse(data)
      const userId = key.split("predictions-")[1]
      console.log(`📊 User ${userId}: ${predictions.length} predictions`)
    }
  })
}

export function clearAllAppData() {
  if (typeof window === "undefined") return

  const keys = Object.keys(localStorage)
  const appKeys = keys.filter((key) => key.startsWith("retinal-ai-"))

  appKeys.forEach((key) => {
    localStorage.removeItem(key)
  })

  console.log("🗑️ Cleared all app data:", appKeys)
}
