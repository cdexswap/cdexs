import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/utils/db-client';

export async function POST(req: Request) {
  try {
    const messageData = await req.json();
    const db = await getDbClient();

    // Save message to database
    const result = await db.collection('messages').insertOne({
      ...messageData,
      createdAt: new Date()
    });

    // Create notification for receiver
    await db.collection('notifications').insertOne({
      notification_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'chat',
      orderId: messageData.orderId,
      sender: messageData.sender,
      receiver: messageData.receiver,
      content: messageData.content,
      timestamp: new Date(),
      read: false
    });

    return NextResponse.json({
      success: true,
      messageId: result.insertedId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
