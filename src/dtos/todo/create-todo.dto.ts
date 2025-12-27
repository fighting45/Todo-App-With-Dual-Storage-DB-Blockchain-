import { z } from 'zod';
import { TodoPriority } from '../../types/enums';

/**
 * CreateTodoDTO - Validation schema for creating a new todo
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .trim(),

  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .trim()
    .optional(),

  priority: z
    .enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH, TodoPriority.URGENT])
    .default(TodoPriority.MEDIUM),

  dueDate: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
});

export type CreateTodoDTO = z.infer<typeof createTodoSchema>;
