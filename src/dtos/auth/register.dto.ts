import { z } from 'zod';

/**
 * REGISTRATION DTO (Data Transfer Object)
 *
 * This defines what data we accept when a user registers.
 */

// Define the Zod schema (this does validation)
export const registerSchema = z.object({
  // Email field
  email: z
    .string() // Must be a string
    .email('Invalid email format') // Must be valid email
    .toLowerCase()
    .trim(),

  // Username field
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .trim()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),

  // Password field
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),

  // Optional fields (notice the .optional())
  firstName: z.string().max(50, 'First name cannot exceed 50 characters').trim().optional(), // This field is NOT required

  lastName: z.string().max(50, 'Last name cannot exceed 50 characters').trim().optional(),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
