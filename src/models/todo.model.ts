import mongoose, { Document, Schema } from 'mongoose';
import { TodoPriority, BlockchainSyncStatus } from '../types/enums';
import { CONSTANTS } from '../config/constants';

export interface ITodo extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  priority: TodoPriority;
  dueDate?: Date;

  // Blockchain integration
  blockchainHash?: string;
  blockchainTxHash?: string;
  blockchainSyncStatus: BlockchainSyncStatus;
  blockchainSyncError?: string;
  blockchainSyncedAt?: Date;
  lastSyncAttempt?: Date;
  syncRetryCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
}

const todoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [CONSTANTS.TODO.MAX_TITLE_LENGTH, `Title cannot exceed ${CONSTANTS.TODO.MAX_TITLE_LENGTH} characters`],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        CONSTANTS.TODO.MAX_DESCRIPTION_LENGTH,
        `Description cannot exceed ${CONSTANTS.TODO.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: Object.values(TodoPriority),
      default: TodoPriority.MEDIUM,
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },

    // Blockchain integration fields
    blockchainHash: {
      type: String,
      index: true,
      sparse: true, // Allow multiple null values
    },
    blockchainTxHash: {
      type: String,
    },
    blockchainSyncStatus: {
      type: String,
      enum: Object.values(BlockchainSyncStatus),
      default: BlockchainSyncStatus.PENDING,
      index: true,
    },
    blockchainSyncError: {
      type: String,
    },
    blockchainSyncedAt: {
      type: Date,
    },
    lastSyncAttempt: {
      type: Date,
    },
    syncRetryCount: {
      type: Number,
      default: 0,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common query patterns
todoSchema.index({ userId: 1, isDeleted: 1, isCompleted: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ blockchainSyncStatus: 1, syncRetryCount: 1 });
todoSchema.index({ userId: 1, createdAt: -1 });

// Update completedAt when isCompleted changes
todoSchema.pre('save', function () {
  if (this.isModified('isCompleted')) {
    if (this.isCompleted) {
      this.completedAt = new Date();
    } else {
      this.completedAt = undefined;
    }
  }
});

export const Todo = mongoose.model<ITodo>('Todo', todoSchema);
