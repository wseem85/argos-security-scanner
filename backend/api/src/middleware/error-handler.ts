import type { Request, Response, NextFunction } from 'express';
import type { AppError } from '../types/domain.js';
function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(error);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: error.message || 'Internal server error',
    },
  });
}

export { errorHandler };
