/**
 * MongoDB Connection Test
 * Verifies connection to MongoDB Atlas
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('='.repeat(70));
console.log('MONGODB CONNECTION TEST');
console.log('='.repeat(70));
console.log();

// Check if MONGO_URI exists
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('✗ ERROR: MONGO_URI not found in .env file');
  console.log();
  console.log('Please add MONGO_URI to your .env file:');
  console.log('MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
  process.exit(1);
}

// Display connection info (hide password)
const uriDisplay = MONGO_URI.replace(/:[^:@]+@/, ':****@');
console.log('Connection URI:', uriDisplay);
console.log();

// Determine connection type
if (MONGO_URI.includes('mongodb+srv://')) {
  console.log('✓ Connection Type: MongoDB Atlas (Cloud)');
} else if (MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1')) {
  console.log('✗ WARNING: Using localhost connection');
  console.log('  You should use MongoDB Atlas for production');
} else {
  console.log('✓ Connection Type: Remote MongoDB');
}
console.log();

// Attempt connection
console.log('Attempting to connect...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✓ Successfully connected to MongoDB!');
    console.log();
    
    // Get connection details
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    return admin.serverStatus();
  })
  .then((status) => {
    console.log('Server Information:');
    console.log(`  Host: ${status.host}`);
    console.log(`  Version: ${status.version}`);
    console.log(`  Uptime: ${Math.floor(status.uptime / 60)} minutes`);
    console.log();
    
    // List databases
    return mongoose.connection.db.admin().listDatabases();
  })
  .then((result) => {
    console.log('Available Databases:');
    result.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log();
    
    // Check current database
    const currentDb = mongoose.connection.db.databaseName;
    console.log(`Current Database: ${currentDb}`);
    console.log();
    
    // List collections in current database
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('Collections in current database:');
    if (collections.length === 0) {
      console.log('  (No collections yet)');
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    console.log();
    
    // Check logs collection
    return mongoose.connection.db.collection('logs').countDocuments();
  })
  .then((count) => {
    console.log(`Total log entries: ${count}`);
    console.log();
    
    console.log('='.repeat(70));
    console.log('✓ CONNECTION TEST PASSED');
    console.log('='.repeat(70));
    console.log();
    console.log('Your backend is correctly configured to use MongoDB Atlas!');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Connection failed:', error.message);
    console.log();
    
    if (error.message.includes('authentication')) {
      console.log('Authentication Error:');
      console.log('  - Check your username and password in MONGO_URI');
      console.log('  - Verify user has correct permissions in MongoDB Atlas');
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      console.log('Network Error:');
      console.log('  - Check your internet connection');
      console.log('  - Verify the cluster URL is correct');
      console.log('  - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)');
    } else {
      console.log('Error Details:', error);
    }
    
    process.exit(1);
  });
