import mongoose from 'mongoose';
import connectDB from '@/lib/db';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['transaction', 'system', 'message']
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export async function createNotification(params: {
  userId: string;
  type: 'transaction' | 'system' | 'message';
  message: string;
  link: string;
}) {
  await connectDB();
  
  const notification = new Notification({
    userId: params.userId,
    type: params.type,
    message: params.message,
    link: params.link
  });

  await notification.save();
  return notification;
}
