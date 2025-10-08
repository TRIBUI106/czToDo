import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const todo = await prisma.todo.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error("Error fetching todo:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, completed, priority, category, dueDate } = await req.json()

    const todo = await prisma.todo.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: params.id },
      data: {
        title: title ?? todo.title,
        description: description ?? todo.description,
        completed: completed ?? todo.completed,
        priority: priority ?? todo.priority,
        category: category ?? todo.category,
        dueDate: dueDate ? new Date(dueDate) : todo.dueDate,
      },
    })

    return NextResponse.json(updatedTodo)
  } catch (error) {
    console.error("Error updating todo:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const todo = await prisma.todo.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    await prisma.todo.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Todo deleted successfully" })
  } catch (error) {
    console.error("Error deleting todo:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}