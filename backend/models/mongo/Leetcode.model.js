const mongoose = require("mongoose");

// Stores cached CP platform responses — avoids hammering external APIs
const cpCacheSchema = new mongoose.Schema(
  {
    platform: {
      type:     String,
      enum:     ["leetcode"],
      required: true,
    },
    username: {
      type:     String,
      required: true,
      lowercase: true,
      trim:     true,
    },
    data: {
      type:     mongoose.Schema.Types.Mixed, // Flexible — different shape per platform
      required: true,
    },
    fetchedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index — one cache entry per platform+username combo
cpCacheSchema.index({ platform: 1, username: 1 }, { unique: true });

// Auto-expire documents after 24 hours (TTL index as safety net)
// Primary cache check is still done in service (1 hour), this just cleans old docs
cpCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("CPCache", cpCacheSchema);  