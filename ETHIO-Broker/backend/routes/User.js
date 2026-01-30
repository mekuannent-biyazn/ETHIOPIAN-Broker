const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserById,
  verifyEmail,
  resendVerificationEmail,
  getUserById,
  searchUsers,
  getAvailableUsers,
  getAllBrokers,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMlddleware");
const { authLimiter } = require("../middleware/rateLimiteMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");

const router = express.Router();

// Configure multer for multiple photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/id-photos/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fieldPrefix = file.fieldname; // idPhotoFront, idPhotoBack, or selfiePhoto
    cb(
      null,
      fieldPrefix + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for photos"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Public
router.post(
  "/register",
  authLimiter,
  upload.fields([
    { name: "idPhotoFront", maxCount: 1 },
    { name: "idPhotoBack", maxCount: 1 },
    { name: "selfiePhoto", maxCount: 1 },
  ]),
  validationMiddleware.validateRegistration,
  registerUser,
);
router.post(
  "/login",
  authLimiter,
  validationMiddleware.validateLogin,
  loginUser,
);
router.post("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  validationMiddleware.validateEmail,
  resendVerificationEmail,
); // To resend verification email

// public
router.post(
  "/forgot-password",
  validationMiddleware.validateEmail,
  forgotPassword,
);
router.post("/reset-password", resetPassword);
router.put(
  "/profile",
  protect,
  validationMiddleware.validateProfileUpdate,
  updateUserById,
);

router.get("/available", protect, getAvailableUsers);

// Get all brokers for admin
router.get("/brokers", protect, getAllBrokers);

// Search users based on communication rules
router.get("/search", protect, searchUsers);

// Get user by ID for chat
router.get("/:userId", protect, getUserById);

module.exports = router;
