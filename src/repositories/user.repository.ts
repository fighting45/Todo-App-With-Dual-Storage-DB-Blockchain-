import { User, IUser } from '../models/user.model';
import { UserRole } from '../types/enums';
import mongoose from 'mongoose';

export class UserRepository {
  //Find a user by email

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email, isDeleted: false }).select('+password');
  }

  //Find a user by username

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username, isDeleted: false }).select('+password');
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false });
  }

  async findByEmailOrUsername(email: string): Promise<IUser | null> {
    return User.findOne({
      $or: [{ email }, { username: email }],
      isDeleted: false,
    }).select('+password');
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    /**
     * User.create() does:
     * 1. Creates a new document
     * 2. Runs validations
     * 3. Runs pre-save hooks (hashes password!)
     * 4. Saves to database
     * 5. Returns the saved document
     */
    const user = await User.create(userData);
    return user;
  }

  /**

   * @returns true if email exists, false otherwise
   *
   * .countDocuments() is more efficient than .find() when you
   * only need to know IF something exists, not the actual document
   *
   * Returns 0 or 1, we convert to boolean with > 0
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email, isDeleted: false });
    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await User.countDocuments({ username, isDeleted: false });
    return count > 0;
  }
}
