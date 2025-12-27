import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDTO } from '../dtos/auth/register.dto';
import { LoginDTO } from '../dtos/auth/login.dto';
import { ApiError } from '../utils/api-error';
import { config } from '../config';
import { IUser } from '../models/user.model';
import { UserRole } from '../types/enums';

/**
 * AUTH SERVICE
 *
 * It contains all the business logic for:
 * - Registration
 * - Login
 * - Token generation
 * - Token refresh
 */

interface TokenPayload {
  userId: string; // User's ID
  email: string; // User's email
  role: UserRole; // User's role (for authorization)
}

/**
 * INTERFACE for Auth Response
 *
 * This defines what we return after successful login/register
 */
interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  };
  accessToken: string; // JWT token for API requests
  refreshToken: string; // Token to get new access tokens
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Step 1: Check if email already exists
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw ApiError.conflict('Email already registered');
    }

    // Step 2: Check if username already exists
    const usernameExists = await this.userRepository.usernameExists(data.username);
    if (usernameExists) {
      throw ApiError.conflict('Username already taken');
    }

    // Step 3: Create user

    const user = await this.userRepository.create({
      email: data.email,
      username: data.username,
      password: data.password, // Will be hashed automatically!
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.USER, // New users are always regular users
    });

    // Step 4: Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Step 5: Store refresh token in database
    /**
     * Why store refresh token?
     * - So we can revoke it later (logout)
     * - So we can limit number of active sessions
     * - Security: Can check if token is still valid
     */
    const refreshTokenExpiry = this.getRefreshTokenExpiry();
    await user.addRefreshToken(refreshToken, refreshTokenExpiry);

    // Step 6: Return response
    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Step 1: Find user (by email OR username)

    const user = await this.userRepository.findByEmailOrUsername(data.email);

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Step 2: Verify password

    const isPasswordValid = await user.comparePassword(data.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Step 3: Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Step 4: Store refresh token
    const refreshTokenExpiry = this.getRefreshTokenExpiry();
    await user.addRefreshToken(refreshToken, refreshTokenExpiry);

    // Step 5: Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Step 6: Return response
    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * GENERATE TOKENS (Private helper method)
   */
  private generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * REFRESH ACCESS TOKEN
   *
   * When access token expires, use refresh token to get a new one
   *
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      // Find user
      const user = await this.userRepository.findById(payload.userId);

      if (!user) {
        throw ApiError.unauthorized('Invalid token');
      }

      const hasValidRefreshToken = user.refreshTokens.some((rt) => {
        // Check if token hasn't expired
        return rt.expiresAt > new Date();
      });

      if (!hasValidRefreshToken) {
        throw ApiError.unauthorized('Refresh token expired or revoked');
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  /**
   * LOGOUT
   *
   * Remove refresh token from database
   * This makes it invalid, even if not expired
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Remove the refresh token
    await user.removeRefreshToken(refreshToken);
  }

  /**
   * HELPER: Format user response
   *
   * Remove sensitive data before sending to client
   * We don't want to send password, refresh tokens, etc.
   */
  private formatUserResponse(user: IUser) {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * HELPER: Calculate refresh token expiry date
   */
  private getRefreshTokenExpiry(): Date {
    // Parse '7d' to milliseconds
    const days = 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
