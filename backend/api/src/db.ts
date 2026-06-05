const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, '../../worker/.env'),
});

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

module.exports = { pool };

// npm install express cors pg dotenv
// npm install --save-dev @types/express @types/cors @types/pg @types/node typescript ts-node

// # Create tsconfig.json
// npx tsc --init

// cd backend/api
// npx ts-node src/server.ts

// # Get all scans
// curl http://localhost:3000/scans

// # Get specific scan with vulnerabilities
// curl http://localhost:3000/scans/<scan-id>

// # Trigger a new scan
// curl -X POST http://localhost:3000/scans \
//   -H "Content-Type: application/json" \
//   -d '{"targetId": "<target-id>", "scanType": "passive"}'
