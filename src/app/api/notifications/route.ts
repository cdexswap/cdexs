import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

// Define Notification Schema
const NotificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Create Notification model
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// GET /api/notifications - Get notifications for a user
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required (use either userId or user_id parameter)' },
        { status: 400 }
      );
    }

    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { notification_ids } = body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    const result = await Notification.updateMany(
      { notification_id: { $in: notification_ids } },
      { $set: { read: true } }
    );

    return NextResponse.json({
      message: 'Notifications updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    // Generate notification_id
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    body.notification_id = `NOTIF${timestamp}${randomStr}`;

    const notification = await Notification.create(body);
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create notification' },
      { status: 500 }
    );
  }
}
