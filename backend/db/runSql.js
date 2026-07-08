require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run(file) {
  const sql = fs.readFileSync(file, 'utf8');
  try {
    await pool.query(sql);
    console.log(`✅ ${file} executed successfully`);
  } catch (err) {
    console.error(`❌ Error in ${file}:`, err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node runSql.js <file.sql>');
  process.exit(1);
}
run(file);
