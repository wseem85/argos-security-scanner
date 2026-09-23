import { Router } from 'express';

import {
  getAllScans,
  getScanById,
  createScan,
  getScanStats,
} from '../controllers/scan-controller.js';

const router = Router();
router.get('/', getAllScans);
router.get('/:id', getScanById);
router.post('/', createScan);
router.get('/:id/stats', getScanStats);

export default router;
