const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI)
      throw new Error("MONGO_URI is not defined in environment variables");
    const con = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${con.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;