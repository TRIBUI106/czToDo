import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Disable static generation for this route  
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Registration attempt started")
    
    // Parse request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { name, email, password } = body
    console.log("📝 Request data received:", { 
      name: !!name, 
      email: !!email, 
      passwordLength: password?.length 
    })

    // Validate required fields
    if (!name || !email || !password) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format")
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Test database connection first
    console.log("🔍 Testing database connection...")
    try {
      await prisma.$connect()
      console.log("✅ Database connected successfully")
    } catch (connectError) {
      console.error("❌ Database connection failed:", connectError)
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      )
    }

    // Check if user already exists
    console.log("🔍 Checking if user exists...")
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      })
    } catch (findError) {
      console.error("❌ Error checking existing user:", findError)
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log("❌ User already exists:", email)
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    console.log("🔐 Hashing password...")
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12)
    } catch (hashError) {
      console.error("❌ Password hashing failed:", hashError)
      return NextResponse.json(
        { error: "Password processing failed" },
        { status: 500 }
      )
    }

    // Create user
    console.log("💾 Creating user in database...")
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        }
      })
    } catch (createError) {
      console.error("❌ User creation failed:", createError)
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      )
    }

    console.log("✅ User created successfully:", user.id)
    return NextResponse.json(
      { 
        message: "User created successfully", 
        userId: user.id,
        email: user.email 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("💥 Unexpected error in registration:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  } finally {
    // Ensure database connection is closed
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error("Warning: Failed to disconnect from database:", disconnectError)
    }
  }
}