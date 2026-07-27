const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const path = require("path");
const fs = require("fs");
const { createMessageNotification } = require("../utils/notificationHelper");

// FIXED validation function for communication rules
const validateCommunication = async (sender, receiverId) => {
  try {
    console.log("🔍 Validating communication:", {
      senderId: sender?._id,
      senderRole: sender?.role,
      receiverId: receiverId,
    });

    // Validate sender exists and has required properties
    if (!sender || !sender._id) {
      console.log("❌ Invalid sender:", sender);
      return "Invalid sender information";
    }

    // Convert to string safely
    const senderId = sender._id?.toString
      ? sender._id.toString()
      : String(sender._id);

    if (!receiverId) {
      console.log("❌ Receiver ID is required");
      return "Receiver ID is required";
    }

    const receiverIdStr = receiverId.toString
      ? receiverId.toString()
      : String(receiverId);

    // Prevent messaging yourself
    if (senderId === receiverIdStr) {
      return "Cannot message yourself";
    }

    // Fetch complete sender and receiver information from database
    const [senderFromDB, receiver] = await Promise.all([
      User.findById(senderId).select('fname lname email role isVerified isApproved phone city createdAt updatedAt'),
      User.findById(receiverId).select('fname lname email role isVerified isApproved phone city createdAt updatedAt')
    ]);

    // Debug logging to see what fields are returned
    console.log("🔍 Debug - Sender from DB:", {
      id: senderFromDB?._id,
      fname: senderFromDB?.fname,
      lname: senderFromDB?.lname,
      role: senderFromDB?.role,
      isVerified: senderFromDB?.isVerified,
      isApproved: senderFromDB?.isApproved
    });

    console.log("🔍 Debug - Receiver from DB:", {
      id: receiver?._id,
      fname: receiver?.fname,
      lname: receiver?.lname,
      role: receiver?.role,
      isVerified: receiver?.isVerified,
      isApproved: receiver?.isApproved
    });

    // TEMPORARY FIX: If isApproved is undefined but isVerified is true, set isApproved to true
    if (senderFromDB && typeof senderFromDB.isApproved === 'undefined' && senderFromDB.isVerified) {
      senderFromDB.isApproved = true;
      console.log("🔧 Fixed sender isApproved: set to true based on isVerified");
    }

    if (receiver && typeof receiver.isApproved === 'undefined' && receiver.isVerified) {
      receiver.isApproved = true;
      console.log("🔧 Fixed receiver isApproved: set to true based on isVerified");
    }

    if (!senderFromDB) {
      console.log("❌ Sender not found in database:", senderId);
      return "Sender not found";
    }

    if (!receiver) {
      console.log("❌ Receiver not found:", receiverId);
      return "Receiver not found";
    }

    const senderRole = senderFromDB.role;
    const receiverRole = receiver.role;

    console.log("👥 Communication validation:", {
      from: `${senderFromDB.fname || ""} ${senderFromDB.lname || ""} (${senderRole})`,
      to: `${receiver.fname || ""} ${receiver.lname || ""} (${receiverRole})`,
      senderApproved: senderFromDB.isApproved,
      receiverApproved: receiver.isApproved,
    });

    // Communication allowed for approved users
    const allowedCommunications = {
      client: ["broker", "admin"],
      broker: ["client", "admin", "broker"],
      admin: ["client", "broker", "admin"],
    };

    // Check if communication is allowed
    if (!allowedCommunications[senderRole]?.includes(receiverRole)) {
      const error = `Communication not allowed from ${senderRole} to ${receiverRole}`;
      console.log("❌", error);
      return error;
    }

    // Check approval status (automatically set when email is verified)
    if (!senderFromDB.isApproved) {
      console.log("⚠️ Unapproved sender trying to send message - ALLOWING FOR NOW");
    }

    if (!receiver.isApproved) {
      console.log("⚠️ Sending message to unapproved receiver - ALLOWING FOR NOW");
    }

    console.log("✅ Communication validation passed");
    return null;
  } catch (error) {
    console.error("❌ Communication validation error:", error);
    return "Error validating communication";
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      content,
      messageType = "text",
      propertyId,
      parentMessageId,
    } = req.body;

    console.log("📤 Sending message request:", {
      receiverId,
      contentLength: content?.length,
      messageType,
      fromUser: req.user?.id,
      hasFile: !!req.file,
    });

    // Validate authenticated user
    if (!req.user || !req.user.id) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Basic validation
    if (!receiverId) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: "Receiver ID is required",
      });
    }

    // Validate: either content or file must be provided
    if (!req.file && (!content || !content.trim())) {
      return res.status(400).json({
        success: false,
        error: "Either message content or a file is required",
      });
    }

    if (content && content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Message too long (max 2000 characters)",
      });
    }

    // Parse mixed content (text + emojis) like Telegram
    const parseMessageContent = (text) => {
      if (!text) return { type: "text", parts: [] };

      // Emoji regex pattern (basic Unicode emoji detection)
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const parts = [];
      let lastIndex = 0;
      let match;
      let hasEmojis = false;

      while ((match = emojiRegex.exec(text)) !== null) {
        hasEmojis = true;

        // Add text before emoji
        if (match.index > lastIndex) {
          const textPart = text.slice(lastIndex, match.index);
          if (textPart.trim()) {
            parts.push({
              type: "text",
              value: textPart,
              position: parts.length
            });
          }
        }

        // Add emoji
        parts.push({
          type: "emoji",
          value: match[0],
          position: parts.length
        });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        if (remainingText.trim()) {
          parts.push({
            type: "text",
            value: remainingText,
            position: parts.length
          });
        }
      }

      // If no emojis found, treat as plain text
      if (!hasEmojis) {
        parts.push({
          type: "text",
          value: text,
          position: 0
        });
      }

      return {
        type: hasEmojis ? "mixed" : "text",
        parts: parts
      };
    };

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: "Receiver user not found",
      });
    }

    console.log("✅ Receiver found:", {
      id: receiver._id,
      name: `${receiver.fname} ${receiver.lname}`,
      role: receiver.role,
    });

    // Validate sender information
    if (!req.user._id) {
      req.user._id = req.user.id;
    }

    // Communication validation
    const validationError = await validateCommunication(req.user, receiverId);
    if (validationError) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        error: validationError,
      });
    }

    // Validate property if provided
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          error: "Property not found",
        });
      }
    }

    // Validate parent message if provided
    if (parentMessageId) {
      const parentMessage = await Message.findById(parentMessageId);
      if (!parentMessage) {
        return res.status(404).json({
          success: false,
          error: "Parent message not found",
        });
      }
    }

    const messageData = {
      sender: req.user.id,
      receiver: receiverId,
      property: propertyId,
      parentMessage: parentMessageId,
    };

    // Handle file upload
    if (req.file) {
      messageData.fileUrl = `/uploads/messages/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.fileType = req.file.mimetype;

      if (req.file.mimetype.startsWith("image/")) {
        messageData.messageType = "image";
        messageData.content = content || "Shared an image";
      } else {
        messageData.messageType = "document";
        messageData.content = content || `Shared a document: ${req.file.originalname}`;
      }
    } else {
      // Simple text message without complex parsing
      messageData.content = content.trim();
      messageData.messageType = messageType || "text";
    }

    console.log("💾 Creating message:", {
      content: messageData.content,
      messageType: messageData.messageType,
      hasFile: !!messageData.fileUrl,
    });

    // Create and save message
    const message = new Message(messageData);
    await message.save();

    // ✅ FIXED: Use findById to get the complete message with proper _id serialization
    const savedMessage = await Message.findById(message._id)
      .populate([
        {
          path: "sender",
          select: "fname lname email role avatar isOnline _id",
        },
        {
          path: "receiver",
          select: "fname lname email role avatar isOnline _id",
        },
        { path: "property", select: "title price _id" },
        { path: "parentMessage", select: "content sender messageType _id" },
      ])
      .lean(); // ✅ Use lean() to get plain JavaScript object

    // ✅ FIXED: Ensure _id exists and is properly formatted
    if (!savedMessage._id) {
      console.error(
        "❌ CRITICAL: Message saved but _id is missing:",
        savedMessage
      );
      throw new Error(
        "Message saved but _id is missing from database response"
      );
    }

    console.log("✅ Message saved and populated:", {
      messageId: savedMessage._id,
      from: `${savedMessage.sender.fname} ${savedMessage.sender.lname}`,
      to: `${savedMessage.receiver.fname} ${savedMessage.receiver.lname}`,
      content: savedMessage.content,
      messageType: savedMessage.messageType,
      contentParts: savedMessage.contentParts,
      hasFile: !!savedMessage.fileUrl,
    });

    // ✅ CREATE NOTIFICATION FOR MESSAGE RECEIVER
    try {
      await createMessageNotification(
        savedMessage.receiver._id,
        `${savedMessage.sender.fname} ${savedMessage.sender.lname}`,
        savedMessage.conversationId
      );

      console.log(`✅ Message notification sent to ${savedMessage.receiver.fname} ${savedMessage.receiver.lname}`);
    } catch (notificationError) {
      console.error("❌ Error creating message notification:", notificationError);
      // Don't fail message sending if notification fails
    }

    // Enhanced real-time event with delivery status
    if (req.app.get("io")) {
      const io = req.app.get("io");

      // Send message to receiver
      io.to(receiverId.toString()).emit("newMessage", {
        ...savedMessage,
        receiverId: receiverId.toString(),
        senderId: req.user.id
      });

      // Check if receiver is online for immediate delivery status
      const receiverUser = await User.findById(receiverId);
      if (receiverUser && receiverUser.isOnline) {
        // Update message as delivered
        await Message.findByIdAndUpdate(savedMessage._id, {
          messageStatus: "delivered",
          deliveredAt: new Date()
        });

        // Notify sender about delivery
        io.to(req.user.id).emit("message-delivered", {
          messageId: savedMessage._id,
          deliveredAt: new Date()
        });
      }

      console.log("📡 Real-time message sent to:", receiverId);
    }

    // ✅ FIXED: Return the lean message object with proper _id
    res.status(201).json({
      success: true,
      message: req.file
        ? "File sent successfully"
        : "Message sent successfully",
      data: savedMessage,
    });
  } catch (error) {
    console.error("❌ Send message error:", error);

    // Clean up uploaded file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Cleaned up uploaded file due to error");
      } catch (fileError) {
        console.error("Error cleaning up file:", fileError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log(
      "💬 Getting conversation with:",
      userId,
      "for user:",
      req.user.id
    );

    // Validate user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    })
      .populate([
        {
          path: "sender",
          select: "fname lname email role avatar isOnline _id",
        }, // ✅ Added _id
        {
          path: "receiver",
          select: "fname lname email role avatar isOnline _id",
        }, // ✅ Added _id
        { path: "property", select: "title price images _id" }, // ✅ Added _id
        { path: "parentMessage", select: "content sender messageType _id" }, // ✅ Added _id
        { path: "emojiReactions.userId", select: "fname lname _id" }, // ✅ Added _id
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // ✅ Added lean() for proper serialization

    console.log(`📨 Found ${messages.length} messages in conversation`);

    // ✅ Validate and ensure all messages have _id
    const validatedMessages = messages.map((message, index) => {
      if (!message._id) {
        console.warn(
          `❌ Message at index ${index} missing _id, generating temporary ID`
        );
        message._id = `db-temp-${Date.now()}-${index}`;
        message.hasTempId = true;
      }

      // ✅ Ensure populated fields also have _id
      if (message.sender && !message.sender._id) {
        message.sender._id =
          message.sender.id || `sender-temp-${Date.now()}-${index}`;
      }
      if (message.receiver && !message.receiver._id) {
        message.receiver._id =
          message.receiver.id || `receiver-temp-${Date.now()}-${index}`;
      }
      if (message.property && !message.property._id) {
        message.property._id =
          message.property.id || `property-temp-${Date.now()}-${index}`;
      }
      if (message.parentMessage && !message.parentMessage._id) {
        message.parentMessage._id =
          message.parentMessage.id || `parent-temp-${Date.now()}-${index}`;
      }

      return message;
    });

    // Count messages with missing IDs for debugging
    const messagesWithTempIds = validatedMessages.filter(
      (msg) => msg.hasTempId
    ).length;
    if (messagesWithTempIds > 0) {
      console.warn(
        `⚠️ ${messagesWithTempIds} messages had missing _id and were assigned temporary IDs`
      );
    }

    // Mark messages as read (only for real messages)
    const realMessageIds = validatedMessages
      .filter((msg) => !msg.hasTempId)
      .map((msg) => msg._id);

    if (realMessageIds.length > 0) {
      const updateResult = await Message.updateMany(
        {
          _id: { $in: realMessageIds },
          receiver: req.user.id,
          sender: userId,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`📖 Marked ${updateResult.modifiedCount} messages as read`);
      }
    }

    // ✅ Debug: Log message IDs for verification
    console.log(
      "🔍 Message IDs in conversation:",
      validatedMessages.map((msg) => ({
        id: msg._id,
        type: typeof msg._id,
        content: msg.content?.substring(0, 30) || "No content",
        hasTempId: msg.hasTempId || false,
      }))
    );

    res.json({
      success: true,
      data: validatedMessages.reverse(), // Reverse to get chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
        totalMessages: validatedMessages.length,
        messagesWithTempIds: messagesWithTempIds,
      },
    });
  } catch (error) {
    console.error("❌ Get conversation error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const userId = new mongoose.Types.ObjectId(req.user.id);

    console.log("💼 Getting conversations for user:", req.user.id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalMessages: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      {
        $sort: { lastActivity: -1 },
      },
      {
        $project: {
          _id: 1,
          lastMessage: {
            _id: 1,
            content: 1,
            messageType: 1,
            createdAt: 1,
            isRead: 1,
            sender: 1,
            receiver: 1,
            fileUrl: 1,
            fileName: 1,
            fileSize: 1,
            fileType: 1,
            isEdited: 1,
            editedAt: 1,
          },
          unreadCount: 1,
          totalMessages: 1,
          lastActivity: 1,
        },
      },
    ]);

    console.log("📊 Found conversations:", conversations.length);

    // Get user details for all conversation partners
    const userIds = conversations.map((conv) => conv._id).filter((id) => id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id fname lname email role isApproved avatar isOnline createdAt")
      .lean();

    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user;
      return map;
    }, {});

    // Create populated conversations with validation
    const populatedConversations = conversations
      .map((conv) => {
        const user = userMap[conv._id.toString()];
        if (!user) {
          console.warn("⚠️ Conversation user not found:", conv._id);
          return null;
        }

        // ✅ Ensure lastMessage has required fields including _id
        const lastMessage = conv.lastMessage || {};
        if (!lastMessage._id) {
          console.warn(
            "❌ Last message missing _id for conversation:",
            conv._id
          );
          lastMessage._id = `conv-temp-${Date.now()}-${conv._id}`;
          lastMessage.hasTempId = true;
        }

        // ✅ Ensure sender and receiver have _id
        if (lastMessage.sender && !lastMessage.sender._id) {
          lastMessage.sender._id = lastMessage.sender.toString();
        }
        if (lastMessage.receiver && !lastMessage.receiver._id) {
          lastMessage.receiver._id = lastMessage.receiver.toString();
        }

        return {
          user: user,
          lastMessage: lastMessage,
          unreadCount: conv.unreadCount || 0,
          totalMessages: conv.totalMessages || 0,
          lastActivity: conv.lastActivity,
        };
      })
      .filter((conv) => conv !== null);

    // Count conversations with temporary message IDs
    const conversationsWithTempIds = populatedConversations.filter(
      (conv) => conv.lastMessage.hasTempId
    ).length;

    if (conversationsWithTempIds > 0) {
      console.warn(
        `⚠️ ${conversationsWithTempIds} conversations have messages with temporary IDs`
      );
    }

    // Get total unread count
    const totalUnread = await Message.countDocuments({
      receiver: userId,
      isRead: false,
    });

    console.log("✅ Returning conversations:", populatedConversations.length);

    res.json({
      success: true,
      data: {
        conversations: populatedConversations,
        totalUnread,
        currentUser: {
          _id: req.user.id,
          role: req.user.role,
        },
        metadata: {
          conversationsWithTempIds,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get conversations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load conversations",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.json({
        success: true,
        message: "Temporary message marked as read locally",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      receiver: req.user.id,
    }).populate('sender', '_id');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    // Update message status
    message.isRead = true;
    message.readAt = new Date();
    message.messageStatus = "read";
    await message.save();

    // Send real-time read receipt to sender
    if (req.app.get("io") && message.sender) {
      req.app.get("io").to(message.sender._id.toString()).emit("message-read", {
        messageId: messageId,
        readAt: message.readAt,
        readBy: req.user.id
      });
    }

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const readAt = new Date();

    const result = await Message.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: readAt,
        messageStatus: "read"
      }
    );

    // Send real-time read receipts for all messages
    if (result.modifiedCount > 0 && req.app.get("io")) {
      req.app.get("io").to(userId).emit("conversation-read", {
        readBy: req.user.id,
        readAt: readAt,
        messageCount: result.modifiedCount
      });
    }

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
    });
  } catch (error) {
    console.error("❌ Mark conversation as read error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("❌ Get unread count error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Advanced Features

exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.status(400).json({
        success: false,
        error: "Cannot react to temporary message",
      });
    }

    if (!emoji) {
      return res.status(400).json({
        success: false,
        error: "Emoji is required",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    // Remove existing reaction from this user
    message.emojiReactions = message.emojiReactions.filter(
      (reaction) => reaction.userId.toString() !== req.user.id
    );

    // Add new reaction
    message.emojiReactions.push({
      userId: req.user.id,
      emoji: emoji,
    });

    await message.save();

    // ✅ FIXED: Use lean() for proper serialization
    const populatedMessage = await Message.findById(messageId)
      .populate("emojiReactions.userId", "fname lname _id")
      .lean();

    // Emit real-time event
    if (req.app.get("io")) {
      req.app
        .get("io")
        .to(message.sender.toString())
        .to(message.receiver.toString())
        .emit("messageReactionUpdated", {
          messageId: messageId,
          reactions: populatedMessage.emojiReactions,
        });
    }

    res.json({
      success: true,
      data: populatedMessage.emojiReactions,
    });
  } catch (error) {
    console.error("❌ Add reaction error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// EDIT MESSAGE FUNCTION
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    console.log("✏️ Editing message:", { messageId, content });

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.status(400).json({
        success: false,
        error: "Cannot edit temporary message",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Content is required",
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Message too long (max 2000 characters)",
      });
    }

    // Find message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      sender: req.user.id, // Only sender can edit
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found or not authorized",
      });
    }

    // Can only edit text messages
    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        error: "Only text messages can be edited",
      });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // ✅ FIXED: Use findById with lean() for proper serialization
    const updatedMessage = await Message.findById(messageId)
      .populate([
        {
          path: "sender",
          select: "fname lname email role avatar isOnline _id",
        },
        {
          path: "receiver",
          select: "fname lname email role avatar isOnline _id",
        },
        { path: "property", select: "title price _id" },
        { path: "parentMessage", select: "content sender messageType _id" },
        { path: "emojiReactions.userId", select: "fname lname _id" },
      ])
      .lean();

    console.log("✅ Message edited successfully:", updatedMessage._id);

    // Emit real-time event
    if (req.app.get("io")) {
      req.app
        .get("io")
        .to(updatedMessage.receiver._id.toString())
        .emit("messageEdited", {
          messageId: messageId,
          message: updatedMessage,
          editedAt: updatedMessage.editedAt,
        });
    }

    res.json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("❌ Edit message error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// DELETE MESSAGE FUNCTION
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    console.log("🗑️ Deleting message:", messageId);

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete temporary message",
      });
    }

    // Find message - user can delete their own messages or messages sent to them
    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { sender: req.user.id }, // User sent the message
        { receiver: req.user.id }, // User received the message
      ],
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    const isSender = message.sender.toString() === req.user.id;
    const receiverId = message.receiver.toString();

    // For files, also delete the physical file
    if (message.fileUrl) {
      const filePath = path.join(__dirname, "..", message.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("🗑️ Deleted file:", filePath);
        } catch (fileError) {
          console.error("Error deleting file:", fileError);
        }
      }
    }

    // Delete the message
    await Message.deleteOne({ _id: messageId });

    console.log("✅ Message deleted successfully:", messageId);

    // Emit real-time event
    if (req.app.get("io")) {
      // Notify both sender and receiver
      const roomsToNotify = [receiverId];
      if (isSender) {
        roomsToNotify.push(req.user.id);
      }

      roomsToNotify.forEach((userId) => {
        req.app.get("io").to(userId).emit("messageDeleted", {
          messageId: messageId,
          deletedBy: req.user.id,
          timestamp: new Date(),
        });
      });
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
      data: {
        messageId: messageId,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Delete message error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Update user online status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      isOnline: isOnline,
      lastSeen: new Date()
    });

    // Broadcast status change
    if (req.app.get("io")) {
      req.app.get("io").emit("user-status-changed", {
        userId: userId,
        isOnline: isOnline,
        lastSeen: new Date()
      });
    }

    res.json({
      success: true,
      message: "Online status updated"
    });
  } catch (error) {
    console.error("❌ Update online status error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({
      isOnline: true,
      _id: { $ne: req.user.id } // Exclude current user
    })
      .select('_id fname lname role avatar lastSeen')
      .lean();

    res.json({
      success: true,
      data: onlineUsers
    });
  } catch (error) {
    console.error("❌ Get online users error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Mark messages as delivered when user comes online
exports.markMessagesAsDelivered = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find undelivered messages sent to this user
    const result = await Message.updateMany(
      {
        receiver: userId,
        messageStatus: "sent"
      },
      {
        messageStatus: "delivered",
        deliveredAt: new Date()
      }
    );

    // Notify senders about delivery
    if (result.modifiedCount > 0 && req.app.get("io")) {
      const deliveredMessages = await Message.find({
        receiver: userId,
        messageStatus: "delivered",
        deliveredAt: { $gte: new Date(Date.now() - 5000) } // Last 5 seconds
      }).populate('sender', '_id');

      deliveredMessages.forEach(message => {
        req.app.get("io").to(message.sender._id.toString()).emit("message-delivered", {
          messageId: message._id,
          deliveredAt: message.deliveredAt
        });
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as delivered`
    });
  } catch (error) {
    console.error("❌ Mark messages as delivered error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

exports.getMessageStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          unreadMessages: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          sentMessages: {
            $sum: {
              $cond: [
                { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                1,
                0,
              ],
            },
          },
          receivedMessages: {
            $sum: {
              $cond: [
                { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                1,
                0,
              ],
            },
          },
          fileMessages: {
            $sum: {
              $cond: [
                { $in: ["$messageType", ["image", "document", "file"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalMessages: 0,
      unreadMessages: 0,
      sentMessages: 0,
      receivedMessages: 0,
      fileMessages: 0,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Get message stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters long",
      });
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
      $and: [
        {
          $or: [
            { content: { $regex: query, $options: "i" } },
            { fileName: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
      .populate("sender", "fname lname email role avatar isOnline _id")
      .populate("receiver", "fname lname email role avatar isOnline _id")
      .populate("property", "title price _id")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(); // ✅ Added lean()

    // ✅ Validate all messages have _id
    const validatedMessages = messages.map((message, index) => {
      if (!message._id) {
        console.warn(`Search result message missing _id at index ${index}`);
        message._id = `search-temp-${Date.now()}-${index}`;
      }
      return message;
    });

    res.json({
      success: true,
      data: validatedMessages,
    });
  } catch (error) {
    console.error("❌ Search messages error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get file download URL
exports.downloadFile = async (req, res) => {
  try {
    const { messageId } = req.params;

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.status(400).json({
        success: false,
        error: "Cannot download file from temporary message",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    if (!message.fileUrl) {
      return res.status(400).json({
        success: false,
        error: "No file attached to this message",
      });
    }

    const filePath = path.join(__dirname, "..", message.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/communication/download/${messageId}/file`,
        viewUrl: `/api/communication/file/${messageId}`, // Direct file access
        fileName: message.fileName,
        fileSize: message.fileSize,
        fileType: message.fileType,
        directUrl: `/api${message.fileUrl}`, // Static file URL (if auth not required)
        staticUrl: `${message.fileUrl}`, // For direct static access
      },
    });
  } catch (error) {
    console.error("❌ Download file error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Serve file download
exports.serveFile = async (req, res) => {
  try {
    const { messageId } = req.params;

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.status(400).json({
        success: false,
        error: "Cannot serve file from temporary message",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    if (!message || !message.fileUrl) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    const filePath = path.join(__dirname, "..", message.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found on server",
      });
    }

    res.download(filePath, message.fileName);
  } catch (error) {
    console.error("❌ Serve file error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Direct file access (for viewing images and documents)
exports.getFile = async (req, res) => {
  try {
    const { messageId } = req.params;

    // ✅ Skip if it's a temporary message ID
    if (messageId && messageId.startsWith("temp-")) {
      return res.status(400).json({
        success: false,
        error: "Cannot access file from temporary message",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    if (!message || !message.fileUrl) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    const filePath = path.join(__dirname, "..", message.fileUrl);

    if (!fs.existsSync(filePath)) {
      console.error("File not found on disk:", filePath);
      return res.status(404).json({
        success: false,
        error: "File not found on server",
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', message.fileType || 'application/octet-stream');
    res.setHeader('Content-Length', message.fileSize || fs.statSync(filePath).size);
    res.setHeader('Content-Disposition', `inline; filename="${message.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error("File stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error streaming file",
        });
      }
    });

  } catch (error) {
    console.error("❌ Get file error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
};
