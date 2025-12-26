import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { RegisterDTO } from '../dtos/auth/register.dto';
import { LoginDTO } from '../dtos/auth/login.dto';

/**
 * TYPESCRIPT EXPLANATION:
 *
 * Request<ParamsDictionary, any, RegisterDTO>
 * This tells Express what type the request body is
 *
 * Breaking it down:
 * - Request: Express request object
 * - First param: URL params (we don't use here)
 * - Second param: Response body type (any is fine)
 * - Third param: Request body type (RegisterDTO!)
 *
 * After validation middleware runs:
 * - req.body is guaranteed to be RegisterDTO
 * - TypeScript gives us autocomplete!
 */

export class AuthController {
  private authService: AuthService;

  constructor() {
    /**
     * Create instance of AuthService
     * Each controller method will use this
     */
    this.authService = new AuthService();

    /**
     * IMPORTANT: Bind methods to 'this'
     *
     * Why?
     * When we use these methods as route handlers,
     * JavaScript loses the 'this' context
     *
     * Example without binding:
     *   router.post('/register', authController.register)
     *   // Inside register(), 'this' is undefined!
     *
     * Example with binding:
     *   router.post('/register', authController.register)
     *   // Inside register(), 'this' refers to the controller
     *
     * We bind in constructor so we only do it once
     */
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
  }

  /**
   * REGISTER NEW USER
   *
   * POST /api/v1/auth/register
   *
   * Flow:
   * 1. Validation middleware validates req.body
   * 2. This controller method is called
   * 3. We call authService.register()
   * 4. We send success response
   *
   * If error occurs:
   * - asyncHandler catches it
   * - Error middleware handles it
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    /**
     * req.body is now RegisterDTO (thanks to validation middleware)
     * TypeScript knows this and gives us autocomplete!
     */
    const result = await this.authService.register(req.body as RegisterDTO);

    /**
     * ApiResponse.created() sends:
     * - Status: 201 (Created)
     * - Body: { success: true, data: result, message: '...' }
     *
     * Why not just res.json()?
     * - Consistent response format across all endpoints
     * - Automatically adds metadata (timestamp, etc.)
     * - Centralized response handling
     */
    ApiResponse.created(res, result, 'User registered successfully');
  });

  /**
   * LOGIN USER
   *
   * POST /api/v1/auth/login
   *
   * Similar to register, but:
   * - Returns 200 (OK) instead of 201
   * - Different service method
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body as LoginDTO);

    /**
     * ApiResponse.success() sends:
     * - Status: 200 (OK)
     * - Body: { success: true, data: result }
     */
    ApiResponse.success(res, result, 'Login successful');
  });

  /**
   * REFRESH ACCESS TOKEN
   *
   * POST /api/v1/auth/refresh-token
   * Body: { refreshToken: string }
   *
   * When access token expires, client sends refresh token
   * to get a new access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    /**
     * TYPESCRIPT NOTE:
     * req.body.refreshToken might not exist
     * TypeScript doesn't know the shape of req.body here
     *
     * We could create a RefreshTokenDTO, but for simplicity,
     * we just extract it and let the service validate
     */
    const { refreshToken } = req.body;

    /**
     * Simple validation
     * If no token provided, service will throw error anyway,
     * but this gives a clearer error message
     */
    if (!refreshToken) {
      /**
       * We could throw ApiError.badRequest() here
       * But for demo, we'll just let it pass to service
       * Service will handle the error
       */
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    ApiResponse.success(res, result, 'Token refreshed successfully');
  });

  /**
   * LOGOUT USER
   *
   * POST /api/v1/auth/logout
   * Headers: Authorization: Bearer <access-token>
   * Body: { refreshToken: string }
   *
   * This endpoint requires authentication!
   * User must be logged in to log out
   *
   * TYPESCRIPT NOTE:
   * req.user comes from auth middleware (we'll create this next)
   * We added it to Express.Request type in express.d.ts
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    /**
     * req.user is added by auth middleware
     * If user is not authenticated, middleware blocks the request
     * So here, we can safely assume req.user exists
     *
     * TYPESCRIPT:
     * We use ! (non-null assertion) to tell TypeScript
     * "trust me, this exists"
     */
    const userId = req.user!._id.toString();
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    await this.authService.logout(userId, refreshToken);

    /**
     * For logout, we don't return any data
     * Just a success message
     */
    ApiResponse.success(res, null, 'Logout successful');
  });

  /**
   * GET CURRENT USER
   *
   * GET /api/v1/auth/me
   * Headers: Authorization: Bearer <access-token>
   *
   * Returns the currently logged-in user's information
   * Useful for frontend to get user data on page load
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    /**
     * req.user is populated by auth middleware
     * We just return it (without sensitive data like password)
     *
     * The user object from middleware already has password excluded
     * (remember select: false in the model)
     */
    const user = {
      id: req.user!._id.toString(),
      email: req.user!.email,
      username: req.user!.username,
      role: req.user!.role,
      firstName: req.user?.firstName,
      lastName: req.user?.lastName,
      createdAt: req.user!.createdAt,
    };

    ApiResponse.success(res, user, 'User retrieved successfully');
  });
}

/**
 * HOW THIS WILL BE USED IN ROUTES:
 *
 * import { AuthController } from './controllers/auth.controller';
 *
 * const authController = new AuthController();
 *
 * router.post('/register',
 *   validate(registerSchema, 'body'),    // Validate first
 *   authController.register              // Then handle
 * );
 *
 * router.post('/login',
 *   validate(loginSchema, 'body'),
 *   authController.login
 * );
 *
 * router.post('/refresh-token',
 *   authController.refreshToken
 * );
 *
 * router.post('/logout',
 *   authMiddleware,                      // Must be authenticated
 *   authController.logout
 * );
 *
 * router.get('/me',
 *   authMiddleware,                      // Must be authenticated
 *   authController.getCurrentUser
 * );
 */

/**
 * KEY TYPESCRIPT CONCEPTS:
 *
 * 1. METHOD BINDING
 *    - this.method = this.method.bind(this)
 *    - Preserves 'this' context in route handlers
 *
 * 2. NON-NULL ASSERTION (!)
 *    - req.user!._id
 *    - Tells TypeScript "this definitely exists"
 *    - Use carefully! Only when you're sure
 *
 * 3. OPTIONAL CHAINING (?.)
 *    - req.user?.firstName
 *    - Safely access property that might not exist
 *    - Returns undefined if property doesn't exist
 *
 * 4. TYPE CASTING (as)
 *    - req.body as RegisterDTO
 *    - After validation, we know the type
 *    - Helps TypeScript understand
 *
 * 5. ASYNC HANDLER WRAPPER
 *    - asyncHandler(async (req, res) => { ... })
 *    - Catches errors automatically
 *    - No try-catch needed!
 */

/**
 * WHY CLASSES FOR CONTROLLERS?
 *
 * We could use plain functions:
 *   export const register = async (req, res) => { ... }
 *
 * But classes are better because:
 * 1. Can share authService instance
 * 2. Can have private helper methods
 * 3. Can bind methods once in constructor
 * 4. More organized for larger controllers
 * 5. Easier to test (can mock dependencies)
 *
 * JAVASCRIPT DEVELOPERS:
 * This is similar to:
 *   const authController = {
 *     register: async (req, res) => { ... },
 *     login: async (req, res) => { ... }
 *   }
 *
 * But with proper encapsulation and type safety!
 */
