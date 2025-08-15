import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const result = await AuthService.signup({ name, email, password })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      user: result.user,
      message: "Account created successfully",
    })
  } catch (error) {
    console.error("Signup API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
