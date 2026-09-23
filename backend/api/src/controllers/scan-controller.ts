import type { Request, Response, NextFunction } from 'express';
const { scanService } = require('../services/scan-service');
async function getAllScans(req: Request, res: Response, next: NextFunction) {
  try {
    const scans = await scanService.getAllScans();
    res.status(200).json(scans);
  } catch (error) {
    next(error);
  }
}

async function getScanById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const scan = await scanService.getScanById(id);
    res.status(200).json(scan);
  } catch (error) {
    next(error);
  }
}

async function createScan(req: Request, res: Response, next: NextFunction) {
  try {
    const { targetId, scanType } = req.body;
    const scan = await scanService.createScan(targetId, scanType);
    res.status(201).json(scan);
  } catch (error) {
    next(error);
  }
}

async function getScanStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const scan = await scanService.getScanStats(id);
    res.status(200).json(scan);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllScans,
  getScanById,
  createScan,
  getScanStats,
};
