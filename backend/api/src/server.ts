import express = require('express');
const cors = require('cors');

const { pool } = require('./db.ts');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Gwt all scans for a target
app.get('/scans', async (req, res) => {
  console.log('hits endpoint');
  try {
    const result = await pool.query(`
		SELECT s.*, t.url as target_url
		FROM scans s
		JOIN targets t ON s.target_id = t.id
		ORDER BY s.created_at DESC
		`);
    console.log(res);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: errorMessage });
  }
});

// Get Scan details
app.get('/scans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scan = await pool.query(
      `
			SELECT s.*, t.url as target_url
			FROM scans s
			JOIN targets t ON s.target_id = t.id
			WHERE s.id=$1
			`,
      [id],
    );
    if (scan.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    const tools = await pool.query(
      `
				SELECT * FROM scan_tools WHERE scan_id=$1 ORDER BY tool_name`,
      [id],
    );
    const vulns = await pool.query(
      `
				 SELECT * FROM vulnerabilities WHERE scan_id=$1
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
    res.json({
      scan: scan.rows[0],
      tools: tools.rows,
      vulnerabilities: vulns.rows,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: errorMessage });
  }
});

// Create new scan
app.post('/scans', async (req, res) => {
  try {
    const { targetId, scanType } = req.body;
    const result = await pool.query(
      `
			INSERT INTO scans(target_id, status, scan_type)
			VALUES($1,'queued',$2)
			RETURNING *
			`,
      [targetId, scanType],
    );
    res.json(result.rows[0]);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: errorMessage });
  }
});

// Get Vuln stats
app.get('/scans/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await pool.query(
      `
		SELECT severity, COUNT(*) as count
		FROM vulnerabilities
		WHERE scan_id = $1
		GROUP BY severity
		`,
      [id],
    );

    res.json(stats.rows);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
