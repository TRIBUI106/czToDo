import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Registration attempt started")
    
    const { name, email, password } = await req.json()
    console.log("📝 Request data:", { name, email, passwordLength: password?.length })

    if (!name || !email || !password) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log("🔍 Checking if user exists...")
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("❌ User already exists:", email)
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    console.log("🔐 Hashing password...")
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("💾 Creating user in database...")
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    console.log("✅ User created successfully:", user.id)
    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("💥 Registration error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "Unknown error")
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 503 }
        )
      }
      if (error.message.includes('Prisma')) {
        return NextResponse.json(
          { error: "Database operation failed" },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}