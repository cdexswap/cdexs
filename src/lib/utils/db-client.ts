import mongoose from 'mongoose';
import connectDB from '../db';

let dbClient: mongoose.Connection | null = null;

export const getDbClient = async () => {
  if (!dbClient) {
    await connectDB();
    dbClient = mongoose.connection;
  }
  return dbClient;
};
