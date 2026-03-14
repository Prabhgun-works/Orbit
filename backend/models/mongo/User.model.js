const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Name is required"],
      trim:      true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type:     String,
      required: [true, "Email is required"],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type:      String,
      minlength: [6, "Password must be at least 6 characters"],
      select:    false, // Never returned in queries by default
    },

    // OAuth
    googleId: {
      type:   String,
      unique: true,
      sparse: true, // Allows null for local-auth users
    },
    authProvider: {
      type:    String,
      enum:    ["local", "google"],
      default: "local",
    },

    // Profile
    avatar: { type: String, default: "" },
    role:   { type: String, enum: ["student", "admin"], default: "student" },
    bio:    { type: String, maxlength: 200, default: "" },

    // CP handles — filled after onboarding
    cpHandles: {
      codeforces: { type: String, default: "" },
      leetcode:   { type: String, default: "" },
    },

    // AI Coach daily usage tracking
    aiUsage: {
      dailyCount:    { type: Number, default: 0 },
      lastResetDate: { type: Date,   default: Date.now },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password on login
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Safe public profile — never expose password or sensitive fields
userSchema.virtual("publicProfile").get(function () {
  return {
    id:         this._id,
    name:       this.name,
    email:      this.email,
    avatar:     this.avatar,
    role:       this.role,
    bio:        this.bio,
    cpHandles:  this.cpHandles,
    createdAt:  this.createdAt,
  };
});

module.exports = mongoose.model("User", userSchema);
