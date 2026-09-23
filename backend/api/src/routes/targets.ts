import type { Request, Response } from 'express';

import { Router } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Targets route is not implemented yet',
  });
});

export default router;
