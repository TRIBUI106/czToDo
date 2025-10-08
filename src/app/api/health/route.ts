import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Disable static generation for this route
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log("🏥 Health check started")
    
    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    }
    console.log("🔧 Environment check:", envCheck)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: "unhealthy",
        error: "DATABASE_URL environment variable is missing",
        environment: envCheck,
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }

    // Test database connection
    console.log("🔌 Testing database connection...")
    await prisma.$connect()
    console.log("✅ Database connected")
    
    // Test simple query
    console.log("📊 Running test query...")
    const userCount = await prisma.user.count()
    console.log("📊 User count:", userCount)

    // Test table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Todo')
    `
    console.log("🗃️ Tables found:", tableCheck)
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      userCount,
      tables: tableCheck,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error("💥 Health check failed:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        }
      },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error("Warning: Failed to disconnect:", disconnectError)
    }
  }
}