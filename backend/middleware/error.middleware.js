const errorHandler = (err, req, res, next) => {
  let message = err.message || "Internal Server Error";
  let status  = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") console.error("💥", err);

  // Mongoose bad ObjectId
  if (err.name === "CastError")         { message = "Resource not found"; status = 404; }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
    status  = 400;
  }
  // Mongoose validation
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(". ");
    status  = 400;
  }
  // JWT
  if (err.name === "JsonWebTokenError") { message = "Invalid token";  status = 401; }
  if (err.name === "TokenExpiredError") { message = "Token expired";  status = 401; }

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
