import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validate(schema: ZodType, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === 'query') {
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true, enumerable: true });
      } else {
        (req as unknown as Record<string, unknown>)[source] = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.') || source;
          if (!errors[key]) errors[key] = issue.message;
        }
        return next(new ApiError(422, 'Validation failed', errors));
      }
      next(err);
    }
  };
}
