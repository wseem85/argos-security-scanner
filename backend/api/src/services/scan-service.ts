import type { AppError, ScanType } from '../types/domain';
const { createAppError } = require('../types/domain');
const { scanRepository } = require('../repositories/scan-repository');

class ScanService {
  async getAllScans() {
    return await scanRepository.getAllScans();
  }
  async getScanById(id: string) {
    return await scanRepository.getScanById(id);
  }

  async createScan(targetId: string, scanType: ScanType) {
    if (!targetId) {
      throw createAppError('target is Required', 400);
    }
    if (!scanType) {
      throw createAppError('Invalid Scan Type', 400);
    }
    return await scanRepository.createScan(targetId, scanType);
  }

  async getScanStats(id: string) {
    return await scanRepository.getScanStats(id);
  }
}

const scanService = new ScanService();
module.exports = { scanService };
