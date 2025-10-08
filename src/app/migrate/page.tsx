'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MigratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runMigration = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const checkMigrationStatus = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/migrate', {
        method: 'GET'
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Migration</CardTitle>
          <CardDescription>
            Run database migrations for the todo app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runMigration} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Running...' : 'Run Migration'}
            </Button>
            
            <Button 
              onClick={checkMigrationStatus} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {result.success ? '✅ Success' : '❌ Error'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Step 1:</strong> Click "Run Migration" to create database tables</p>
            <p><strong>Step 2:</strong> Check <a href="/api/health" className="text-blue-500 hover:underline" target="_blank">/api/health</a> to verify</p>
            <p><strong>Step 3:</strong> Try <a href="/auth/register" className="text-blue-500 hover:underline">registration</a> if migration succeeds</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}