const jwt = require("jsonwebtoken");

const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Standard response helper used in auth controller
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.publicProfile,
  });
};

module.exports = { generateToken, verifyToken, sendTokenResponse };
