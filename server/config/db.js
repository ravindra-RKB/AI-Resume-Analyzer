const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic.
 * Non-blocking: server starts regardless of DB status.
 */
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-analyzer';

  // Connection options
  const options = {
    serverSelectionTimeoutMS: 5000,   // 5s timeout for initial connection
    socketTimeoutMS: 45000,           // close sockets after 45s of inactivity
    bufferCommands: false,            // fail immediately if not connected (don't buffer)
  };

  console.log('[DB] Connecting to MongoDB...');
  console.log(`[DB] URI: ${MONGODB_URI.replace(/\/\/(.+):(.+)@/, '//$1:****@')}`); // mask password

  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Connected to MongoDB');

    // Log connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    return true;
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    console.warn('⚠️  Server is running but database features will not work.');
    console.warn('');
    console.warn('   Common fixes:');
    console.warn('   1. Whitelist your IP in MongoDB Atlas → Network Access');
    console.warn('   2. Check your MONGODB_URI in .env');
    console.warn('   3. Ensure your MongoDB instance is running');
    console.warn('');
    return false;
  }
}

/**
 * Check if MongoDB is currently connected.
 * @returns {boolean}
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected };
