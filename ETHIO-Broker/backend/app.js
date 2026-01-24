// app.js - Express configuration only
const express = require("express");
const userRoute = require("./routes/User");
const adminRoute = require("./routes/adminRoute");
const propertyRouter = require("./routes/propertyRoute");
const brokerRoute = require("./routes/brokerRoute");
const communicationRoute = require("./routes/communicationRoutes");
const paymentRoute = require("./routes/paymentRoute");
const manualVerificationRoute = require("./routes/manualVerificationRoutes");
const notificationRoute = require("./routes/notificationRoute");
const contactRoute = require("./routes/contactRoute");
const { errorhandler, notfound } = require("./middleware/errorMiddleware");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/property", propertyRouter);
app.use("/api/broker", brokerRoute);
app.use("/api/communication", communicationRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/manual-verification", manualVerificationRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/contact", contactRoute);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorhandler);
app.use(notfound);

module.exports = app;
