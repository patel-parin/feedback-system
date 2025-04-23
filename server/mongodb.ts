import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provide a MongoDB connection string?",
  );
}

const MONGODB_URI = process.env.MONGODB_URI as string;

// MongoDB connection
export const client = new MongoClient(MONGODB_URI);
export const connectDB = async () => {
  try {
    await client.connect();
    console.log('MongoDB connected successfully');
    return client.db(); // Returns the database object
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mongoose connection for schema-based models
export const connectMongoose = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Mongoose connected successfully');
  } catch (error) {
    console.error('Mongoose connection error:', error);
    process.exit(1);
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