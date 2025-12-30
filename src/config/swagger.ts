import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Advanced Todo API - Dual Storage (MongoDB + Blockchain)',
      version: '1.0.0',
      description: `
Production-grade todo management system with hybrid storage architecture combining MongoDB for performance and Ethereum blockchain for immutability.

## Key Features
- 🔐 JWT Authentication with Refresh Tokens
- 📝 Full CRUD operations on todos
- ⛓️ Automatic blockchain synchronization (hash-only storage)
- ✅ Data integrity verification against blockchain
- 🔍 Advanced filtering, pagination, and sorting
- 🛡️ Role-based access control (RBAC)
- 📊 User statistics and analytics

## Architecture
\`\`\`
Client Request → Validation → Authentication → Controller → Service → Repository
                                                                       ↓
                                                    MongoDB (Primary) + Blockchain (Audit)
\`\`\`

## Authentication
All protected endpoints require a valid JWT access token in the Authorization header:
\`Authorization: Bearer <access_token>\`

Access tokens expire in 15 minutes. Use the refresh token endpoint to get a new access token without re-login.
      `,
      contact: {
        name: 'API Support',
        email: 'support@todoapp.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.todoapp.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // Auth Schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'Valid email address',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_-]+$',
              example: 'john_doe',
              description: 'Username (letters, numbers, underscore, hyphen only)',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'securePassword123',
              description: 'Minimum 6 characters',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'securePassword123',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'Valid refresh token received from login/register',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                expiresIn: {
                  type: 'string',
                  example: '15m',
                },
              },
            },
          },
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                expiresIn: {
                  type: 'string',
                  example: '15m',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6761234567890abcdef12345',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            username: {
              type: 'string',
              example: 'john_doe',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-27T17:16:35.289Z',
            },
          },
        },

        // Todo Schemas
        CreateTodoRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Deploy smart contract',
              description: 'Todo title (1-200 characters)',
            },
            description: {
              type: 'string',
              maxLength: 2000,
              example: 'Deploy to Sepolia testnet',
              description: 'Optional detailed description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
              example: 'high',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-31T23:59:59Z',
              description: 'ISO 8601 datetime',
            },
          },
        },
        UpdateTodoRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Updated title',
            },
            description: {
              type: 'string',
              maxLength: 2000,
              example: 'Updated description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'urgent',
            },
            isCompleted: {
              type: 'boolean',
              example: true,
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-31T23:59:59Z',
            },
          },
        },
        Todo: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6950abcdef1234567890abcd',
            },
            userId: {
              type: 'string',
              example: '6761234567890abcdef12345',
            },
            title: {
              type: 'string',
              example: 'Deploy smart contract',
            },
            description: {
              type: 'string',
              example: 'Deploy to Sepolia testnet',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'high',
            },
            isCompleted: {
              type: 'boolean',
              example: false,
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: null,
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-12-31T23:59:59Z',
            },
            blockchainSyncStatus: {
              type: 'string',
              enum: ['pending', 'synced', 'failed'],
              example: 'synced',
              description: 'Status of blockchain synchronization',
            },
            blockchainHash: {
              type: 'string',
              nullable: true,
              example: '0x7f5e37ed8c5a5b4c9d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
              description: 'SHA256 hash stored on blockchain',
            },
            blockchainTxHash: {
              type: 'string',
              nullable: true,
              example: '0xa9952bc1b94e84322657b11e08a2bcbf714771717ea25d8e9bfad0b7e463b14f',
              description: 'Ethereum transaction hash',
            },
            blockchainSyncedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-12-27T17:16:35.480Z',
            },
            blockchainSyncError: {
              type: 'string',
              nullable: true,
              example: null,
            },
            isDeleted: {
              type: 'boolean',
              example: false,
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: null,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-27T17:16:35.289Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-27T17:16:35.289Z',
            },
          },
        },
        TodoListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                todos: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Todo',
                  },
                },
                total: {
                  type: 'number',
                  example: 10,
                  description: 'Total number of todos matching filters',
                },
                page: {
                  type: 'number',
                  example: 1,
                  description: 'Current page',
                },
                totalPages: {
                  type: 'number',
                  example: 1,
                  description: 'Total number of pages',
                },
              },
            },
          },
        },
        TodoResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              $ref: '#/components/schemas/Todo',
            },
          },
        },
        VerificationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                isValid: {
                  type: 'boolean',
                  example: true,
                  description: 'True if MongoDB hash matches blockchain hash',
                },
                mongoHash: {
                  type: 'string',
                  example: '0x7f5e37ed8c5a5b4c9d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
                  description: 'Hash calculated from current MongoDB data',
                },
                blockchainHash: {
                  type: 'string',
                  example: '0x7f5e37ed8c5a5b4c9d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
                  description: 'Hash stored on blockchain (immutable)',
                },
                blockchainData: {
                  type: 'object',
                  properties: {
                    owner: {
                      type: 'string',
                      example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                      description: 'Ethereum address of owner',
                    },
                    timestamp: {
                      type: 'string',
                      example: '1766855794',
                      description: 'Unix timestamp from blockchain',
                    },
                    isDeleted: {
                      type: 'boolean',
                      example: false,
                    },
                  },
                },
              },
            },
          },
        },
        StatsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                total: {
                  type: 'number',
                  example: 10,
                  description: 'Total number of todos',
                },
                completed: {
                  type: 'number',
                  example: 5,
                  description: 'Number of completed todos',
                },
                pending: {
                  type: 'number',
                  example: 5,
                  description: 'Number of pending todos',
                },
                overdue: {
                  type: 'number',
                  example: 2,
                  description: 'Number of overdue todos',
                },
              },
            },
          },
        },

        // Error Schemas
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message here',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Todos',
        description: 'Todo CRUD operations with blockchain integration',
      },
      {
        name: 'Blockchain',
        description: 'Blockchain-specific operations',
      },
    ],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Create a new user account and receive JWT access & refresh tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error or user already exists',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user and receive JWT tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          description: 'Get a new access token using refresh token (valid for 7 days)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RefreshTokenRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RefreshTokenResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Invalid or expired refresh token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user',
          description: 'Retrieve authenticated user information',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      data: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout user',
          description: 'Invalidate current refresh token',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'Logged out successfully',
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/todos': {
        get: {
          tags: ['Todos'],
          summary: 'Get all todos',
          description: 'Retrieve paginated list of todos with filtering and sorting',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'number', default: 1 },
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', default: 10 },
              description: 'Items per page',
            },
            {
              name: 'sortBy',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['createdAt', 'title', 'priority', 'dueDate'],
                default: 'createdAt',
              },
              description: 'Sort field',
            },
            {
              name: 'sortOrder',
              in: 'query',
              schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
              description: 'Sort order',
            },
            {
              name: 'isCompleted',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Filter by completion status',
            },
            {
              name: 'priority',
              in: 'query',
              schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
              description: 'Filter by priority',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search in title and description',
            },
            {
              name: 'dueDateFrom',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'Filter todos with due date after this',
            },
            {
              name: 'dueDateTo',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'Filter todos with due date before this',
            },
            {
              name: 'blockchainSyncStatus',
              in: 'query',
              schema: { type: 'string', enum: ['pending', 'synced', 'failed'] },
              description: 'Filter by blockchain sync status',
            },
          ],
          responses: {
            '200': {
              description: 'Todos retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoListResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Todos'],
          summary: 'Create a new todo',
          description: 'Create a todo in MongoDB and automatically sync hash to blockchain',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateTodoRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Todo created successfully (blockchain sync is async)',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/todos/stats': {
        get: {
          tags: ['Todos'],
          summary: 'Get user statistics',
          description: 'Retrieve aggregated statistics for user todos',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/StatsResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
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
          description: 'Retrieve a single todo by ID',
          security: [{ bearerAuth: [] }],
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
            '200': {
              description: 'Todo retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['Todos'],
          summary: 'Update todo',
          description: 'Update todo in MongoDB and sync new hash to blockchain',
          security: [{ bearerAuth: [] }],
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
                schema: {
                  $ref: '#/components/schemas/UpdateTodoRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Todo updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Todos'],
          summary: 'Delete todo (soft delete)',
          description: 'Soft delete todo in MongoDB and mark as deleted on blockchain',
          security: [{ bearerAuth: [] }],
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
            '200': {
              description: 'Todo deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'Todo deleted successfully',
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/todos/{id}/toggle': {
        patch: {
          tags: ['Todos'],
          summary: 'Toggle todo completion',
          description: 'Toggle completion status and sync to blockchain',
          security: [{ bearerAuth: [] }],
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
            '200': {
              description: 'Todo toggled successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/todos/{id}/restore': {
        post: {
          tags: ['Todos'],
          summary: 'Restore deleted todo',
          description: 'Restore a soft-deleted todo and update blockchain',
          security: [{ bearerAuth: [] }],
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
            '200': {
              description: 'Todo restored successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found or not deleted',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/todos/{id}/verify': {
        get: {
          tags: ['Todos', 'Blockchain'],
          summary: 'Verify todo integrity',
          description: 'Verify data integrity by comparing MongoDB hash with blockchain hash',
          security: [{ bearerAuth: [] }],
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
            '200': {
              description: 'Verification completed',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/VerificationResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Todo not synced to blockchain yet',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We're using the definition above instead of file scanning
};

export const swaggerSpec = swaggerJsdoc(options);
