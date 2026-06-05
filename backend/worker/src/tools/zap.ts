import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

export interface ZapResult {
  success: boolean;
  rawOutput?: string;
  jsonReport?: any;
  findings?: ZapFinding[];
  error?: string;
  exitCode?: number;
  durationMs: number;
}

export interface ZapFinding {
  pluginid: string;
  alert: string;
  name: string;
  riskcode: string;
  confidence: string;
  riskdesc: string;
  desc: string;
  instances: Array<{
    uri: string;
    method: string;
    param: string;
    attack: string;
    evidence: string;
  }>;
  count: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid: string;
  sourceid: string;
}

export async function runZap(targetUrl: string): Promise<ZapResult> {
  const startTime = Date.now();
  const workDir = path.join('/tmp', `zap-${uuidv4()}`);
  const reportPath = path.join(workDir, 'report.json');

  try {
    await fs.mkdir(workDir, { recursive: true });

    console.log(`[ZAP] Starting scan for ${targetUrl}`);
    console.log(`[ZAP] Work directory: ${workDir}`);

    const exitCode = await new Promise<number>((resolve, reject) => {
      const zap = spawn('docker', [
        'run',
        '--rm',
        '-v',
        `${workDir}:/zap/wrk:rw`,
        'ghcr.io/zaproxy/zaproxy:stable',
        'zap-baseline.py',
        '-t',
        targetUrl,
        '-J',
        'report.json',
        '-I',
        '-m',
        '2', // 2 minute timeout
      ]);

      let stdout = '';
      let stderr = '';

      zap.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`[ZAP] ${data.toString().trim()}`);
      });

      zap.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      zap.on('close', (code) => {
        console.log(`[ZAP] Process exited with code ${code}`);
        resolve(code || 0);
      });

      zap.on('error', (err) => {
        console.error(`[ZAP] Spawn error:`, err);
        reject(err);
      });
    });

    // Read report
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const jsonReport = JSON.parse(reportContent);
    const findings = extractFindings(jsonReport);
    const durationMs = Date.now() - startTime;

    console.log(
      `[ZAP] Completed in ${(durationMs / 1000).toFixed(1)}s, found ${findings.length} alerts`,
    );

    await fs.rm(workDir, { recursive: true, force: true });

    return {
      success: exitCode === 0 || exitCode === 1,
      jsonReport,
      findings,
      exitCode,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[ZAP] Error:`, err);

    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {}

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      exitCode: -1,
      durationMs,
    };
  }
}

function extractFindings(jsonReport: any): ZapFinding[] {
  try {
    const site = jsonReport.site?.[0];
    if (!site || !site.alerts) {
      return [];
    }
    return site.alerts;
  } catch (err) {
    console.error('[ZAP] Failed to extract findings:', err);
    return [];
  }
}
