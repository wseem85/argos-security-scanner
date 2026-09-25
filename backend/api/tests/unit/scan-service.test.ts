import { describe, it, expect } from 'vitest';
import type {
  ScanDetails,
  ScanRepositoryPort,
  ScanStatsRow,
  ScanType,
  ScanWithTarget,
} from '../../src/types/domain.js';
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

// FIRST: test createservice
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
  it('creates a passive scan', async () => {
    const service = new ScanService(fakeRepository);
    const result = await service.createScan('target-123', 'passive');
    expect(result.id).toBe('scan-123');
    expect(result.target_id).toBe('target-123');
    expect(result.status).toBe('queued');
    expect(result.scan_type).toBe('passive');
  });
  it('creates a active scan', async () => {
    const service = new ScanService(fakeRepository);
    const result = await service.createScan('target-123', 'active');
    expect(result.id).toBe('scan-123');
    expect(result.target_id).toBe('target-123');
    expect(result.status).toBe('queued');
    expect(result.scan_type).toBe('active');
  });
  it('creates a full scan', async () => {
    const service = new ScanService(fakeRepository);
    const result = await service.createScan('target-123', 'full');
    expect(result.id).toBe('scan-123');
    expect(result.target_id).toBe('target-123');
    expect(result.status).toBe('queued');
    expect(result.scan_type).toBe('full');
  });
  // cheking if service pass scan data to the repository
  it('passes values to the repository', async () => {
    // set empty variables
    let receivedTargetId = '';
    let receivedScanType: ScanType | undefined;
    //   creatinf teacking repository goal is just to overwrite create scan
    //   and make it  capture values passed to the repository
    const trackingRepository: ScanRepositoryPort = {
      ...fakeRepository,
      createScan: async (targetId, scanType) => {
        receivedTargetId = targetId;
        receivedScanType = scanType;
        return fakeRepository.createScan(targetId, scanType);
      },
    };
    // check what the repo recieves from the service
    const service = new ScanService(trackingRepository);
    await service.createScan('target-123', 'active');
    expect(receivedScanType).toBe('active');
    expect(receivedTargetId).toBe('target-123');
  });

  // Test in case of the repository failed to connect database
  it('proagates repository errors', async () => {
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      createScan: async () => {
        throw new Error('Database unavailable');
      },
    };
    const service = new ScanService(repository);
    await expect(service.createScan('target-123', 'passive')).rejects.toThrow(
      'Database unavailable',
    );
  });
});

// FIRST: test getAllScans
describe('ScanService.getAllScans', async () => {
  it('returns scans from the repository', async () => {
    const expectedScans: ScanWithTarget[] = [
      {
        id: 'scan-123',
        target_id: 'target-123',
        status: 'queued',
        scan_type: 'passive',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error_message: null,
        target_url: 'https://example.com',
      },
    ];
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getAllScans: async () => expectedScans,
    };
    const service = new ScanService(repository);
    const result = await service.getAllScans();
    expect(result).toEqual(expectedScans);
  });
  it('propagates repository errors', async () => {
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getAllScans: async () => {
        throw new Error('Database unavailable');
      },
    };
    const service = new ScanService(repository);
    await expect(service.getAllScans()).rejects.toThrow('Database unavailable');
  });
});

// Third : test getScanById
describe('ScanService.getScanById', () => {
  it('returns scan details from the repository', async () => {
    const expectedScan: ScanDetails = {
      scan: {
        id: 'scan-123',
        target_id: 'target-123',
        status: 'queued',
        scan_type: 'passive',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: new Date().toISOString(),
        error_message: null,
        target_url: 'https://example.com',
      },
      tools: [],
      vulnerabilities: [],
    };
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getScanById: async (id) => {
        // check propagation does repo recieves theright id
        expect(id).toBe('scan-123'); // if no test fails
        return expectedScan;
      },
    };
    const service = new ScanService(repository);
    const result = await service.getScanById('scan-123');
    expect(result).toEqual(expectedScan);
  });
  it('propagates Scan not found errors', async () => {
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getScanById: async () => {
        throw new Error('Scan Not found');
      },
    };
    const service = new ScanService(repository);
    await expect(service.getScanById('missing-id')).rejects.toThrow(
      'Scan Not found',
    );
  });
  it('propagates Repository errors', async () => {
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getScanById: async () => {
        throw new Error('Database unavailable');
      },
    };
    const service = new ScanService(repository);
    await expect(service.getScanById('scan-123')).rejects.toThrow(
      'Database unavailable',
    );
  });
});

// Fourth : test getScanStats

describe('ScanService.getScanStats', () => {
  it('returns statistics from the repository', async () => {
    const expectedStats: ScanStatsRow[] = [
      {
        severity: 'high',
        count: '2',
      },
    ];
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getScanStats: async (id) => {
        expect(id).toBe('scan-123');
        return expectedStats;
      },
    };
    const service = new ScanService(repository);
    const result = await service.getScanStats('scan-123');
    expect(result).toEqual(expectedStats);
  });
  it('propagates repository errors', async () => {
    const repository: ScanRepositoryPort = {
      ...fakeRepository,
      getScanStats: async () => {
        throw new Error('Database unavailable');
      },
    };
    const service = new ScanService(repository);
    await expect(service.getScanStats('scan-123')).rejects.toThrow(
      'Database unavailable',
    );
  });
});
