import crypto from 'crypto';
import { ITodo } from '../models/todo.model';

export class HashService {
  generateTodoHash(todo: Partial<ITodo>): string {
    // Create a deterministic string representation of the todo
    const dataString = [
      todo.userId?.toString() || '',
      todo.title || '',
      todo.description || '',
      todo.isCompleted ? 'true' : 'false',
      todo.priority || 'medium',
      todo.dueDate?.toISOString() || '',
      todo.createdAt?.toISOString() || new Date().toISOString(),
    ].join('|');

    // Generate SHA256 hash
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    // Return as 0x-prefixed hex string (Ethereum format)
    return `0x${hash}`;
  }

  verifyTodoHash(todo: Partial<ITodo>, expectedHash: string): boolean {
    const calculatedHash = this.generateTodoHash(todo);
    return calculatedHash.toLowerCase() === expectedHash.toLowerCase();
  }

  hexToBytes32(hex: string): string {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

    // Pad to 64 characters (32 bytes)
    const paddedHex = cleanHex.padStart(64, '0');

    return `0x${paddedHex}`;
  }
}
