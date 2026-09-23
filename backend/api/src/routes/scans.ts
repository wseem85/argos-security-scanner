const express = require('express');
const router = express.Router();

const {
  getAllScans,
  getScanById,
  createScan,
  getScanStats,
} = require('../controllers/scan-controller');
router.get('/', getAllScans);
router.get('/:id', getScanById);
router.post('/', createScan);
router.get('/:id/stats', getScanStats);

module.exports = router;
