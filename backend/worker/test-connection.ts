const { Pool } = require('pg');
require('dotenv').config();

console.log('Environment variables:');
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
console.log(
  'POSTGRES_PASSWORD:',
  process.env.POSTGRES_PASSWORD ? '***' : 'NOT SET',
);
console.log('POSTGRES_DB:', process.env.POSTGRES_DB);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('✓ Connected successfully!');
    console.log('Current time:', res.rows[0]);
  }
  pool.end();
});
