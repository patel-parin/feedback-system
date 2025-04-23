import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provide a MongoDB connection string?",
  );
}

const MONGODB_URI = process.env.MONGODB_URI as string;
const options = {};

// Global variable to store the connection for reuse between serverless function invocations
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;
let isConnected = false;

// MongoDB connection with connection caching for serverless environments
export const client = new MongoClient(MONGODB_URI, options);
export const connectDB = async () => {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    // If no cached connection, create a new one
    if (!cachedClient) {
      cachedClient = await MongoClient.connect(MONGODB_URI, options);
      console.log('New MongoDB connection established');
    } else {
      console.log('Using cached MongoDB connection');
    }

    const db = cachedClient.db();
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't call process.exit in serverless environments
    throw new Error('Failed to connect to MongoDB');
  }
};

// Mongoose connection with connection caching for serverless environments
export const connectMongoose = async () => {
  // If we're already connected, reuse the connection
  if (mongoose.connection.readyState === 1 && isConnected) {
    console.log('Using existing Mongoose connection');
    return;
  }

  try {
    // Set mongoose options to work well in serverless environments
    mongoose.set("strictQuery", false);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('New Mongoose connection established');
  } catch (error) {
    console.error('Mongoose connection error:', error);
    // Don't call process.exit in serverless environments
    throw new Error('Failed to connect to MongoDB with Mongoose');
  }
};

// Helper function to convert string IDs to ObjectId
export const toObjectId = (id: string) => new ObjectId(id);

// Helper function to safely convert MongoDB _id to string id
export const fromMongoDocument = <T extends Record<string, any>>(doc: any): T => {
  if (!doc) return null as any;
  
  const result = { ...doc } as any;
  
  // Convert _id to id
  if (result._id) {
    result.id = result._id.toString();
    delete result._id;
  }
  
  return result as T;
};