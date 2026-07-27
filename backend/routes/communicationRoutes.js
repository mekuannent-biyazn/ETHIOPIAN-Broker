const express = require("express");
const router = express.Router();
const communicationController = require("../controllers/communicationController");
const { protect } = require("../middleware/authMiddleware");
const { upload, handleUploadErrors } = require("../middleware/upload");

// Apply authentication to all routes
router.use(protect);

// Message routes - FIXED: Match frontend API calls exactly
router.post(
  "/send",
  upload.single("file"),
  handleUploadErrors,
  communicationController.sendMessage,
);
router.get("/conversations", communicationController.getMyConversations);
router.get("/conversation/:userId", communicationController.getConversation);
router.patch("/message/:messageId/read", communicationController.markAsRead);
router.patch(
  "/conversation/:userId/read",
  communicationController.markConversationAsRead,
);
router.get("/unread-count", communicationController.getUnreadCount); // ✅ This matches frontend call

// Advanced features
router.patch(
  "/message/:messageId/reaction",
  communicationController.addReaction,
);
router.put("/messages/:messageId/edit", communicationController.editMessage);
router.delete(
  "/messages/:messageId/delete",
  communicationController.deleteMessage,
);
router.get("/stats", communicationController.getMessageStats);

// Real-time features
router.post("/online-status", communicationController.updateOnlineStatus);
router.get("/online-users", communicationController.getOnlineUsers);
router.post("/mark-delivered", communicationController.markMessagesAsDelivered);

// Search
router.get("/search", communicationController.searchMessages);

// File handling
router.get(
  "/message/:messageId/download",
  communicationController.downloadFile,
);
router.get("/download/:messageId/file", communicationController.serveFile);
// Direct file access route (for images and documents)
router.get("/file/:messageId", communicationController.getFile);

module.exports = router;
