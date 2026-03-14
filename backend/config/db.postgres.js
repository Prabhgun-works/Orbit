const { Pool } = require("pg");

// Connection pool — reused across all queries
const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl:      { rejectUnauthorized: false }, // Required for Supabase
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected (Supabase)");
    client.release(); // Release back to pool after test
  } catch (error) {
    console.error(`❌ PostgreSQL failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectPostgres };
