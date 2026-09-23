export type OwnershipMethod = 'dns' | 'file' | 'meta';

export type ScanStatus =
  | 'queued'
  | 'running'
  | 'finished'
  | 'failed'
  | 'canceled';
export type ScanType = 'passive' | 'active' | 'full';

export type ToolName = 'zap' | 'nmap' | 'nikto' | 'ffuf';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'high' | 'medium' | 'low';

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type TargetRow = {
  id: string;
  user_id: string;
  url: string;
  ownership_method: OwnershipMethod;
  verification_token: string;
  verified_at: string | null;
  created_at: string;
};

export type ScanRow = {
  id: string;
  target_id: string;
  status: ScanStatus;
  scan_type: ScanType;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
};
export type ScanWithTarget = ScanRow & {
  target_url: string;
};
export type ScanToolRow = {
  id: string;
  scan_id: string;
  tool_name: ToolName;
  status: 'queued' | 'running' | 'finished' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
};

export type VulnerabilityRow = {
  id: string;
  scan_id: string;
  tool_name: string;
  category: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  asset_type: string;
  asset_value: string;
  description: string | null;
  impact: string | null;
  remediation: string | null;
  first_seen: string;
};

export type AppError = Error & {
  statusCode?: number;
};
export type ScanDetails = {
  scan: ScanWithTarget;
  tools: ScanToolRow[];
  vulnerabilities: VulnerabilityRow[];
};
export type ScanStatsRow = {
  severity: Severity;
  count: string;
};

export type ScanRepositoryPort = {
  getAllScans(): Promise<ScanWithTarget[]>;
  getScanById(id: string): Promise<ScanDetails>;
  createScan(targetId: string, scanType: ScanType): Promise<ScanRow>;
  getScanStats(id: string): Promise<ScanStatsRow[]>;
};
export function createAppError(message: string, statusCode: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}
