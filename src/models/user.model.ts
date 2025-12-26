import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/enums';
import { CONSTANTS } from '../config/constants';

export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  device?: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  refreshTokens: IRefreshToken[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string, expiresAt: Date, device?: string): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    device: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      index: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    refreshTokens: [refreshTokenSchema],
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLoginAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ username: 1, isDeleted: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(CONSTANTS.BCRYPT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add refresh token method
userSchema.methods.addRefreshToken = async function (
  token: string,
  expiresAt: Date,
  device?: string
): Promise<void> {
  // Hash the token before storing
  const hashedToken = await bcrypt.hash(token, 10);

  this.refreshTokens.push({
    token: hashedToken,
    createdAt: new Date(),
    expiresAt,
    device,
  });

  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  return this.save();
};

// Remove refresh token method
userSchema.methods.removeRefreshToken = async function (token: string): Promise<void> {
  // Find and remove the matching refresh token
  for (let i = 0; i < this.refreshTokens.length; i++) {
    const isMatch = await bcrypt.compare(token, this.refreshTokens[i].token);
    if (isMatch) {
      this.refreshTokens.splice(i, 1);
      break;
    }
  }

  return this.save();
};

export const User = mongoose.model<IUser>('User', userSchema);
