import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const completed = searchParams.get("completed")
    const priority = searchParams.get("priority")

    const where: any = {
      userId: session.user.id,
    }

    if (category) {
      where.category = category
    }

    if (completed !== null) {
      where.completed = completed === "true"
    }

    if (priority) {
      where.priority = priority
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { completed: "asc" },
        { createdAt: "desc" }
      ],
    })

    return NextResponse.json(todos)
  } catch (error) {
    console.error("Error fetching todos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, priority, category, dueDate } = await req.json()

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error("Error creating todo:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}