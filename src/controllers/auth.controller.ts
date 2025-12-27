import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { RegisterDTO } from '../dtos/auth/register.dto';
import { LoginDTO } from '../dtos/auth/login.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body as RegisterDTO);

    ApiResponse.created(res, result, 'User registered successfully');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body as LoginDTO);

    ApiResponse.success(res, result, 'Login successful');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    ApiResponse.success(res, result, 'Token refreshed successfully');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    await this.authService.logout(userId, refreshToken);

    ApiResponse.success(res, null, 'Logout successful');
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
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
