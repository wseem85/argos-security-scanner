import type { Request, Response, NextFunction } from 'express';
import type domain = require('../types/domain');
function errorHandler(
  error: domain.AppError,
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

module.exports = {
  errorHandler,
};
