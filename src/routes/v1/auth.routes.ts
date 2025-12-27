import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../../dtos/auth';

const router = Router();

const authController = new AuthController();

router.post('/register', validate(registerSchema, 'body'), authController.register);

router.post('/login', validate(loginSchema, 'body'), authController.login);

router.post('/refresh-token', authController.refreshToken);

router.post('/logout', authMiddleware, authController.logout);

router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
