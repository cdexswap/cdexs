import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/utils/db-client';

export async function POST(req: Request) {
  try {
    const { lastPolled, user_id } = await req.json();
    const db = await getDbClient();

    // Fetch new messages and notifications since last poll
    const [messages, notifications] = await Promise.all([
      // Get new chat messages for user
      db.collection('messages')
        .find({
          timestamp: { $gt: new Date(lastPolled) },
          $or: [{ sender: user_id }, { recipient: user_id }]
        })
        .toArray(),

      // Get new payment notifications for user
      db.collection('notifications')
        .find({
          timestamp: { $gt: new Date(lastPolled) },
          user_id: user_id
        })
        .toArray()
    ]);

    return NextResponse.json({
      messages,
      notifications,
      lastPolled: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}
