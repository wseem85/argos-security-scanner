import { pool } from '../db.js';
import { createAppError } from '../types/domain.js';
class ScanRepository {
  async getAllScans() {
    const result = await pool.query(`
      SELECT s.*, t.url AS target_url
      FROM scans s
      JOIN targets t ON s.target_id = t.id
      ORDER BY s.created_at DESC
    `);

    return result.rows;
  }

  async getScanById(id: string) {
    const scanResult = await pool.query(
      `
      SELECT s.*, t.url AS target_url
      FROM scans s
      JOIN targets t ON s.target_id = t.id
      WHERE s.id = $1
      `,
      [id],
    );

    if (scanResult.rows.length === 0) {
      throw createAppError('Scan not found', 404);
    }

    const toolsResult = await pool.query(
      `
      SELECT *
      FROM scan_tools
      WHERE scan_id = $1
      ORDER BY tool_name
      `,
      [id],
    );

    const vulnerabilitiesResult = await pool.query(
      `
      SELECT *
      FROM vulnerabilities
      WHERE scan_id = $1
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          WHEN 'info' THEN 5
          ELSE 6
        END
      `,
      [id],
    );

    return {
      scan: scanResult.rows[0],
      tools: toolsResult.rows,
      vulnerabilities: vulnerabilitiesResult.rows,
    };
  }

  async createScan(targetId: string, scanType: string) {
    const result = await pool.query(
      `
      INSERT INTO scans(target_id, status, scan_type)
      VALUES($1, 'queued', $2)
      RETURNING *
      `,
      [targetId, scanType],
    );

    return result.rows[0];
  }

  async getScanStats(id: string) {
    const result = await pool.query(
      `
      SELECT severity, COUNT(*) AS count
      FROM vulnerabilities
      WHERE scan_id = $1
      GROUP BY severity
      `,
      [id],
    );

    return result.rows;
  }
}

const scanRepository = new ScanRepository();

export { scanRepository };
