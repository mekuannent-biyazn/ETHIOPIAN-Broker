const mongoose = require("mongoose");

const contactMessageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === "") return true; // Phone is optional
          return /^(\+2519|09)\d{8}$/.test(v);
        },
        message: 'Phone number must be in Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)'
      }
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: [
        "real-estate-inquiry",
        "automotive-inquiry", 
        "electronics-inquiry",
        "list-property",
        "sell-vehicle",
        "sell-electronics",
        "general-question",
        "support",
        "feedback"
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
    },
    status: {
      type: String,
      enum: ["new", "read", "replied", "resolved"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    repliedAt: {
      type: Date,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ subject: 1 });

// Virtual for subject display name
contactMessageSchema.virtual('subjectDisplay').get(function() {
  const subjectMap = {
    'real-estate-inquiry': 'Real Estate Inquiry',
    'automotive-inquiry': 'Automotive Inquiry',
    'electronics-inquiry': 'Electronics Inquiry',
    'list-property': 'List a Property',
    'sell-vehicle': 'Sell a Vehicle',
    'sell-electronics': 'Sell Electronics',
    'general-question': 'General Question',
    'support': 'Support',
    'feedback': 'Feedback'
  };
  return subjectMap[this.subject] || this.subject;
});

// Virtual for status display
contactMessageSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'new': 'New',
    'read': 'Read',
    'replied': 'Replied',
    'resolved': 'Resolved'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for priority display
contactMessageSchema.virtual('priorityDisplay').get(function() {
  const priorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  return priorityMap[this.priority] || this.priority;
});

// Ensure virtual fields are serialized
contactMessageSchema.set('toJSON', { virtuals: true });

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

module.exports = ContactMessage;