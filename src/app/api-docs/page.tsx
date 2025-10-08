'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Dynamic import để tránh SSR issues với swagger-ui-react
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSwaggerSpec = async () => {
      try {
        const response = await fetch('/api/swagger.json')
        if (!response.ok) {
          throw new Error('Failed to load API specification')
        }
        const spec = await response.json()
        setSwaggerSpec(spec)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadSwaggerSpec()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>🔄 Loading API Documentation...</CardTitle>
            <CardDescription>
              Đang tải OpenAPI specification
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>❌ Error Loading API Docs</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vui lòng kiểm tra lại server hoặc thử refresh trang.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🚀 CZ Todo List API Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete API documentation cho ứng dụng Todo List cá nhân
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {swaggerSpec && (
          <SwaggerUI 
            spec={swaggerSpec}
            displayRequestDuration={true}
            defaultModelsExpandDepth={2}
            defaultModelExpandDepth={2}
            docExpansion="list"
            filter={true}
            showRequestHeaders={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API sử dụng NextAuth session cookies. Đăng nhập qua web interface để test các endpoints được bảo vệ.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🌐 Base URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div>
                <strong>Production:</strong> 
                <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  https://cz-to-do.vercel.app/api
                </code>
              </div>
              <div>
                <strong>Development:</strong> 
                <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  http://localhost:3000/api
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}