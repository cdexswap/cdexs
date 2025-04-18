import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

// Define User Schema
const UserSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  wallet_address: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  avatar_url: {
    type: String,
    required: false,
  },
  referral_code: {
    type: String,
    required: true,
    unique: true,
  },
  referred_by: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Create User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// GET /api/users - Get user by wallet address or user ID
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const userId = searchParams.get('userId');
    const referralCode = searchParams.get('referralCode');

    if (!walletAddress && !userId && !referralCode) {
      return NextResponse.json(
        { error: 'Wallet address, user ID, or referral code is required' },
        { status: 400 }
      );
    }

    let query = {};
    if (walletAddress) {
      query = { wallet_address: walletAddress };
    } else if (userId) {
      query = { user_id: userId };
    } else {
      query = { referral_code: referralCode };
    }

    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    // Generate user_id
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    body.user_id = `USER${timestamp}${randomStr}`;

    // Generate referral code if not provided
    if (!body.referral_code) {
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      body.referral_code = referralCode;
    }

    const user = await User.create(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users - Update user
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { 
        ...body,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}
