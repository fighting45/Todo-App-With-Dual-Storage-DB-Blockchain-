import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/api-error';
import { config } from '../config';
import { UserRole } from '../types/enums';

/**
 * AUTH MIDDLEWARE
 *
 * Verifies JWT token and attaches user to request
 *
 * FLOW:
 * 1. Extract token from Authorization header
 * 2. Verify token with JWT secret
 * 3. Get userId from token payload
 * 4. Find user in database
 * 5. Attach user to req.user
 * 6. Call next()
 */

/**
 * TYPESCRIPT: Token Payload Interface
 *
 * This matches what we put in the token when generating it
 * (from auth.service.ts)
 */
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * MAIN AUTH MIDDLEWARE FUNCTION
 *
 * This is a standard Express middleware
 * Parameters: (req, res, next)
 *
 * TYPESCRIPT NOTES:
 * - Request, Response, NextFunction are Express types
 * - Promise<void> means async function that returns nothing
 * - We modify req.user (defined in express.d.ts)
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    /**
     * STEP 1: Extract token from Authorization header
     *
     * Authorization header format: "Bearer <token>"
     * We need to extract just the token part
     *
     * TYPESCRIPT:
     * - req.headers.authorization might be undefined
     * - We use optional chaining (?.) to safely access it
     */
    const authHeader = req.headers.authorization;

    /**
     * Check if Authorization header exists
     */
    if (!authHeader) {
      throw ApiError.unauthorized('No token provided', 'NO_TOKEN');
    }

    /**
     * Check if header starts with "Bearer "
     *
     * JAVASCRIPT STRING METHODS:
     * - startsWith(): Check if string starts with substring
     */
    if (!authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Invalid token format. Use: Bearer <token>', 'INVALID_FORMAT');
    }

    /**
     * Extract the token
     *
     * "Bearer eyJhbGci..." → "eyJhbGci..."
     *
     * JAVASCRIPT:
     * - split(' '): Split string by space → ['Bearer', 'token']
     * - [1]: Get second element (the token)
     *
     * EXAMPLE:
     * "Bearer abc123".split(' ') → ['Bearer', 'abc123']
     * ['Bearer', 'abc123'][1] → 'abc123'
     */
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Token is missing', 'TOKEN_MISSING');
    }

    /**
     * STEP 2: Verify token
     *
     * jwt.verify() does:
     * 1. Checks if token signature is valid (not tampered)
     * 2. Checks if token is not expired
     * 3. Returns the payload if valid
     * 4. Throws error if invalid
     *
     * TYPESCRIPT:
     * - 'as TokenPayload' is type assertion
     * - We know jwt.verify returns this shape
     * - Helps TypeScript understand the type
     */
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

    /**
     * STEP 3: Find user in database
     *
     * Why fetch from DB?
     * - User might be deleted/soft-deleted
     * - User role might have changed
     * - We need fresh user data
     *
     * We could just trust the token, but:
     * - Less secure
     * - Can't revoke access instantly
     * - Can't detect deleted users
     */
    const userRepository = new UserRepository();
    const user = await userRepository.findById(payload.userId);

    /**
     * Check if user exists
     */
    if (!user) {
      throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    /**
     * STEP 4: Attach user to request
     *
     * TYPESCRIPT MAGIC:
     * - We extended Express.Request in express.d.ts
     * - Added optional 'user' property
     * - Now we can safely assign it
     *
     * After this line:
     * - Controllers can access req.user
     * - TypeScript knows req.user is IUser
     */
    req.user = user;

    /**
     * STEP 5: Call next()
     *
     * This tells Express: "I'm done, move to next middleware/controller"
     *
     * IMPORTANT:
     * - Must call next() or request hangs!
     * - Don't send response here (controller does that)
     */
    next();
  } catch (error) {
    /**
     * ERROR HANDLING
     *
     * Different types of errors:
     * 1. ApiError (we throw these)
     * 2. JsonWebTokenError (jwt.verify throws this)
     * 3. TokenExpiredError (jwt.verify throws this)
     * 4. Other errors (unexpected)
     */

    /**
     * Handle JWT-specific errors
     *
     * JAVASCRIPT:
     * - error.name contains the error type
     * - Different errors from jwt.verify have different names
     */
    if ((error as any).name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token', 'INVALID_TOKEN'));
    }

    if ((error as any).name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
    }

    /**
     * If it's already an ApiError, just pass it along
     */
    if (error instanceof ApiError) {
      return next(error);
    }

    /**
     * Unknown error - return generic error
     */
    next(ApiError.unauthorized('Authentication failed', 'AUTH_FAILED'));
  }
};

/**
 * HOW TO USE THIS MIDDLEWARE:
 *
 * In routes:
 *   router.get('/todos',
 *     authMiddleware,              // First: verify user
 *     todoController.getTodos      // Then: handle request
 *   );
 *
 * In controller:
 *   const userId = req.user._id;   // User is available!
 *
 * PROTECTED vs UNPROTECTED routes:
 *
 * Protected (requires login):
 *   router.get('/me', authMiddleware, controller.getCurrentUser)
 *
 * Unprotected (anyone can access):
 *   router.post('/login', controller.login)  // No authMiddleware!
 */

/**
 * KEY TYPESCRIPT CONCEPTS:
 *
 * 1. OPTIONAL CHAINING (?.)
 *    - req.headers.authorization
 *    - Safely access property that might not exist
 *
 * 2. TYPE ASSERTION (as)
 *    - jwt.verify(...) as TokenPayload
 *    - Tell TypeScript what type to expect
 *
 * 3. TYPE NARROWING
 *    - error instanceof ApiError
 *    - TypeScript understands the type in that block
 *
 * 4. ANY TYPE
 *    - (error as any).name
 *    - When we don't know the error type
 *    - Use sparingly!
 *
 * 5. EXTENDING EXPRESS TYPES
 *    - req.user is available because we extended Request
 *    - Defined in src/types/express.d.ts
 */

/**
 * SECURITY CONSIDERATIONS:
 *
 * 1. Always verify token signature
 * 2. Check token expiration
 * 3. Fetch fresh user data from DB
 * 4. Don't trust token alone (user might be deleted)
 * 5. Use secure JWT secrets (long, random)
 * 6. Different secrets for access and refresh tokens
 * 7. Short expiration for access tokens (15min)
 * 8. HTTPS only in production (prevent token theft)
 */

/**
 * COMMON ERRORS AND SOLUTIONS:
 *
 * Error: "No token provided"
 * Solution: Include Authorization header
 *
 * Error: "Invalid token format"
 * Solution: Use "Bearer <token>" format
 *
 * Error: "Token expired"
 * Solution: Use refresh token to get new access token
 *
 * Error: "User not found"
 * Solution: User was deleted, must login again
 */
