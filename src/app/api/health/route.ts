import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    console.log("🏥 Health check started")
    
    // Test database connection
    await prisma.$connect()
    console.log("✅ Database connected")
    
    // Test simple query
    const userCount = await prisma.user.count()
    console.log("📊 User count:", userCount)
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      userCount,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      }
    })
    
  } catch (error) {
    console.error("💥 Health check failed:", error)
    
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}