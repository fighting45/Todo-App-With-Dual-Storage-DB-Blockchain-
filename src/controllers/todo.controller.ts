import { Request, Response } from 'express';
import { TodoService } from '../services/todo.service';
import { CreateTodoDTO } from '../dtos/todo/create-todo.dto';
import { UpdateTodoDTO } from '../dtos/todo/update-todo.dto';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/async-handler';
import { TodoPriority, BlockchainSyncStatus } from '../types/enums';

export class TodoController {
  private todoService: TodoService;

  constructor() {
    this.todoService = new TodoService();

    // Bind methods to preserve 'this' context
    this.createTodo = this.createTodo.bind(this);
    this.getTodos = this.getTodos.bind(this);
    this.getTodoById = this.getTodoById.bind(this);
    this.updateTodo = this.updateTodo.bind(this);
    this.toggleComplete = this.toggleComplete.bind(this);
    this.deleteTodo = this.deleteTodo.bind(this);
    this.restoreTodo = this.restoreTodo.bind(this);
    this.verifyTodo = this.verifyTodo.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  /**
   * Create a new todo
   * POST /api/v1/todos
   */
  createTodo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const data: CreateTodoDTO = req.body;

    const todo = await this.todoService.createTodo(userId, data);

    ApiResponse.created(res, todo, 'Todo created successfully');
  });

  /**
   * Get all todos with filtering, sorting, and pagination
   * GET /api/v1/todos
   *
   * Query params:
   * - page: number (default: 1)
   * - limit: number (default: 10)
   * - sortBy: string (e.g., 'createdAt', 'priority', 'dueDate')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   * - isCompleted: boolean
   * - priority: 'low' | 'medium' | 'high' | 'urgent'
   * - search: string (searches title and description)
   * - dueDateFrom: ISO date string
   * - dueDateTo: ISO date string
   * - blockchainSyncStatus: 'pending' | 'synced' | 'failed'
   */
  getTodos = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Parse filters
    const filters: any = {};

    if (req.query.isCompleted !== undefined) {
      filters.isCompleted = req.query.isCompleted === 'true';
    }

    if (req.query.priority) {
      filters.priority = req.query.priority as TodoPriority;
    }

    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    if (req.query.dueDateFrom) {
      filters.dueDateFrom = new Date(req.query.dueDateFrom as string);
    }

    if (req.query.dueDateTo) {
      filters.dueDateTo = new Date(req.query.dueDateTo as string);
    }

    if (req.query.blockchainSyncStatus) {
      filters.blockchainSyncStatus = req.query.blockchainSyncStatus as BlockchainSyncStatus;
    }

    const result = await this.todoService.getTodos(userId, filters, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    ApiResponse.success(res, result, 'Todos retrieved successfully');
  });

  /**
   * Get a single todo by ID
   * GET /api/v1/todos/:id
   */
  getTodoById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const todoId = req.params.id;

    const todo = await this.todoService.getTodoById(todoId, userId);

    ApiResponse.success(res, todo, 'Todo retrieved successfully');
  });

  /**
   * Update a todo
   * PUT /api/v1/todos/:id
   */
  updateTodo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const todoId = req.params.id;
    const data: UpdateTodoDTO = req.body;

    const todo = await this.todoService.updateTodo(todoId, userId, data);

    ApiResponse.success(res, todo, 'Todo updated successfully');
  });

  /**
   * Toggle todo completion status
   * PATCH /api/v1/todos/:id/toggle
   */
  toggleComplete = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const todoId = req.params.id;

    const todo = await this.todoService.toggleComplete(todoId, userId);

    ApiResponse.success(
      res,
      todo,
      `Todo marked as ${todo.isCompleted ? 'completed' : 'incomplete'}`
    );
  });

  /**
   * Delete a todo (soft delete)
   * DELETE /api/v1/todos/:id
   */
  deleteTodo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const todoId = req.params.id;

    await this.todoService.deleteTodo(todoId, userId);

    ApiResponse.success(res, null, 'Todo deleted successfully');
  });

  /**
   * Restore a deleted todo
   * POST /api/v1/todos/:id/restore
   */
  restoreTodo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const todoId = req.params.id;

    const todo = await this.todoService.restoreTodo(todoId, userId);

    ApiResponse.success(res, todo, 'Todo restored successfully');
  });

  /**
   * Verify todo integrity against blockchain
   * GET /api/v1/todos/:id/verify
   */
  verifyTodo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const todoId = req.params.id;

    const verification = await this.todoService.verifyTodo(todoId, userId);

    ApiResponse.success(res, verification, 'Todo verification complete');
  });

  /**
   * Get user's todo statistics
   * GET /api/v1/todos/stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();

    const stats = await this.todoService.getStats(userId);

    ApiResponse.success(res, stats, 'Statistics retrieved successfully');
  });
}
