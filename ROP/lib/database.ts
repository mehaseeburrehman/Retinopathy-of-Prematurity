import Database from "better-sqlite3"
import bcrypt from "bcryptjs"
import path from "path"

export interface User {
  id: string
  email: string
  name: string
  password?: string
  createdAt: Date
}

export interface PredictionRecord {
  id: string
  userId: string
  fileName: string
  predictions: string // JSON string
  topPrediction: string // JSON string
  imageUrl?: string
  createdAt: Date
}

class DatabaseService {
  private db: Database.Database

  constructor() {
    // Create database file in project root
    const dbPath = path.join(process.cwd(), "retinal-ai.db")
    this.db = new Database(dbPath)

    // Enable WAL mode for better performance
    this.db.pragma("journal_mode = WAL")

    this.initTables()
    console.log(`✅ SQLite database initialized at: ${dbPath}`)
  }

  private initTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Predictions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        predictions TEXT NOT NULL,
        top_prediction TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `)

    console.log("📊 Database tables initialized")
  }

  // User methods
  async createUser(
    name: string,
    email: string,
    password: string,
  ): Promise<{ user: User; success: boolean; error?: string }> {
    try {
      // Check if user exists
      const existingUser = this.getUserByEmail(email)
      if (existingUser) {
        return { user: null as any, success: false, error: "User already exists with this email" }
      }

      // Validate input
      if (!name.trim()) {
        return { user: null as any, success: false, error: "Name is required" }
      }

      if (!email.includes("@")) {
        return { user: null as any, success: false, error: "Invalid email address" }
      }

      if (password.length < 6) {
        return { user: null as any, success: false, error: "Password must be at least 6 characters" }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Insert user
      const stmt = this.db.prepare(`
        INSERT INTO users (id, email, name, password)
        VALUES (?, ?, ?, ?)
      `)

      stmt.run(userId, email.toLowerCase(), name.trim(), hashedPassword)

      // Return user without password
      const user: User = {
        id: userId,
        email: email.toLowerCase(),
        name: name.trim(),
        createdAt: new Date(),
      }

      console.log(`✅ User created: ${email}`)
      return { user, success: true }
    } catch (error) {
      console.error("Create user error:", error)
      return { user: null as any, success: false, error: "Failed to create account" }
    }
  }

  async loginUser(email: string, password: string): Promise<{ user: User; success: boolean; error?: string }> {
    try {
      // Find user
      const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?")
      const dbUser = stmt.get(email.toLowerCase()) as any

      if (!dbUser) {
        return { user: null as any, success: false, error: "Invalid email or password" }
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, dbUser.password)
      if (!isValidPassword) {
        return { user: null as any, success: false, error: "Invalid email or password" }
      }

      // Return user without password
      const user: User = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        createdAt: new Date(dbUser.created_at),
      }

      console.log(`✅ User logged in: ${email}`)
      return { user, success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { user: null as any, success: false, error: "Login failed" }
    }
  }

  getUserByEmail(email: string): User | null {
    try {
      const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?")
      const dbUser = stmt.get(email.toLowerCase()) as any

      if (!dbUser) return null

      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        createdAt: new Date(dbUser.created_at),
      }
    } catch (error) {
      console.error("Get user by email error:", error)
      return null
    }
  }

  getUserById(id: string): User | null {
    try {
      const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?")
      const dbUser = stmt.get(id) as any

      if (!dbUser) return null

      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        createdAt: new Date(dbUser.created_at),
      }
    } catch (error) {
      console.error("Get user by ID error:", error)
      return null
    }
  }

  // Prediction methods
  savePrediction(userId: string, fileName: string, predictions: any[], topPrediction: any, imageUrl?: string): string {
    try {
      const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const stmt = this.db.prepare(`
        INSERT INTO predictions (id, user_id, file_name, predictions, top_prediction, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        predictionId,
        userId,
        fileName,
        JSON.stringify(predictions),
        JSON.stringify(topPrediction),
        imageUrl || null,
      )

      console.log(`✅ Prediction saved for user ${userId}`)
      return predictionId
    } catch (error) {
      console.error("Save prediction error:", error)
      throw new Error("Failed to save prediction")
    }
  }

  getUserPredictions(userId: string): PredictionRecord[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM predictions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `)

      const dbPredictions = stmt.all(userId) as any[]

      return dbPredictions.map((pred) => ({
        id: pred.id,
        userId: pred.user_id,
        fileName: pred.file_name,
        predictions: JSON.parse(pred.predictions),
        topPrediction: JSON.parse(pred.top_prediction),
        imageUrl: pred.image_url,
        createdAt: new Date(pred.created_at),
      }))
    } catch (error) {
      console.error("Get user predictions error:", error)
      return []
    }
  }

  // Stats methods
  getUserStats(userId: string) {
    try {
      const totalStmt = this.db.prepare("SELECT COUNT(*) as count FROM predictions WHERE user_id = ?")
      const total = (totalStmt.get(userId) as any).count

      const healthyStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM predictions 
        WHERE user_id = ? AND JSON_EXTRACT(top_prediction, '$.class') = 'Healthy'
      `)
      const healthy = (healthyStmt.get(userId) as any).count

      const ropStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM predictions 
        WHERE user_id = ? AND JSON_EXTRACT(top_prediction, '$.class') != 'Healthy'
      `)
      const rop = (ropStmt.get(userId) as any).count

      return { total, healthy, rop }
    } catch (error) {
      console.error("Get user stats error:", error)
      return { total: 0, healthy: 0, rop: 0 }
    }
  }

  // Admin methods (for development)
  getAllUsers(): User[] {
    try {
      const stmt = this.db.prepare("SELECT id, email, name, created_at FROM users ORDER BY created_at DESC")
      const users = stmt.all() as any[]

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date(user.created_at),
      }))
    } catch (error) {
      console.error("Get all users error:", error)
      return []
    }
  }

  close() {
    this.db.close()
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService()
  }
  return dbInstance
}

export default DatabaseService
