// backend/worker/src/seed.ts
import { pool } from './db';

// Schema SQL (from your schema.sql file)
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS targets (
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

CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);

CREATE TABLE IF NOT EXISTS scans (
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

CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_target_id ON scans(target_id);

CREATE TABLE IF NOT EXISTS scan_tools (
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

CREATE INDEX IF NOT EXISTS idx_scan_tools_scan_id ON scan_tools(scan_id);

CREATE TABLE IF NOT EXISTS vulnerabilities (
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

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
`;

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    //   //  🔥 RESET DATABASE (for repeatable tests)
    // await client.query(`
    //     TRUNCATE TABLE
    //       vulnerabilities,
    //       scan_tools,
    //       scans,
    //       targets,
    //       users
    //     RESTART IDENTITY
    //     CASCADE
    //   `);
    // console.log('✓ Database truncated');

    //Create schema if not exists
    await client.query(SCHEMA_SQL);
    console.log('✓ Schema ensured');

    // Insert seed data
    const user = await client.query(
      `INSERT INTO users(email, password_hash) 
       VALUES('test@example.com', 'hash') 
       RETURNING id`,
    );

    const userId = user.rows[0].id;

    const target = await client.query(
      `INSERT INTO targets(user_id, url, ownership_method, verification_token, verified_at)
       VALUES($1, 'https://naseberry.ai', 'dns', 'token', NOW())
       RETURNING id`,
      [userId],
    );

    const targetId = target.rows[0].id;

    await client.query(
      `INSERT INTO scans(target_id, status, scan_type) 
       VALUES($1, 'queued', 'full')`,
      [targetId],
    );

    await client.query('COMMIT');
    console.log('✓ Seed data inserted');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error seeding data:', e);
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
