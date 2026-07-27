const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: [
        "text",
        "property_inquiry",
        "general",
        "system",
        "image",
        "document",
        "emoji",
        "mixed",
      ],
      default: "text",
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // Enhanced content structure for mixed messages (text + emojis)
    contentParts: [
      {
        type: {
          type: String,
          enum: ["text", "emoji"],
          default: "text",
        },
        value: {
          type: String,
          required: true,
        },
        position: {
          type: Number,
          default: 0,
        },
      },
    ],
    // File attachment fields
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      default: null,
    },
    // Emoji reaction
    emojiReactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Message status (Telegram-like)
    messageStatus: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    // Reply functionality
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    // Property reference
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

// Indexes
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ createdAt: 1 });
messageSchema.index({ "emojiReactions.userId": 1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

module.exports = Message;
