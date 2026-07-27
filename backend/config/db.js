const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI)
      throw new Error("MONGO_URI is not defined in environment variables");
    const con = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected: ${con.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Provide helpful debugging info in development
    if (process.env.NODE_ENV !== "production") {
      console.error("\n⚠️  TROUBLESHOOTING TIPS:");
      console.error("1. Check your IP is whitelisted in MongoDB Atlas:");
      console.error("   → Go to https://cloud.mongodb.com/");
      console.error("   → Select your cluster → Security → Network Access");
      console.error(
        '   → Click "+ ADD IP ADDRESS" and select "Add Current IP"',
      );
      console.error("2. Verify MONGODB_URI in backend/.env is correct");
      console.error("3. Check your internet connection");
      console.error("4. Ensure MongoDB credentials are valid");
      console.error("5. Wait 1-2 minutes after adding IP to whitelist\n");
    }

    process.exit(1);
  }
};

module.exports = connectDB;
