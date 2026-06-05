-- Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS
-- =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- TARGETS (verified websites)
-- =====================
CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ownership_method TEXT NOT NULL CHECK (
    ownership_method IN ('dns', 'file', 'meta')
  ),
  verification_token TEXT NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_targets_user_id ON targets(user_id);

-- =====================
-- SCANS (job queue)
-- =====================
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'running', 'finished', 'failed', 'canceled')
  ),
  scan_type TEXT NOT NULL CHECK (
    scan_type IN ('passive', 'active', 'full')
  ),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_target_id ON scans(target_id);

-- =====================
-- SCAN TOOLS (per-scan tool execution)
-- =====================
CREATE TABLE scan_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL CHECK (
    tool_name IN ('zap', 'nmap', 'nikto', 'ffuf')
  ),
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'running', 'finished', 'failed')
  ),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  exit_code INTEGER
);

CREATE INDEX idx_scan_tools_scan_id ON scan_tools(scan_id);

-- =====================
-- VULNERABILITIES (normalized findings)
-- =====================
CREATE TABLE vulnerabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (
    severity IN ('critical', 'high', 'medium', 'low', 'info')
  ),
  confidence TEXT NOT NULL CHECK (
    confidence IN ('high', 'medium', 'low')
  ),
  asset_type TEXT NOT NULL,
  asset_value TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  remediation TEXT,
  first_seen TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
