import mongoose from 'mongoose';
import { Todo, ITodo } from '../models/todo.model';
import { TodoPriority, BlockchainSyncStatus } from '../types/enums';

export interface TodoFilters {
  isCompleted?: boolean;
  priority?: TodoPriority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  blockchainSyncStatus?: BlockchainSyncStatus;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TodoRepository {
  /**
   * Find todo by ID for a specific user
   */
  async findById(
    todoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<ITodo | null> {
    return Todo.findOne({
      _id: todoId,
      userId,
      isDeleted: false,
    });
  }

  /**
   * Find all todos for a user with filters and pagination
   */
  async findAll(
    userId: string | mongoose.Types.ObjectId,
    filters: TodoFilters = {},
    options: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ todos: ITodo[]; total: number; page: number; totalPages: number }> {
    const query: any = {
      userId,
      isDeleted: false,
    };

    // Apply filters
    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      query.dueDate = {};
      if (filters.dueDateFrom) {
        query.dueDate.$gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        query.dueDate.$lte = filters.dueDateTo;
      }
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.blockchainSyncStatus) {
      query.blockchainSyncStatus = filters.blockchainSyncStatus;
    }

    // Calculate pagination
    const skip = (options.page - 1) * options.limit;

    // Build sort object
    const sort: any = {};
    if (options.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Execute query
    const [todos, total] = await Promise.all([
      Todo.find(query).sort(sort).skip(skip).limit(options.limit),
      Todo.countDocuments(query),
    ]);

    return {
      todos,
      total,
      page: options.page,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  /**
   * Create a new todo
   */
  async create(todoData: Partial<ITodo>): Promise<ITodo> {
    const todo = await Todo.create(todoData);
    return todo;
  }

  /**
   * Update a todo
   */
  async update(
    todoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    updateData: Partial<ITodo>
  ): Promise<ITodo | null> {
    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return todo;
  }

  /**
   * Soft delete a todo
   */
  async softDelete(
    todoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<ITodo | null> {
    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userId, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    return todo;
  }

  /**
   * Restore a soft-deleted todo
   */
  async restore(
    todoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<ITodo | null> {
    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userId, isDeleted: true },
      {
        $set: {
          isDeleted: false,
        },
        $unset: {
          deletedAt: 1,
        },
      },
      { new: true }
    );

    return todo;
  }

  /**
   * Mark todo as completed/uncompleted
   */
  async toggleComplete(
    todoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<ITodo | null> {
    const todo = await this.findById(todoId, userId);

    if (!todo) {
      return null;
    }

    todo.isCompleted = !todo.isCompleted;
    todo.completedAt = todo.isCompleted ? new Date() : undefined;
    await todo.save();

    return todo;
  }

  /**
   * Update blockchain sync status
   */
  async updateBlockchainStatus(
    todoId: string | mongoose.Types.ObjectId,
    status: BlockchainSyncStatus,
    txHash?: string,
    error?: string
  ): Promise<ITodo | null> {
    const updateData: any = {
      blockchainSyncStatus: status,
    };

    if (txHash) {
      updateData.blockchainTxHash = txHash;
      updateData.blockchainSyncedAt = new Date();
    }

    if (error) {
      updateData.blockchainSyncError = error;
      updateData.syncRetryCount = { $inc: 1 };
    }

    if (status === BlockchainSyncStatus.SYNCED) {
      updateData.blockchainSyncedAt = new Date();
    }

    const todo = await Todo.findByIdAndUpdate(todoId, updateData, { new: true });

    return todo;
  }

  /**
   * Get todos that failed blockchain sync
   */
  async getFailedSyncs(limit = 10): Promise<ITodo[]> {
    return Todo.find({
      blockchainSyncStatus: BlockchainSyncStatus.FAILED,
      syncRetryCount: { $lt: 10 }, // Max 10 retries
      isDeleted: false,
    })
      .sort({ updatedAt: 1 })
      .limit(limit);
  }

  /**
   * Count todos by status
   */
  async countByStatus(userId: string | mongoose.Types.ObjectId): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const now = new Date();

    const [total, completed, overdue] = await Promise.all([
      Todo.countDocuments({ userId, isDeleted: false }),
      Todo.countDocuments({ userId, isDeleted: false, isCompleted: true }),
      Todo.countDocuments({
        userId,
        isDeleted: false,
        isCompleted: false,
        dueDate: { $lt: now },
      }),
    ]);

    return {
      total,
      completed,
      pending: total - completed,
      overdue,
    };
  }
}
