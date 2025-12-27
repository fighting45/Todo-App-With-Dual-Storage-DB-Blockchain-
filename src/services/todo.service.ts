import mongoose from 'mongoose';
import { TodoRepository, TodoFilters, PaginationOptions } from '../repositories/todo.repository';
import { BlockchainService } from './blockchain.service';
import { HashService } from './hash.service';
import { CreateTodoDTO } from '../dtos/todo/create-todo.dto';
import { UpdateTodoDTO } from '../dtos/todo/update-todo.dto';
import { ApiError } from '../utils/api-error';
import logger from '../utils/logger';
import { ITodo } from '../models/todo.model';
import { BlockchainSyncStatus, TodoPriority } from '../types/enums';

/**
 * TodoService
 * Orchestrates dual storage: MongoDB (primary) + Blockchain (immutable audit)
 *
 * Strategy: Eventual Consistency
 * - MongoDB writes are immediate (fast user response)
 * - Blockchain writes are async (don't block user)
 * - Failed blockchain syncs are retried in background
 */
export class TodoService {
  private todoRepository: TodoRepository;
  private blockchainService: BlockchainService;
  private hashService: HashService;

  constructor() {
    this.todoRepository = new TodoRepository();
    this.blockchainService = new BlockchainService();
    this.hashService = new HashService();
  }

