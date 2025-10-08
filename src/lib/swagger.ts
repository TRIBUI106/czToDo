import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CZ Todo List API',
      version: '1.0.0',
      description: 'API documentation cho ứng dụng Todo List cá nhân',
      contact: {
        name: 'CZ Todo API',
        url: 'https://cz-to-do.vercel.app',
      },
    },
    servers: [
      {
        url: 'https://cz-to-do.vercel.app/api',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        SessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'NextAuth session cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxxxx' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Todo: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxxxx' },
            title: { type: 'string', example: 'Hoàn thành project todo' },
            description: { type: 'string', example: 'Thêm Swagger API documentation', nullable: true },
            completed: { type: 'boolean', example: false },
            priority: { 
              type: 'string', 
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              example: 'MEDIUM' 
            },
            category: { type: 'string', example: 'Work', nullable: true },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            userId: { type: 'string', example: 'clxxxxx' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTodoRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Nhiệm vụ mới' },
            description: { type: 'string', example: 'Mô tả chi tiết', nullable: true },
            priority: { 
              type: 'string', 
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              example: 'MEDIUM' 
            },
            category: { type: 'string', example: 'Personal', nullable: true },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        UpdateTodoRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Tiêu đề đã cập nhật' },
            description: { type: 'string', example: 'Mô tả đã cập nhật', nullable: true },
            completed: { type: 'boolean', example: true },
            priority: { 
              type: 'string', 
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              example: 'HIGH' 
            },
            category: { type: 'string', example: 'Work', nullable: true },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newuser@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            name: { type: 'string', example: 'New User', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            timestamp: { type: 'string', format: 'date-time' },
            environment: {
              type: 'object',
              properties: {
                NODE_ENV: { type: 'string', example: 'production' },
                hasDatabaseUrl: { type: 'boolean', example: true },
                hasNextAuthSecret: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check endpoint',
          description: 'Kiểm tra tình trạng hệ thống và database',
          responses: {
            200: {
              description: 'System is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
            500: {
              description: 'System is unhealthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new user',
          description: 'Đăng ký tài khoản người dùng mới',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      message: { type: 'string', example: 'User created successfully' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            409: {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/todos': {
        get: {
          tags: ['Todos'],
          summary: 'Get user todos',
          description: 'Lấy danh sách todos của user hiện tại',
          security: [{ SessionAuth: [] }],
          responses: {
            200: {
              description: 'List of todos',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Todo' },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Todos'],
          summary: 'Create new todo',
          description: 'Tạo todo mới cho user hiện tại',
          security: [{ SessionAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateTodoRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Todo created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Todo' },
                },
              },
            },
            400: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/todos/{id}': {
        get: {
          tags: ['Todos'],
          summary: 'Get todo by ID',
          description: 'Lấy thông tin chi tiết của một todo',
          security: [{ SessionAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Todo ID',
            },
          ],
          responses: {
            200: {
              description: 'Todo details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Todo' },
                },
              },
            },
            404: {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Todos'],
          summary: 'Update todo',
          description: 'Cập nhật thông tin todo',
          security: [{ SessionAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Todo ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateTodoRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Todo updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Todo' },
                },
              },
            },
            404: {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Todos'],
          summary: 'Delete todo',
          description: 'Xóa todo',
          security: [{ SessionAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Todo ID',
            },
          ],
          responses: {
            200: {
              description: 'Todo deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Todo deleted successfully' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/migrate': {
        post: {
          tags: ['System'],
          summary: 'Run database migration',
          description: 'Chạy migration database (admin only)',
          responses: {
            200: {
              description: 'Migration completed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Database migration completed successfully' },
                      output: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            500: {
              description: 'Migration failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        get: {
          tags: ['System'],
          summary: 'Check migration status',
          description: 'Kiểm tra trạng thái migration database',
          responses: {
            200: {
              description: 'Migration status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'checked' },
                      output: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API files
}

export const swaggerSpec = swaggerJSDoc(options)