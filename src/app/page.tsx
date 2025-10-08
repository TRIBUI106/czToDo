"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Personal Todo List
        </h1>
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-6">
            Organize your tasks and boost your productivity
          </p>
          <div className="space-x-4">
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Login
            </a>
            <a
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}