  /**
   * Create a new todo
   * 1. Save to MongoDB immediately
   * 2. Generate hash
   * 3. Sync to blockchain asynchronously
   */
  async createTodo(userId: string, data: CreateTodoDTO): Promise<ITodo> {
    // Step 1: Create todo in MongoDB
    const todo = await this.todoRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: data.title,
      description: data.description,
      priority: data.priority || TodoPriority.MEDIUM,
      dueDate: data.dueDate,
      isCompleted: false,
      blockchainSyncStatus: BlockchainSyncStatus.PENDING,
    });

    logger.info('Todo created in MongoDB', { todoId: todo._id.toString() });

    // Step 2: Async blockchain sync (don't await - let it run in background)
    this.syncToBlockchain(todo).catch((error) => {
      logger.error('Background blockchain sync failed', {
        todoId: todo._id.toString(),
        error: error.message,
      });
    });

    return todo;
  }

  /**
   * Get all todos for a user with filters and pagination
   */
  async getTodos(
    userId: string,
    filters: TodoFilters = {},
    options: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ todos: ITodo[]; total: number; page: number; totalPages: number }> {
    return this.todoRepository.findAll(userId, filters, options);
  }

  /**
   * Get a single todo by ID
   */
  async getTodoById(todoId: string, userId: string): Promise<ITodo> {
    const todo = await this.todoRepository.findById(todoId, userId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    return todo;
  }

  /**
   * Update a todo
   * 1. Update MongoDB
   * 2. Regenerate hash
   * 3. Update blockchain asynchronously
   */
  async updateTodo(todoId: string, userId: string, data: UpdateTodoDTO): Promise<ITodo> {
    const todo = await this.getTodoById(todoId, userId);

    // Update fields
    const updatedTodo = await this.todoRepository.update(todoId, userId, {
      ...data,
      blockchainSyncStatus: BlockchainSyncStatus.PENDING,
    });

    if (!updatedTodo) {
      throw ApiError.notFound('Todo not found');
    }

    logger.info('Todo updated in MongoDB', { todoId });

    // Async blockchain update
    this.updateOnBlockchain(updatedTodo).catch((error) => {
      logger.error('Background blockchain update failed', {
        todoId,
        error: error.message,
      });
    });

    return updatedTodo;
  }

  /**
   * Toggle todo completion status
   */
  async toggleComplete(todoId: string, userId: string): Promise<ITodo> {
    const todo = await this.todoRepository.toggleComplete(todoId, userId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    logger.info('Todo completion toggled', {
      todoId,
      isCompleted: todo.isCompleted,
    });

    // Update blockchain
    this.updateOnBlockchain(todo).catch((error) => {
      logger.error('Background blockchain update failed', {
        todoId,
        error: error.message,
      });
    });

    return todo;
  }

  /**
   * Delete a todo (soft delete)
   * Also marks as deleted on blockchain
   */
  async deleteTodo(todoId: string, userId: string): Promise<void> {
    const todo = await this.getTodoById(todoId, userId);

    const deleted = await this.todoRepository.softDelete(todoId, userId);

    if (!deleted) {
      throw ApiError.notFound('Todo not found');
    }

    logger.info('Todo soft deleted', { todoId });

    // Delete on blockchain
    this.deleteOnBlockchain(todoId).catch((error) => {
      logger.error('Background blockchain delete failed', {
        todoId,
        error: error.message,
      });
    });
  }

  /**
   * Restore a deleted todo
   */
  async restoreTodo(todoId: string, userId: string): Promise<ITodo> {
    const todo = await this.todoRepository.restore(todoId, userId);

    if (!todo) {
      throw ApiError.notFound('Todo not found or not deleted');
    }

    logger.info('Todo restored', { todoId });

    // Restore on blockchain
    this.restoreOnBlockchain(todoId).catch((error) => {
      logger.error('Background blockchain restore failed', {
        todoId,
        error: error.message,
      });
    });

    return todo;
  }

  /**
   * Verify todo integrity against blockchain
   */
  async verifyTodo(todoId: string, userId: string): Promise<{
    isValid: boolean;
    mongoHash: string;
    blockchainHash: string;
    blockchainData: any;
  }> {
    const todo = await this.getTodoById(todoId, userId);

    if (todo.blockchainSyncStatus !== BlockchainSyncStatus.SYNCED) {
      throw ApiError.badRequest('Todo not yet synced to blockchain');
    }

    // Generate current hash
    const currentHash = this.hashService.generateTodoHash(todo);

    // Get blockchain data
    const blockchainData = await this.blockchainService.getTodo(todoId);

    // Verify
    const isValid = await this.blockchainService.verifyTodo(todoId, currentHash);

    return {
      isValid,
      mongoHash: currentHash,
      blockchainHash: blockchainData.todoHash,
      blockchainData: {
        owner: blockchainData.owner,
        timestamp: blockchainData.timestamp.toString(),
        isDeleted: blockchainData.isDeleted,
      },
    };
  }

  /**
   * Get user's todo statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    return this.todoRepository.countByStatus(userId);
  }

  // ==================== PRIVATE BLOCKCHAIN SYNC METHODS ====================

  /**
   * Sync a new todo to blockchain
   */
  private async syncToBlockchain(todo: ITodo): Promise<void> {
    try {
      const todoId = todo._id.toString();

      // Generate hash
      const hash = this.hashService.generateTodoHash(todo);

      logger.info('Syncing todo to blockchain', { todoId, hash });

      // Create on blockchain
      const txHash = await this.blockchainService.createTodo(todoId, hash);

      // Update MongoDB with blockchain info
      await this.todoRepository.update(todoId, todo.userId, {
        blockchainHash: hash,
        blockchainTxHash: txHash,
        blockchainSyncStatus: BlockchainSyncStatus.SYNCED,
        blockchainSyncedAt: new Date(),
      });

      logger.info('Todo synced to blockchain successfully', { todoId, txHash });
    } catch (error) {
      logger.error('Failed to sync todo to blockchain', {
        todoId: todo._id.toString(),
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark as failed
      await this.todoRepository.updateBlockchainStatus(
        todo._id,
        BlockchainSyncStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Update todo on blockchain
   */
  private async updateOnBlockchain(todo: ITodo): Promise<void> {
    try {
      const todoId = todo._id.toString();

      // Generate new hash
      const newHash = this.hashService.generateTodoHash(todo);

      logger.info('Updating todo on blockchain', { todoId, newHash });

      // Update on blockchain
      const txHash = await this.blockchainService.updateTodo(todoId, newHash);

      // Update MongoDB
      await this.todoRepository.update(todoId, todo.userId, {
        blockchainHash: newHash,
        blockchainTxHash: txHash,
        blockchainSyncStatus: BlockchainSyncStatus.SYNCED,
        blockchainSyncedAt: new Date(),
      });

      logger.info('Todo updated on blockchain successfully', { todoId, txHash });
    } catch (error) {
      logger.error('Failed to update todo on blockchain', {
        todoId: todo._id.toString(),
        error: error instanceof Error ? error.message : String(error),
      });

      await this.todoRepository.updateBlockchainStatus(
        todo._id,
        BlockchainSyncStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Delete todo on blockchain
   */
  private async deleteOnBlockchain(todoId: string): Promise<void> {
    try {
      logger.info('Deleting todo on blockchain', { todoId });

      const txHash = await this.blockchainService.deleteTodo(todoId);

      logger.info('Todo deleted on blockchain successfully', { todoId, txHash });
    } catch (error) {
      logger.error('Failed to delete todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Restore todo on blockchain
   */
  private async restoreOnBlockchain(todoId: string): Promise<void> {
    try {
      logger.info('Restoring todo on blockchain', { todoId });

      const txHash = await this.blockchainService.restoreTodo(todoId);

      logger.info('Todo restored on blockchain successfully', { todoId, txHash });
    } catch (error) {
      logger.error('Failed to restore todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
