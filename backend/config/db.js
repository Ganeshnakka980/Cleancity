const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolution for MongoDB Atlas SRV connection strings in Windows environments
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[DNS Config Warning]', err.message);
}

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.error('ERROR: MONGODB_URI is not set in environment variables.');
      process.exit(1);
    }

    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Atlas Error] Connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
