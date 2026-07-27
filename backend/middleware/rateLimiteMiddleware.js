const rateLimite = require("express-rate-limit");

const globalLimiter = rateLimite({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimite({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many attempts, please try again later.",
});

module.exports = { globalLimiter, authLimiter };
