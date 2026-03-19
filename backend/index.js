require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");

const connectMongo        = require("./config/db.mongo");
const { connectPostgres } = require("./config/db.postgres");
const errorHandler        = require("./middleware/error.middleware");
const { apiLimiter }      = require("./middleware/rateLimit.middleware");

const authRoutes        = require("./routes/auth.routes");
const cpRoutes          = require("./routes/cp.routes");
const aiRoutes          = require("./routes/ai.routes");
const schedulerRoutes   = require("./routes/scheduler.routes");
const marketplaceRoutes = require("./routes/marketplace.routes");

const app = express();

// ─── CORS first — always before helmet ───────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(helmet({ crossOriginResourcePolicy: false, crossOriginOpenerPolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiter ─────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health Check ─────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success:     true,
    message:     "Orbit API is running",
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/cp",          cpRoutes);
app.use("/api/ai",          aiRoutes);
app.use("/api/scheduler",   schedulerRoutes);
app.use("/api/marketplace", marketplaceRoutes);

// ─── 404 ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectMongo();

    try {
      await connectPostgres();
    } catch (pgErr) {
      console.warn("⚠️  PostgreSQL skipped (fix DATABASE_URL in .env):", pgErr.message);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Orbit backend running on port ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health\n`);
    });

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    process.exit(1);
  }
};

start();


// Your current Atlas checklist

//While you're in Atlas GUI, do these three things in order:

//1. Whitelist IP** — Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)

//2. Fix your URI** — go to Clusters → Connect → Drivers → copy the connection string. Make sure your `.env` has `/orbit` in it:

// MONGO_URI=mongodb+srv://user1:example123@orbit-cluster.pljmmqd.mongodb.net/orbit?retryWrites=true&w=majority