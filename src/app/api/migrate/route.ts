import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Disable static generation for this route
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Starting database migration...")

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: "DATABASE_URL not configured",
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }

    console.log("📦 Running prisma migrate deploy...")
    
    // First generate Prisma client
    await execAsync('npx prisma generate', {
      env: { ...process.env },
      timeout: 15000,
    })
    
    // Then run migration
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      env: { ...process.env },
      timeout: 30000, // 30 seconds timeout
    })

    console.log("✅ Migration completed successfully")
    console.log("STDOUT:", stdout)
    if (stderr) console.log("STDERR:", stderr)

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
      output: stdout,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("💥 Migration failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

// GET endpoint to check migration status
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Checking migration status...")

    const { stdout } = await execAsync('npx prisma migrate status', {
      env: { ...process.env },
      timeout: 10000,
    })

    return NextResponse.json({
      status: "checked",
      output: stdout,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Error checking migration status:", error)
    
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}