import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Message } from '@/lib/models/message';

// GET /api/chat - Get chat messages
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const messages = await Message.find({ orderId })
      .sort({ created_at: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Send a new message
export async function POST(request: Request) {
  console.log('POST request received');
  // try {
    await connectDB();

    const messageData = await request.json();
    console.log('Request data:', messageData);

    // Validate required fields
    const requiredFields = ['sender', 'receiver', 'orderId'];
    const hasContentOrAttachment = messageData.content || messageData.attachment;
    const missingFields = requiredFields.filter(field => !messageData[field]);
    
    if (missingFields.length > 0 || !hasContentOrAttachment) {
      const missing = [...missingFields];
      if (!hasContentOrAttachment) missing.push('content or attachment');
      console.log('Missing required fields:', missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }
    console.log('All required fields present');
    // Create message with validated data
    const messagePayload: {
      sender: string;
      receiver: string;
      orderId: string;
      content?: string;
      attachment?: {
        url: string;
        type: 'image/jpeg' | 'image/png' | 'image/gif';
        filename?: string;
        size?: number;
      };
      status: 'sent' | 'delivered' | 'read';
    } = {
      sender: messageData.sender,
      receiver: messageData.receiver,
      orderId: messageData.orderId,
      status: 'sent'
    };

    // Only add content if it exists
    if (messageData.content) {
      messagePayload.content = messageData.content;
    }
    
    // Only add attachment if it exists
    if (messageData.attachment) {
      messagePayload.attachment = messageData.attachment;
    }
    console.log('Message payload:', messagePayload);
    const message = await Message.create(messagePayload);
    console.log('Message created:', message);

    return NextResponse.json(message, { status: 201 });
  } 

// PATCH /api/chat - Mark messages as read
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Order ID and User ID are required' },
        { status: 400 }
      );
    }

    const result = await Message.updateMany(
      {
        orderId,
        receiver: userId,
        status: { $ne: 'read' }
      },
      { $set: { status: 'read' } }
    );

    return NextResponse.json({
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update messages' },
      { status: 500 }
    );
  }
}
