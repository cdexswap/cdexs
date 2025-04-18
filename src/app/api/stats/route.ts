import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Transaction } from '@/lib/models/transaction';

export async function GET() {
  try {
    // Connect to database with error handling
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection failed:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Verify Transaction model exists
    if (!Transaction) {
      console.error('Transaction model not found');
      return NextResponse.json(
        { error: 'Database model not found' },
        { status: 500 }
      );
    }

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get daily trading volume with error handling
    let volumeResult;
    try {
      volumeResult = await Transaction.aggregate([
      {
        $match: {
          created_at: { $gte: twentyFourHoursAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$total_price' }
        }
      }
    ]);

    } catch (error) {
      console.error('Failed to fetch volume:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trading volume' },
        { status: 500 }
      );
    }

    // Get total users with error handling
    let usersResult;
    try {
      usersResult = await Transaction.aggregate([
      {
        $match: {
          created_at: { $gte: twentyFourHoursAgo }
        }
      },
      {
        $facet: {
          buyers: [{ $group: { _id: '$buyer_id' } }],
          sellers: [{ $group: { _id: '$seller_id' } }]
        }
      },
      {
        $project: {
          uniqueUsers: {
            $size: {
              $setUnion: ['$buyers._id', '$sellers._id']
            }
          }
        }
      }
    ]);

    } catch (error) {
      console.error('Failed to fetch users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      );
    }

    // Ensure we have valid results
    if (!Array.isArray(volumeResult) || !Array.isArray(usersResult)) {
      console.error('Invalid aggregation results');
      return NextResponse.json(
        { error: 'Invalid database response' },
        { status: 500 }
      );
    }

    const volume = volumeResult[0]?.totalVolume || 0;
    const users = usersResult[0]?.uniqueUsers || 0;

    // Return stats with default values if needed
    return NextResponse.json({
      volume: typeof volume === 'number' ? volume : 0,
      users: typeof users === 'number' ? users : 0,
      successRate: 99.9
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
