// backend/db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();  // Loads environment variables from the .env file

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error('MONGO_URI is not set in .env file');
}

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = { connectDB, client };
