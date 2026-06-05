import { pool } from './db';
import { TOOLS_BY_SCAN_TYPE } from './config/tools';
import { initMongo } from './initMongo';
import { connectMongo, insertScanResult } from './mongo';
// importing ranZap
import { runZap } from './tools/zap';
// imorting normalizer
import { normalizeZapFindings } from './parsers/normalie';
import { exitCode } from 'process';
const SLEEP_TIME = 5000;
// const TOOL_SIMULATE_WORK = 3000;
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pickScan(client: any) {
  // adding target_id to the select we will pass it to the tool
  const res = await client.query(`
		SELECT id, scan_type, target_id 
		FROM scans
		WHERE status='queued'
		ORDER BY created_at
		LIMIT 1
		FOR UPDATE SKIP LOCKED 
		`);
  // FOR UPDATE locks the row so another transactions cant select it , in case two workers selected the same row at
  // the same time
  // SKIP LOCKED if the current row is already locked skip it and find another one
  return res.rows[0];
}

async function pickTool(client: any, scanId: string) {
  const res = await client.query(
    `
		SELECT id, tool_name
		FROM scan_tools
		WHERE scan_id=$1
		AND status='queued'
		ORDER BY tool_name
		LIMIT 1
		FOR UPDATE SKIP LOCKED
		`,
    [scanId],
  );

  return res.rows[0];
}
// add afunction to get the target URL
async function getTargetUrl(targetId: string): Promise<string> {
  const result = await pool.query('SELECT url FROM targets WHERE id=$1', [
    targetId,
  ]);
  if (result.rows.length === 0) {
    throw new Error(`Target ${targetId} not found!`);
  }
  return result.rows[0].url;
}
// create a function maps each tool to the function that executes it

async function executeToolAgainstTarget(toolName: string, targetUrl: string) {
  console.log(`[TOOL] Executing ${toolName} against ${targetUrl}`);
  switch (toolName) {
    case 'zap':
      return await runZap(targetUrl);
    case 'nmap':
    case 'nikto':
    case 'ffuf':
      // placehlder  for the tools we didnt implement yet
      console.log(`[TOOL] ${toolName} not implemented yet, simulating...`);
      await sleep(3000);
      return {
        success: true,
        message: `Simulated ${toolName} Scan`,
        duration: 3000,
        findings: [],
        exitCode: 0,
      };
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function processScan() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scan = await pickScan(client);
    if (!scan) {
      console.log('No scan Picked');
      await client.query('ROLLBACK');

      return;
    }

    const { id: scanId, scan_type, target_id } = scan;
    console.log(`\n[SCAN] Starting scan ${scanId} (${scan_type})`);
    // Get the target URL
    const targetUrl = await getTargetUrl(target_id);
    console.log(`[SCAN] Target: ${targetUrl}`);

    await client.query(
      `
		UPDATE scans 
		SET status='running',
		    started_at=NOW()
		WHERE id=$1
		`,
      [scanId],
    );
    // ++ get tools for the scan type
    const tools = TOOLS_BY_SCAN_TYPE[scan_type];

    // ++ insert tools into scan_tools table with status queued
    for (const tool of tools) {
      await client.query(
        `
				INSERT INTO scan_tools(scan_id,tool_name,status)
				VALUES($1,$2,'queued')
				`,
        [scanId, tool],
      );
    }
    await client.query('COMMIT');
    console.log(`Scan ${scanId} started with tools :${tools.join(',')}`);
    // add this
    let hasFailures = false;
    while (true) {
      const toolClient = await pool.connect();
      try {
        await toolClient.query('BEGIN');
        const tool = await pickTool(toolClient, scanId);
        if (!tool) {
          await toolClient.query('ROLLBACK');
          break;
        }
        await toolClient.query(
          `
					UPDATE scan_tools
					SET status = 'running',
					    started_at=NOW()
					WHERE id=$1
					`,
          [tool.id],
        );
        await toolClient.query('COMMIT');
        console.log(`\n[TOOL] Running ${tool.tool_name}...`);
        // add this
        let exitCode = 0;
        try {
          const result = await executeToolAgainstTarget(
            tool.tool_name,
            targetUrl,
          );
          // await pool.query(
          //   `
          // UPDATE scan_tools
          // SET status= 'finished',
          //     finished_at=NOW()
          // WHERE id=$1
          // `,
          //   [tool.id],
          // );
          // console.log(`Tool ${tool.tool_name} finished for Scan ${scanId}`);
          // try {
          const scanresultDB = await connectMongo();
          await insertScanResult({
            scanId,
            tool: tool.tool_name,
            // result: {
            //   message: `Simulated result for ${tool.tool_name}`,
            //   durationMs: TOOL_SIMULATE_WORK,
            //   success: true,
            // },
            // add this
            target: targetUrl,
            result,
            createdAt: new Date(),
          });

          console.log(
            `[TOOL] ${tool.tool_name} completed. Success: ${result.success}`,
          );

          // add
          // if zap , normalize and save
          if (tool.tool_name === 'zap' && result.findings) {
            const vulns = normalizeZapFindings(result.findings);
            console.log(`[TOOL] Normalized ${vulns.length} vulnerabilities`);

            for (const vuln of vulns) {
              await pool.query(
                `INSERT INTO vulnerabilities(
                  scan_id, tool_name, category, title, severity, 
                  confidence, asset_type, asset_value, description, 
                  impact, remediation
                ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                  scanId,
                  vuln.tool_name,
                  vuln.category,
                  vuln.title,
                  vuln.severity,
                  vuln.confidence,
                  vuln.asset_type,
                  vuln.asset_value,
                  vuln.description,
                  vuln.impact,
                  vuln.remediation,
                ],
              );
            }
            console.log(
              `[TOOL] ${tool.tool_name} Saved ${vulns.length} vulnerabilities to database`,
            );
          }
          exitCode = result.exitCode || 0;
          await pool.query(
            `
						UPDATE scan_tools
						SET status = 'finished',
								finished_at=NOW(),
								exit_code=$2
						WHERE id=$1
						`,
            [tool.id, exitCode],
          );
        } catch (toolError) {
          console.error(`[TOOL] ${tool.tool_name} failed`, toolError);
          hasFailures = true;
          exitCode = -1;
          await pool.query(
            `
						UPDATE scan_tools
						SET status='failed',
								finished_at=NOW(),
								exit_code=$2
						WHERE id=$1
						`,
            [tool.id, exitCode],
          );
        }
      } catch (e) {
        await toolClient.query('ROLLBACK');
        throw e;
      } finally {
        await toolClient.release();
      }
    }
    // ++
    const finalStatus = hasFailures ? 'failed' : 'finished';
    // add message in case failure and update status to mark either finished or failed
    await pool.query(
      `
		UPDATE scans 
		SET status=$2,
		    finished_at=NOW(),
				error_message=$3
		WHERE id=$1
		`,
      [scanId, finalStatus, hasFailures ? 'Some tools failed' : null],
    );
    console.log(
      `[SCAN] Scan ${scanId} completed with status: ${finalStatus}\n`,
    );
  } catch (e) {
    console.error('[Scan] Error:', e);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}
async function workerLoop() {
  await initMongo();
  console.log('Worker started');
  while (true) {
    await processScan();
    await sleep(SLEEP_TIME);
  }
}
workerLoop();
