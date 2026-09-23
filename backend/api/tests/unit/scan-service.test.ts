import { describe, it, expect } from 'vitest';
import type { ScanRepositoryPort, ScanType } from '../../src/types/domain.js';
import { ScanService } from '../../src/services/scan-service.js';
type TestAppError = {
  statusCode?: number;
  message?: string;
};
function getAppError(error: unknown): TestAppError {
  return error as TestAppError;
}
// Creating a Fake Repository to feed the service
// we are not testing the repositery(connecting to database)
// we are unit testing that is why it is fake
const fakeRepository: ScanRepositoryPort = {
  getAllScans: async () => [],
  getScanById: async () => {
    throw new Error('Not implemented in this Test');
  },
  createScan: async (targetId, scanType) => ({
    id: 'scan-123',
    target_id: targetId,
    status: 'queued',
    scan_type: scanType,
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
    error_message: null,
  }),
  getScanStats: async () => [],
};

// test createservice
describe('ScanService.createScan', () => {
  it('rejects a missing targetId', async () => {
    const service = new ScanService(fakeRepository);
    try {
      await service.createScan('', 'passive');
      throw new Error('Expected createScan to throw');
    } catch (error) {
      const appError = getAppError(error);
      expect(appError.statusCode).toBe(400);
      expect(appError.message).toBe('targetId is required');
    }
  });
  it('rejects a missing ScanType', async () => {
    const service = new ScanService(fakeRepository);
    try {
      await service.createScan('ab-123', '' as unknown as ScanType);
      throw new Error('Expected createScan to throw');
    } catch (error) {
      const appError = getAppError(error);
      expect(appError.statusCode).toBe(400);
      expect(appError.message).toBe('Invalid Scan Type');
    }
  });
  it('rejects invaled ScanType', async () => {
    const service = new ScanService(fakeRepository);
    try {
      await service.createScan('ab-123', 'invalid' as unknown as ScanType);
      throw new Error('Expected createScan to throw');
    } catch (error) {
      const appError = getAppError(error);
      expect(appError.statusCode).toBe(400);
      expect(appError.message).toBe('Invalid Scan Type');
    }
  });
});
