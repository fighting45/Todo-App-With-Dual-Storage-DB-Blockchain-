import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

export const validate = (
  schema: AnyZodObject, // The Zod schema to validate against
  target: 'body' | 'query' | 'params' = 'body' // What part of request to validate
) => {
  /**
   * This returns a middleware function
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req[target]);

      /**
       * Replace the original data with validated/cleaned data
       * Now we know the data is safe and clean.
       */
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass the error to error handling middleware
        next(error);
      } else {
        // Unexpected error
        next(ApiError.internal('Validation error'));
      }
    }
  };
};
