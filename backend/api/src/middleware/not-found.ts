import type { Request, Response } from 'express';
function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
}

export { notFoundHandler };
