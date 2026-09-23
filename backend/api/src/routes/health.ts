import type { Request, Response } from 'express';
const express = require('express');
const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
