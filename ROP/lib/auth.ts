import { getDatabase } from "./database"

export interface User {
  id: string
  email: string
  name: string
  password?: string
  createdAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
}

export class AuthService {
  static async signup(credentials: SignupCredentials): Promise<{ user: User; success: boolean; error?: string }> {
    const db = getDatabase()
    return await db.createUser(credentials.name, credentials.email, credentials.password)
  }

  static async login(credentials: LoginCredentials): Promise<{ user: User; success: boolean; error?: string }> {
    const db = getDatabase()
    return await db.loginUser(credentials.email, credentials.password)
  }

  static async getUserById(id: string): Promise<User | null> {
    const db = getDatabase()
    return db.getUserById(id)
  }

  // For development - get all users
  static getAllUsers(): User[] {
    const db = getDatabase()
    return db.getAllUsers()
  }
}
