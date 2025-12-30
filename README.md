# Advanced Todo Application - Dual Storage System

A production-grade todo management system with hybrid storage architecture combining MongoDB for performance and Ethereum blockchain for immutability.

## System Architecture

```
Client Request
      ↓
  Validation Middleware (Zod)
      ↓
  Authentication Middleware (JWT)
      ↓
  Controller Layer
      ↓
  Service Layer (Business Logic)
      ↓
  ┌─────────────┴─────────────┐
  ↓                           ↓
MongoDB (Primary)      Blockchain (Audit)
  ↓                           ↓
Instant Response        Async Sync
```

## Data Storage Strategy

### MongoDB (Primary Storage)

- **Purpose**: Fast CRUD operations, user-facing data
- **Storage**: Full todo objects with all fields
- **Response Time**: ~100ms
- **Data Includes**: title, description, priority, dates, user info, blockchain metadata

### Ethereum Blockchain (Immutable Audit Trail)

- **Purpose**: Tamper-proof verification
- **Storage**: SHA256 hash only (not full data)
- **Sync**: Asynchronous (non-blocking)
- **Data Includes**: hash, owner address, timestamp, deletion status

### Hash-Only Storage: Cost-Benefit Analysis

| Approach      | Cost per Todo | Privacy | Storage Size | Verification |
| ------------- | ------------- | ------- | ------------ | ------------ |
| **Full Data** | ~$100         | Public  | Unlimited    | ✅           |
| **Hash Only** | ~$0.01        | Private | 32 bytes     | ✅           |

**Our Implementation**: Hash-only storage provides identical verification guarantees at 1/10,000th the cost while keeping sensitive todo content off-chain.

## API Documentation

### Interactive API Documentation (Swagger)

**Access the full interactive API documentation at:**

```
http://localhost:3000/api-docs
```

**Features:**

- Try all endpoints directly in your browser
- Auto-generated request/response examples
- Built-in authentication (JWT token support)
- Complete schema documentation
- No Postman needed for testing

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint              | Auth | Description          |
| ------ | --------------------- | ---- | -------------------- |
| POST   | `/auth/register`      | No   | Register new user    |
| POST   | `/auth/login`         | No   | Login user           |
| POST   | `/auth/refresh-token` | No   | Refresh access token |
| GET    | `/auth/me`            | Yes  | Get current user     |
| POST   | `/auth/logout`        | Yes  | Logout user          |

### Todo Endpoints

| Method | Endpoint             | Auth | Description                            |
| ------ | -------------------- | ---- | -------------------------------------- |
| GET    | `/todos`             | Yes  | List todos (paginated, filtered)       |
| GET    | `/todos/stats`       | Yes  | Get user statistics                    |
| GET    | `/todos/:id`         | Yes  | Get single todo                        |
| POST   | `/todos`             | Yes  | Create todo (auto-syncs to blockchain) |
| PUT    | `/todos/:id`         | Yes  | Update todo (auto-syncs changes)       |
| PATCH  | `/todos/:id/toggle`  | Yes  | Toggle completion status               |
| DELETE | `/todos/:id`         | Yes  | Soft delete todo                       |
| POST   | `/todos/:id/restore` | Yes  | Restore deleted todo                   |
| GET    | `/todos/:id/verify`  | Yes  | Verify data integrity vs blockchain    |

### Query Parameters (GET /todos)

```
?page=1
&limit=10
&sortBy=createdAt
&sortOrder=desc
&isCompleted=false
&priority=high|medium|low|urgent
&search=keyword
&dueDateFrom=2025-01-01T00:00:00Z
&dueDateTo=2025-12-31T23:59:59Z
&blockchainSyncStatus=pending|synced|failed
```

## Middleware Stack

### Security & Validation

1. **helmet** - Security headers
2. **cors** - Cross-origin resource sharing
3. **express-rate-limit** - Rate limiting (100 req/15min)
4. **express-mongo-sanitize** - NoSQL injection prevention
5. **zod** - Request validation

### Authentication & Authorization

6. **authMiddleware** - JWT token verification
7. **rbacMiddleware** - Role-based access control

### Error Handling

8. **errorMiddleware** - Centralized error handling
9. **asyncHandler** - Async error wrapper

