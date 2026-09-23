import type {
  ScanRow,
  ScanType,
  ScanRepositoryPort,
  ScanDetails,
  ScanStatsRow,
} from '../types/domain';
const { createAppError } = require('../types/domain');
const { scanRepository } = require('../repositories/scan-repository');

class ScanService {
  private repositery: ScanRepositoryPort;
  constructor(repositery: ScanRepositoryPort) {
    this.repositery = repositery;
  }
  async getAllScans(): Promise<ScanRow[]> {
    return await this.repositery.getAllScans();
  }
  async getScanById(id: string): Promise<ScanDetails> {
    return await this.repositery.getScanById(id);
  }

  async createScan(targetId: string, scanType: ScanType): Promise<ScanRow> {
    if (!targetId) {
      throw createAppError('target is Required', 400);
    }
    if (!['passive', 'active', 'full'].includes(scanType)) {
      throw createAppError('Invalid Scan Type', 400);
    }
    return await this.repositery.createScan(targetId, scanType);
  }

  async getScanStats(id: string): Promise<ScanStatsRow[]> {
    return await this.repositery.getScanStats(id);
  }
}

const scanService = new ScanService(scanRepository);
module.exports = { scanService, ScanService };
