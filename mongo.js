const mongoose = require('mongoose');

const uri = process.env.DB_URI;  // ดึงจาก .env

const connectMongoDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectMongoDB;