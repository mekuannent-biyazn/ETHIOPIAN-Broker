// server.js - Server startup with socket.io
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables FIRST

const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const { scheduleCron } = require("./utils/cronJobs");

// Import the app from app.js
const app = require("./app");

const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true,
//   },
// });
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.io connection handling
io.on("connection", async (socket) => {
  console.log("✅ User connected:", socket.userId, "Socket ID:", socket.id);

  if (socket.userId) {
    socket.join(socket.userId);
    console.log(`📡 User ${socket.userId} joined their personal room`);

    // Update user online status
    try {
      const User = require("./models/userModel");
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
        socketId: socket.id,
      });

      // Broadcast online status to all users
      socket.broadcast.emit("user-status-changed", {
        userId: socket.userId,
        isOnline: true,
        lastSeen: new Date(),
      });

      console.log(`🟢 User ${socket.userId} is now online`);
    } catch (error) {
      console.error("Error updating user online status:", error);
    }
  }

  // Handle typing events with improved responsiveness
  socket.on("start-typing", (data) => {
    console.log(
      "⌨️ Typing started from:",
      socket.userId,
      "to:",
      data.receiverId,
    );
    socket.to(data.receiverId).emit("user-typing", {
      userId: socket.userId,
      isTyping: true,
      timestamp: new Date(),
    });
  });

  socket.on("stop-typing", (data) => {
    console.log(
      "⌨️ Typing stopped from:",
      socket.userId,
      "to:",
      data.receiverId,
    );
    socket.to(data.receiverId).emit("user-typing", {
      userId: socket.userId,
      isTyping: false,
      timestamp: new Date(),
    });
  });

  // Enhanced message delivery with status updates
  socket.on("newMessage", async (data) => {
    console.log("💬 New message from:", socket.userId, "to:", data.receiverId);

    // Emit to receiver
    socket.to(data.receiverId).emit("newMessage", data);

    // Mark message as delivered if receiver is online
    try {
      const Message = require("./models/Message");
      const User = require("./models/userModel");

      const receiver = await User.findById(data.receiverId);
      if (receiver && receiver.isOnline) {
        await Message.findByIdAndUpdate(data._id, {
          messageStatus: "delivered",
          deliveredAt: new Date(),
        });

        // Notify sender about delivery
        socket.emit("message-delivered", {
          messageId: data._id,
          deliveredAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating message delivery status:", error);
    }
  });

  // Handle message delivery confirmation
  socket.on("message-delivered", async (data) => {
    try {
      const Message = require("./models/Message");
      await Message.findByIdAndUpdate(data.messageId, {
        messageStatus: "delivered",
        deliveredAt: new Date(),
      });

      // Notify sender
      socket.to(data.senderId).emit("message-delivered", {
        messageId: data.messageId,
        deliveredAt: new Date(),
      });
    } catch (error) {
      console.error("Error confirming message delivery:", error);
    }
  });

  // Handle message read confirmation
  socket.on("message-read", async (data) => {
    try {
      const Message = require("./models/Message");
      await Message.findByIdAndUpdate(data.messageId, {
        messageStatus: "read",
        isRead: true,
        readAt: new Date(),
      });

      // Notify sender
      socket.to(data.senderId).emit("message-read", {
        messageId: data.messageId,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Error confirming message read:", error);
    }
  });

  // Handle message reactions
  socket.on("messageReactionUpdated", (data) => {
    socket.to(data.targetUserId).emit("messageReactionUpdated", data);
  });

  // Handle message editing
  socket.on("messageEdited", (data) => {
    socket.to(data.targetUserId).emit("messageEdited", data);
  });

  // Handle message deletion
  socket.on("messageDeleted", (data) => {
    socket.to(data.targetUserId).emit("messageDeleted", data);
  });

  // Handle user going offline
  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.userId);

    if (socket.userId) {
      try {
        const User = require("./models/userModel");
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: null,
        });

        // Broadcast offline status
        socket.broadcast.emit("user-status-changed", {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        console.log(`🔴 User ${socket.userId} is now offline`);
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    }
  });
});

// Attach io to the app instance
app.io = io;

// Connect to database and start server
const PORT = process.env.PORT || 9000;

(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    scheduleCron();
    console.log("✅ Cron jobs scheduled");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
})();
