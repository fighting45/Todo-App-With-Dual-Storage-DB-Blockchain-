# Advanced Todo App with Dual Storage (MongoDB + Blockchain)

A production-grade todo application built with TypeScript, featuring dual storage architecture combining MongoDB for fast data access and Ethereum blockchain for tamper-proof verification.

## 🎯 Project Overview

This project implements a sophisticated todo management system with the following key features:
- **Dual Storage Architecture**: MongoDB for primary data storage, Ethereum blockchain for immutable audit trail
- **Hash-Only Blockchain Storage**: Cost-effective approach storing only SHA256 hashes on-chain (~$0.01 per todo vs $100+ for full data)
- **Enterprise Authentication**: JWT-based auth with refresh tokens and role-based access control (RBAC)
- **RESTful API**: Clean, versioned API design with comprehensive validation
- **TypeScript-First**: Fully typed codebase with strict type checking

## 🚀 Technology Stack

### Backend
- **Runtime**: Node.js v22.19.0
- **Framework**: Express 5.x
- **Language**: TypeScript 5.9.3
- **Database**: MongoDB (Mongoose ODM)
- **Blockchain**: Ethereum (Sepolia testnet) with Hardhat
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod (TypeScript-first validation)
- **Logging**: Winston with daily log rotation
- **Security**: bcrypt, helmet, cors, express-rate-limit

### Development Tools
- **Dev Server**: ts-node-dev (hot reload)
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, Supertest (planned)

## ✨ Features Implemented

### ✅ Phase 1: Foundation Setup (Completed)
- [x] TypeScript configuration with strict mode
- [x] Project structure with layered architecture
- [x] MongoDB models (User, Todo, BlockchainSync)
- [x] Winston logger with daily rotation
- [x] Error handling middleware
- [x] Environment configuration
- [x] API response utilities
- [x] Pagination helpers

### ✅ Phase 2: Authentication & Authorization (Completed & Tested)
- [x] User registration with validation
- [x] User login with JWT tokens
- [x] Dual token system (access + refresh)
- [x] Password hashing with bcrypt (cost factor 12)
- [x] JWT authentication middleware
- [x] Role-based access control (RBAC)
- [x] Protected routes
- [x] Zod validation middleware
- [x] Security middleware (helmet, CORS, rate limiting)

### 🔄 Phase 3: Core Todo API (Pending)
- [ ] Todo CRUD operations
- [ ] Pagination, filtering, sorting
- [ ] Search functionality
- [ ] Soft delete with restore

### 🔄 Phase 4: Blockchain Integration (Pending)
- [ ] TodoRegistry.sol smart contract
- [ ] Hash generation service
- [ ] Blockchain sync service
- [ ] Async synchronization with retry logic
- [ ] Sepolia testnet deployment
- [ ] Verification endpoints

### 🔄 Phase 5-8: Future Phases
- [ ] Admin features
- [ ] GraphQL API (bonus)
- [ ] Comprehensive testing
- [ ] API documentation
- [ ] Production optimization

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
│   ├── index.ts           # Central config export
│   └── database.config.ts # MongoDB connection
├── models/                 # MongoDB schemas
│   ├── user.model.ts      # User schema with auth
│   ├── todo.model.ts      # Todo schema with blockchain tracking
│   └── blockchain-sync.model.ts
├── dtos/                   # Data Transfer Objects
│   └── auth/              # Auth DTOs with Zod schemas
│       ├── register.dto.ts
│       ├── login.dto.ts
│       └── index.ts
├── repositories/           # Data access layer
│   └── user.repository.ts
├── services/               # Business logic
│   └── auth.service.ts
├── controllers/            # Request handlers
│   └── auth.controller.ts
├── routes/                 # API routes
│   ├── index.ts           # Main router
│   └── v1/                # API version 1
│       ├── index.ts
│       └── auth.routes.ts
├── middleware/             # Express middleware
│   ├── error.middleware.ts
│   ├── validation.middleware.ts
│   ├── auth.middleware.ts
│   └── rbac.middleware.ts
├── utils/                  # Utility functions
│   ├── logger.ts          # Winston logger
│   ├── api-error.ts       # Custom error classes
│   ├── api-response.ts    # Standardized responses
│   ├── async-handler.ts   # Async error wrapper
│   └── pagination.ts      # Pagination helpers
├── types/                  # TypeScript types
│   ├── enums.ts           # Enums (UserRole, TodoPriority, etc.)
│   └── express.d.ts       # Express type extensions
├── app.ts                  # Express app setup
└── server.ts               # Server entry point

