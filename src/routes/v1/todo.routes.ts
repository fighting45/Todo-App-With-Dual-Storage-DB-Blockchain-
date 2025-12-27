import { Router } from 'express';
import { TodoController } from '../../controllers/todo.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createTodoSchema, updateTodoSchema } from '../../dtos/todo';

const router = Router();
const todoController = new TodoController();

// All todo routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/todos/stats
 * Get user's todo statistics
 * Must be before /:id routes to avoid treating 'stats' as an ID
 */
router.get('/stats', todoController.getStats);

/**
 * GET /api/v1/todos
 * Get all todos with filtering, sorting, and pagination
 */
router.get('/', todoController.getTodos);

/**
 * POST /api/v1/todos
 * Create a new todo
 */
router.post('/', validate(createTodoSchema, 'body'), todoController.createTodo);

/**
 * GET /api/v1/todos/:id
 * Get a single todo by ID
 */
router.get('/:id', todoController.getTodoById);

/**
 * PUT /api/v1/todos/:id
 * Update a todo
 */
router.put('/:id', validate(updateTodoSchema, 'body'), todoController.updateTodo);

/**
 * PATCH /api/v1/todos/:id/toggle
 * Toggle todo completion status
 */
router.patch('/:id/toggle', todoController.toggleComplete);

/**
 * DELETE /api/v1/todos/:id
 * Soft delete a todo
 */
router.delete('/:id', todoController.deleteTodo);

/**
 * POST /api/v1/todos/:id/restore
 * Restore a deleted todo
 */
router.post('/:id/restore', todoController.restoreTodo);

/**
 * GET /api/v1/todos/:id/verify
 * Verify todo integrity against blockchain
 */
router.get('/:id/verify', todoController.verifyTodo);

export default router;
