const mongoose = require("mongoose");

const cpCacheSchema = new mongoose.Schema(
  {
    platform: {
      type:     String,
      enum:     ["leetcode", "codeforces"],
      required: true,
    },
    username: {
      type:      String,
      required:  true,
      lowercase: true,
      trim:      true,
    },
    data: {
      type:     mongoose.Schema.Types.Mixed,
      required: true,
    },
    fetchedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

cpCacheSchema.index({ platform: 1, username: 1 }, { unique: true });
cpCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("CPCache", cpCacheSchema);