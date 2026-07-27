const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    fname: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
    },
    lname: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^(\+2519|09)\d{8}$/.test(v);
        },
        message: 'Phone number must start with +2519 or 09 followed by 8 digits'
      }
    },
    city: {
      type: String,
      required: [true, "Please add a city"],
      trim: true,
    },
    // FIN and Fan number fields
    nationalId: {
      type: String,
      required: [true, "Please add a FIN number"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{12}$/.test(v);
        },
        message: 'FIN number must be exactly 12 digits'
      }
    },
    tinNumber: {
      type: String,
      required: [true, "Please add a Fan number"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{16}$/.test(v);
        },
        message: 'Fan number must be exactly 16 digits'
      }
    },
    idPhotoFront: {
      type: String,
      required: [true, "Please upload ID front photo"],
    },
    idPhotoBack: {
      type: String,
      required: [true, "Please upload ID back photo"],
    },
    selfiePhoto: {
      type: String,
      required: [true, "Please upload selfie photo"],
    },
    role: {
      type: String,
      enum: [
        "client",
        "seller",
        "landlord",
        "buyer",
        "tenant",
        "admin",
        "broker",
      ],
      default: "client",
    },
    // OTP fields
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    // email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    // approval field - automatically set to true when email is verified
    isApproved: {
      type: Boolean,
      default: false,
    },
    // active status field - allows admin to activate/deactivate users
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },
    // password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Real-time communication fields
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure email is lowercase
userSchema.pre("save", function (next) {
  if (this.email && this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }

  // Automatically approve user when email is verified
  if (this.isModified("isVerified") && this.isVerified === true) {
    this.isApproved = true;
    console.log(`✅ User ${this.fname} ${this.lname} automatically approved after email verification`);
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;