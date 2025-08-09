import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  // This function will attempt to connect to MongoDB.
  // It will not crash the server if the MONGODB_URI is not set in the .env file.
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.warn('⚠️  MONGODB_URI is not defined in the .env file. The server will run without a database connection.');
      return; // Exit the function gracefully.
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully.');

  } catch (error) {
    const err = error as Error;
    console.error('❌ MongoDB connection failed:', err.message);
    // Continue running the server even if the database connection fails.
  }
};
