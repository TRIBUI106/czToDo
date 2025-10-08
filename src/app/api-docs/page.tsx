'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null)
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

      {/* Swagger UI CDN */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden mb-6">
        <div 
          id="swagger-ui"
          dangerouslySetInnerHTML={{
            __html: `
              <div id="swagger-ui-container"></div>
              <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
              <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
              <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
              <script>
                const ui = SwaggerUIBundle({
                  url: '/api/swagger.json',
                  dom_id: '#swagger-ui-container',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                  ],
                  plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                  ],
                  layout: "StandaloneLayout",
                  tryItOutEnabled: true,
                  displayRequestDuration: true,
                  filter: true,
                  docExpansion: "list",
                  defaultModelsExpandDepth: 2,
                  defaultModelExpandDepth: 2
                });
              </script>
            `
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              API sử dụng NextAuth session cookies. Đăng nhập qua web interface để test các endpoints được bảo vệ.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.open('/auth/login', '_blank')}
              className="w-full"
            >
              🔑 Login để Test API
            </Button>
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
                <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  https://cz-to-do.vercel.app/api
                </code>
              </div>
              <div>
                <strong>Development:</strong> 
                <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  http://localhost:3000/api
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📚 API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div>• <strong>GET /health</strong> - System health check</div>
              <div>• <strong>POST /auth/register</strong> - User registration</div>
              <div>• <strong>GET /todos</strong> - List user todos</div>
              <div>• <strong>POST /todos</strong> - Create new todo</div>
              <div>• <strong>PUT /todos/&#123;id&#125;</strong> - Update todo</div>
              <div>• <strong>DELETE /todos/&#123;id&#125;</strong> - Delete todo</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛠️ Utility Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => window.open('/api/swagger.json', '_blank')}
                className="w-full text-left justify-start"
              >
                📄 OpenAPI JSON Spec
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/api/health', '_blank')}
                className="w-full text-left justify-start"
              >
                ❤️ Health Check
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/dashboard', '_blank')}
                className="w-full text-left justify-start"
              >
                🏠 Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}