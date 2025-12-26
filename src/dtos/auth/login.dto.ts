import { z } from 'zod';

export const loginSchema = z.object({
  // User can login with email OR username
  // We'll accept either in this field
  email: z.string().min(1, 'Email or username is required').trim(),

  password: z.string().min(1, 'Password is required'),
});

// Auto-generated TypeScript type
export type LoginDTO = z.infer<typeof loginSchema>;
