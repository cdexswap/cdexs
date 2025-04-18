import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/utils/db-client';

export async function POST(req: Request) {
  try {
    const { transactionId, status, role, sellerId } = await req.json();
    const db = await getDbClient();

    // Update transaction status
    await db.collection('transactions').updateOne(
      { _id: transactionId },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    );

    // Create notification for payment confirmation
    if (status === 'confirmed' && role === 'buyer' && sellerId) {
      await db.collection('notifications').insertOne({
        notification_id: `${transactionId}_${Date.now()}`,
        type: 'payment',
        orderId: transactionId,
        status,
        message: 'Buyer has confirmed payment',
        receiver: sellerId,
        timestamp: new Date(),
        read: false
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
