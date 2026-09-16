const mongoose = require('mongoose');

// Connects to MongoDB using the connection string in .env (MONGO_URI).
// Exits the process if the connection fails, since the API is useless without a DB.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
