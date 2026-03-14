require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const mongoose = require("mongoose");
const { Pool } = require("pg");

console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ found" : "❌ missing");
console.log("PG_HOST:", process.env.PG_HOST ? "✅ found" : "❌ missing");

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => { console.log("✅ MongoDB connected"); mongoose.disconnect(); })
    .catch((err) => console.error("❌ MongoDB failed:", err.message));

const pool = new Pool({
    host: process.env.PG_HOST,
    port: 5432,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

pool.connect()
    .then((client) => { console.log("✅ PostgreSQL connected"); client.release(); pool.end(); })
    .catch((err) => console.error("❌ PostgreSQL failed:", err.message));