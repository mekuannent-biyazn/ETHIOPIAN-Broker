

const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // Check if user is active
      if (req.user.isActive === false) {
        return res
          .status(403)
          .json({
            message:
              "Your account has been deactivated. Please contact the administrator.",
          });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Restrict to admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only" });
  }
};

// Restrict to broker
exports.broker = (req, res, next) => {
  if (req.user && req.user.role === "broker") {
    next();
  } else {
    res.status(403).json({ message: "Access denied, broker only" });
  }
};

// Restrict to admin or broker
exports.adminOrBroker = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "broker")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin or broker only" });
  }
};

// Restrict access to specific roles
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${req.user.role} cannot perform this action`,
      });
    }

    next();
  };
};