blockchain/                 # (To be created in Phase 4)
├── contracts/             # Solidity smart contracts
├── scripts/               # Deployment scripts
└── test/                  # Contract tests
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js v22+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Todo-App-With-Dual-Storage-DB-Blockchain-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and update with your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/todo-app
   JWT_SECRET=your-secret-key-min-256-bits
   JWT_REFRESH_SECRET=your-refresh-secret-min-256-bits
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   ```bash
   # macOS (Homebrew)
   brew services start mongodb-community

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/refresh-token` | No | Refresh access token |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/logout` | Yes | Logout user |

### API Testing Results ✅

All authentication endpoints have been tested and verified:

#### 1. Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "test123456",
  "firstName": "Test",
  "lastName": "User"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "69500c34eb9f34d529ca90fd",
      "email": "test@example.com",
      "username": "testuser",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "User registered successfully"
}
```

#### 2. Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Login successful"
}
```

#### 3. Get Current User (Protected)
```bash
GET /api/v1/auth/me
Authorization: Bearer <access_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "69500c34eb9f34d529ca90fd",
    "email": "test@example.com",
    "username": "testuser",
    "role": "user",
    "createdAt": "2025-12-27T16:41:24.948Z"
  },
  "message": "User retrieved successfully"
}
```

#### 4. Refresh Token
```bash
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  },
  "message": "Token refreshed successfully"
}
```

#### 5. Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response: 200 OK
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

## 🏗️ Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────┐
│         Client Request              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Controller Layer               │
│  (HTTP handling, validation)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Service Layer                 │
│  (Business logic, orchestration)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Repository Layer                │
│  (Database & blockchain operations) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Infrastructure Layer             │
│  (MongoDB, Ethereum, External APIs) │
└─────────────────────────────────────┘
```

### Key Design Patterns

- **Repository Pattern**: Abstracts data access logic
- **DTO Pattern**: Validates and transfers data between layers
- **Factory Pattern**: Middleware factories for reusability
- **Singleton Pattern**: Database connections, logger
- **Dependency Injection**: Service dependencies

### Security Features

✅ **Password Security**
- bcrypt hashing with cost factor 12
- Password never returned in API responses
- Automatic hashing via Mongoose pre-save hooks

✅ **Token Security**
- JWT with HS256 algorithm
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Refresh token rotation on use
- Token stored in database for revocation

✅ **Request Security**
- Helmet.js for security headers
- CORS with configurable origins
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod
- NoSQL injection prevention
- XSS protection

✅ **Authorization**
- Role-based access control (RBAC)
- User and Admin roles
- Protected routes with auth middleware
- 401 Unauthorized vs 403 Forbidden distinction

## 🧪 Testing

### Current Status
- [x] Manual API testing completed
- [ ] Unit tests (Jest)
- [ ] Integration tests (Supertest)
- [ ] E2E tests
- [ ] Smart contract tests (Hardhat)

Target coverage: 80%+

## 📝 Development Notes

### TypeScript Concepts Used

1. **Interfaces vs Types**: Using interfaces for object shapes, types for unions
2. **Zod Schema Inference**: Automatic TypeScript type generation with `z.infer`
3. **Generic Types**: Repository pattern with generic types
4. **Type Assertions**: Strategic use of `as` for type narrowing
5. **Optional Chaining**: Safe property access with `?.`
6. **Non-null Assertion**: Controlled use of `!` after validation
7. **Promise Types**: Explicit `Promise<T>` return types
8. **Partial Types**: `Partial<T>` for flexible updates

### Database Schema Highlights

**User Model**:
- Password auto-hashing on save
- Refresh token management methods
- Soft delete support
- Password comparison method

**Todo Model**:
- Blockchain sync status tracking
- Priority levels (low, medium, high, urgent)
- Soft delete with restore capability
- Automatic timestamps

## 🔜 Next Steps

### Immediate (Phase 3)
1. Create Todo DTOs and validators
2. Implement Todo repository
3. Build Todo service with CRUD operations
4. Create Todo controller and routes
5. Add pagination, filtering, sorting
6. Implement search functionality

### Medium Term (Phase 4)
1. Write TodoRegistry.sol smart contract
2. Set up Hardhat development environment
3. Implement hash generation service
4. Build blockchain sync service
5. Deploy to Sepolia testnet
6. Create verification endpoints

### Long Term (Phases 5-8)
1. Admin dashboard features
2. GraphQL API implementation
3. Comprehensive test suite
4. API documentation (Swagger)
5. Performance optimization
6. Security audit
7. Production deployment

## 📚 Learning Resources

This project is designed as a learning experience for TypeScript development. Key learning areas:

- **TypeScript**: Strict typing, interfaces, generics, advanced types
- **Express**: Middleware patterns, error handling, route organization
- **MongoDB**: Schema design, indexing, aggregation
- **Blockchain**: Smart contracts, gas optimization, testnet deployment
- **Security**: JWT, bcrypt, OWASP best practices
- **Architecture**: Layered architecture, design patterns, separation of concerns

## 🤝 Contributing

This is a learning project. Contributions, issues, and feature requests are welcome!

## 📄 License

MIT

## 👤 Author

**Usama Hassan**

---

**Project Status**: Phase 2 Complete (Authentication & Authorization) ✅
**Last Updated**: December 27, 2025
**Server Status**: Running on port 3000 🟢
**Database**: MongoDB Connected ✅
