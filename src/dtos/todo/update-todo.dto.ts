import { z } from 'zod';
import { TodoPriority } from '../../types/enums';

/**
 * UpdateTodoDTO - Validation schema for updating a todo
 * All fields are optional since user can update any combination
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be at most 200 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .trim()
    .optional(),

  priority: z
    .enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH, TodoPriority.URGENT])
    .optional(),

  isCompleted: z.boolean().optional(),

  dueDate: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional()
    .nullable(),
});

export type UpdateTodoDTO = z.infer<typeof updateTodoSchema>;
