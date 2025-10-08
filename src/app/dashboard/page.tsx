"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Plus, LogOut, Trash2, Check, X, Edit2, FileText } from "lucide-react"

interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  category?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM")
  const [newDueDate, setNewDueDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingTodo, setEditingTodo] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchTodos()
    }
  }, [session])

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos")
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.error("Error fetching todos:", error)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTodo,
          description: newDescription || null,
          category: newCategory || null,
          priority: newPriority,
          dueDate: newDueDate || null,
        }),
      })

      if (response.ok) {
        const newTodoItem = await response.json()
        setTodos([newTodoItem, ...todos])
        setNewTodo("")
        setNewDescription("")
        setNewCategory("")
        setNewPriority("MEDIUM")
        setNewDueDate("")
      }
    } catch (error) {
      console.error("Error adding todo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !completed }),
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos(todos.map(todo => 
          todo.id === id ? updatedTodo : todo
        ))
      }
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTodos(todos.filter(todo => todo.id !== id))
      }
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  const startEditing = (todo: Todo) => {
    setEditingTodo(todo.id)
    setEditTitle(todo.title)
  }

  const saveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitle }),
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos(todos.map(todo => 
          todo.id === id ? updatedTodo : todo
        ))
        setEditingTodo(null)
        setEditTitle("")
      }
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const cancelEdit = () => {
    setEditingTodo(null)
    setEditTitle("")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-600 bg-red-50"
      case "MEDIUM": return "text-yellow-600 bg-yellow-50"
      case "LOW": return "text-green-600 bg-green-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Todos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {session.user?.name || session.user?.email}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/api-docs')}
              className="flex items-center gap-2"
            >
              {/* <FileText className="h-4 w-4" />
              API Docs */}
            </Button>
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTodo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title *
                  </label>
                  <Input
                    id="title"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Input
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Work, Personal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add more details..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Due Date
                  </label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding..." : "Add Todo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No todos yet. Add your first todo above!
                </p>
              </CardContent>
            </Card>
          ) : (
            todos.map((todo) => (
              <Card key={todo.id} className={`${todo.completed ? 'opacity-75' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className={`p-2 ${todo.completed ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex-1">
                        {editingTodo === todo.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(todo.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {todo.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                                {todo.priority}
                              </span>
                              {todo.category && (
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                  {todo.category}
                                </span>
                              )}
                              {todo.dueDate && (
                                <span className="text-xs text-gray-500">
                                  Due: {new Date(todo.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(todo)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}