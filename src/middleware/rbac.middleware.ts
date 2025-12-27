import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { UserRole } from '../types/enums';

/**
 * RBAC MIDDLEWARE (Role-Based Access Control)
 *
 * Checks if user has required role to access a route
 *
 * IMPORTANT:
 * - This middleware must come AFTER authMiddleware
 * - authMiddleware attaches user to req.user
 * - We check if that user has the required role
 */

/**
 * MIDDLEWARE FACTORY PATTERN
 *
 * This is NOT a middleware itself!
 * It's a function that CREATES a middleware
 *
 * Why?
 * - Different routes need different roles
 * - Some need 'admin', some need 'user' or 'admin'
 * - Factory lets us customize the middleware
 *
 * TYPESCRIPT:
 * - allowedRoles: UserRole[] means array of UserRole enum values
 * - Returns a middleware function
 *
 * EXAMPLE USAGE:
 *   rbac(['admin'])              // Only admins
 *   rbac(['user', 'admin'])      // Users and admins
 */
export const rbac = (allowedRoles: UserRole[]) => {
  /**
   * This is the actual middleware that Express will call
   *
   * CLOSURE CONCEPT:
   * - This inner function has access to 'allowedRoles'
   * - allowedRoles is from the outer function's scope
   * - This is how we "customize" each middleware instance
   */
  return (req: Request, res: Response, next: NextFunction): void => {
    /**
     * STEP 1: Check if user exists
     *
     * This should always be true if authMiddleware ran first
     * But we check to be safe (TypeScript needs this!)
     *
     * TYPESCRIPT:
     * - req.user is optional (IUser | undefined)
     * - We need to check it exists before using it
     */
    if (!req.user) {
      /**
       * If no user, something is wrong
       * Either authMiddleware didn't run, or failed
       */
      return next(
        ApiError.unauthorized('Authentication required', 'NOT_AUTHENTICATED')
      );
    }

    /**
     * STEP 2: Check if user's role is in allowed roles
     *
     * JAVASCRIPT ARRAY METHOD:
     * - includes(): Check if array contains a value
     * - Returns true/false
     *
     * EXAMPLE:
     *   ['admin', 'user'].includes('admin')  → true
     *   ['admin', 'user'].includes('guest')  → false
     *
     * TYPESCRIPT:
     * - req.user.role is UserRole enum
     * - allowedRoles is UserRole[]
     * - Type-safe comparison!
     */
    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      /**
       * User is authenticated, but doesn't have permission
       * This is 403 Forbidden (not 401 Unauthorized)
       *
       * DIFFERENCE:
       * - 401 Unauthorized: You need to login
       * - 403 Forbidden: You're logged in, but can't access this
       */
      return next(
        ApiError.forbidden(
          'You do not have permission to access this resource',
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    /**
     * STEP 3: User has permission, allow access
     */
    next();
  };
};

/**
 * HOW TO USE THIS MIDDLEWARE:
 *
 * Example 1: Admin-only route
 *   router.get('/admin/users',
 *     authMiddleware,           // First: Check if logged in
 *     rbac(['admin']),          // Then: Check if admin
 *     adminController.getUsers  // Finally: Handle request
 *   );
 *
 * Example 2: User or Admin can access
 *   router.get('/profile',
 *     authMiddleware,
 *     rbac(['user', 'admin']),  // Both roles allowed
 *     userController.getProfile
 *   );
 *
 * Example 3: Public route (no RBAC needed)
 *   router.post('/login',
 *     authController.login       // No auth/rbac middleware!
 *   );
 */

/**
 * REAL-WORLD SCENARIOS:
 *
 * 1. Regular user tries to access admin route:
 *    GET /admin/users
 *    → authMiddleware: ✓ (user logged in)
 *    → rbac(['admin']): ✗ (user is 'user', not 'admin')
 *    → Response: 403 Forbidden
 *
 * 2. Admin accesses admin route:
 *    GET /admin/users
 *    → authMiddleware: ✓ (admin logged in)
 *    → rbac(['admin']): ✓ (admin is 'admin')
 *    → Controller executes
 *
 * 3. No authentication:
 *    GET /admin/users (no token)
 *    → authMiddleware: ✗ (no token)
 *    → Response: 401 Unauthorized
 *    → rbac never runs!
 */

/**
 * KEY TYPESCRIPT CONCEPTS:
 *
 * 1. FACTORY PATTERN
 *    - Function that returns a function
 *    - rbac() returns middleware
 *    - Allows customization
 *
 * 2. CLOSURE
 *    - Inner function accesses outer function's variables
 *    - allowedRoles is captured in closure
 *
 * 3. ARRAY TYPES
 *    - UserRole[] means array of UserRole
 *    - Type-safe array operations
 *
 * 4. ENUM USAGE
 *    - UserRole.ADMIN, UserRole.USER
 *    - Type-safe role checking
 *
 * 5. RETURN TYPE ANNOTATION
 *    - : void means function returns nothing
 *    - Middleware should call next(), not return a value
 */

/**
 * COMPARISON: JAVASCRIPT vs TYPESCRIPT
 *
 * In JavaScript, you might write:
 *   const rbac = (roles) => (req, res, next) => {
 *     if (!req.user) return next(new Error('Not authenticated'));
 *     if (!roles.includes(req.user.role)) return next(new Error('Forbidden'));
 *     next();
 *   };
 *
 * In TypeScript, we have:
 *   - Type safety on roles (can't pass invalid role)
 *   - Type safety on req.user (TypeScript knows it exists)
 *   - Proper error handling with ApiError
 *   - Better IDE support (autocomplete, error checking)
 */

/**
 * ADVANCED: Multiple Role Checks
 *
 * You could extend this to check multiple permissions:
 *
 *   const rbac = (options: {
 *     roles?: UserRole[],
 *     permissions?: string[]
 *   }) => { ... }
 *
 * But for our app, simple role checking is sufficient!
 */
