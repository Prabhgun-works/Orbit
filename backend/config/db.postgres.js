const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected");
    client.release();
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { pool, connectPostgres };