const { Pool, types } = require('pg');

// Override PG DATE type parser (OID 1082) to return string directly
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});



module.exports = pool;