## Request/Response Flow

### Create Todo Example

**Request:**

```http
POST /api/v1/todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Deploy smart contract",
  "description": "Deploy to Sepolia testnet",
  "priority": "high",
  "dueDate": "2025-12-31T23:59:59Z"
}
```

**Response (Immediate):**

```json
{
  "success": true,
  "data": {
    "_id": "6950...",
    "title": "Deploy smart contract",
    "blockchainSyncStatus": "pending",
    "createdAt": "2025-12-27T17:16:35.289Z"
  }
}
```

**Background Process:**

```
1. Hash generated: SHA256(userId + title + description + ...)
2. Smart contract called: createTodo(todoId, hash)
3. Transaction confirmed: Block #X mined
4. MongoDB updated: status → "synced", txHash saved
```

**Subsequent GET (After sync):**

```json
{
  "blockchainSyncStatus": "synced",
  "blockchainHash": "0x7f5e37ed...",
  "blockchainTxHash": "0xa9952bc1...",
  "blockchainSyncedAt": "2025-12-27T17:16:35.480Z"
}
```

## Data Integrity Verification

### Verify Endpoint Response

```json
{
  "isValid": true,
  "mongoHash": "0x7f5e37ed...",
  "blockchainHash": "0x7f5e37ed...",
  "blockchainData": {
    "owner": "0xf39Fd...",
    "timestamp": "1766855794",
    "isDeleted": false
  }
}
```

**Verification Process:**

1. Calculate current hash from MongoDB data
2. Fetch hash from blockchain smart contract
3. Compare: Match = data unchanged since blockchain sync

## Technology Stack

### Backend

- **Node.js** v22+ with **Express 5.x**
- **TypeScript** 5.9 (strict mode)
- **MongoDB** with Mongoose ODM
- **Ethereum** smart contracts (Solidity 0.8.27)

### Blockchain

- **Hardhat** development environment
- **ethers.js** v6 for contract interaction
- **Local**: Hardhat node (development)
- **Testnet**: Sepolia (production)

### Security

- **JWT** authentication (15min access, 7day refresh)
- **bcrypt** password hashing (cost 12)
- **Zod** schema validation
- **Rate limiting** + **Input sanitization**

## Environment Setup

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/todo-app

# JWT
JWT_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<256-bit-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=<wallet-private-key>
BLOCKCHAIN_CONTRACT_ADDRESS=<deployed-contract-address>
BLOCKCHAIN_NETWORK=hardhat
```

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB
brew services start mongodb-community

# Start Hardhat node (separate terminal)
npx hardhat node

# Deploy smart contract
npx hardhat run blockchain/scripts/deploy.ts --network localhost

# Update .env with contract address from deployment

# Start development server
npm run dev
```

## Smart Contract Interface

```solidity
contract TodoRegistry {
  struct TodoRecord {
    bytes32 todoHash;
    address owner;
    uint256 timestamp;
    bool isDeleted;
  }

  function createTodo(string todoId, bytes32 hash) external;
  function updateTodo(string todoId, bytes32 newHash) external;
  function deleteTodo(string todoId) external;
  function restoreTodo(string todoId) external;
  function verifyTodo(string todoId, bytes32 hash) external view returns (bool);
  function getTodo(string todoId) external view returns (TodoRecord);
}
```

## Performance Metrics

| Operation | MongoDB | Blockchain    | Total User Wait |
| --------- | ------- | ------------- | --------------- |
| Create    | 100ms   | 2-15s (async) | **100ms**       |
| Read      | 50ms    | N/A           | **50ms**        |
| Update    | 100ms   | 2-15s (async) | **100ms**       |
| Verify    | 50ms    | 500ms         | **550ms**       |

**Key Point**: Blockchain operations never block user requests due to asynchronous sync.

## Project Status

- ✅ Phase 1: Foundation & Authentication
- ✅ Phase 2: Todo CRUD API
- ✅ Phase 3: Blockchain Integration
- ✅ Phase 4: Local Testing Complete
- ⏳ Phase 5: Sepolia Testnet Deployment

## License

MIT

---

**Last Updated**: December 30, 2025
**Version**: 1.0.0
**Status**: Production Ready (Local), Testnet Ready
