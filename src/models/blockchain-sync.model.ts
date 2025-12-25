import mongoose, { Document, Schema } from 'mongoose';
import { BlockchainSyncOperation } from '../types/enums';

export interface IBlockchainSync extends Document {
  _id: mongoose.Types.ObjectId;
  todoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  operation: BlockchainSyncOperation;

  // Blockchain data
  todoHash: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;

  // Status
  status: 'pending' | 'confirmed' | 'failed';
  errorMessage?: string;
  retryCount: number;

  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;

  // Metadata
  metadata?: Record<string, any>;
}

const blockchainSyncSchema = new Schema<IBlockchainSync>(
  {
    todoId: {
      type: Schema.Types.ObjectId,
      ref: 'Todo',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    operation: {
      type: String,
      enum: Object.values(BlockchainSyncOperation),
      required: true,
    },
    todoHash: {
      type: String,
      required: true,
    },
    transactionHash: {
      type: String,
      index: true,
      sparse: true,
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      required: true,
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    confirmedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
blockchainSyncSchema.index({ todoId: 1, createdAt: -1 }); // Audit trail
blockchainSyncSchema.index({ status: 1, retryCount: 1 }); // For retry jobs
blockchainSyncSchema.index({ createdAt: 1 }); // For cleanup/archival

export const BlockchainSync = mongoose.model<IBlockchainSync>(
  'BlockchainSync',
  blockchainSyncSchema
);
