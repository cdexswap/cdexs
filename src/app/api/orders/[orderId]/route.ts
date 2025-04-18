import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

// Define common fields for orders
const commonOrderFields = {
  order_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  rates: {
    type: Map,
    of: Number,
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  chain: {
    type: String,
    required: true,
  },
  wallet_address: {
    type: String,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
  countryCodes: {
    type: String,
    required: true,
  },
  transaction_fee: {
    type: Number,
    required: true,
  },
  expiration_time: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
};

// Define Buy Order Schema
const BuyOrderSchema = new mongoose.Schema(commonOrderFields);

// Define Sell Order Schema
const SellOrderSchema = new mongoose.Schema(commonOrderFields);

// Create models
const BuyOrder = mongoose.models.BuyOrder || mongoose.model('BuyOrder', BuyOrderSchema);
const SellOrder = mongoose.models.SellOrder || mongoose.model('SellOrder', SellOrderSchema);

// GET /api/orders/[orderId] - Get specific order
export const GET = async (request: NextRequest) => {
  console.log('GET request received at:', new Date().toISOString());
  try {
    await connectDB();
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Try to find in both buy and sell orders
    const [foundBuyOrder, foundSellOrder] = await Promise.all([
      BuyOrder.findOne({ order_id: orderId }),
      SellOrder.findOne({ order_id: orderId })
    ]);

    const foundOrder = foundBuyOrder || foundSellOrder;
    if (!foundOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Add type field based on which collection it was found in
    const orderWithType = {
      ...foundOrder.toObject(),
      type: foundBuyOrder ? 'buy' : 'sell'
    };

    return NextResponse.json(orderWithType);
  } catch (error: unknown) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    );
  }
};

// PATCH /api/orders/[orderId] - Update order status
export async function PATCH(
  request: NextRequest
) {
  console.log('PATCH request received at:', new Date().toISOString());
  try {
    await connectDB();
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();
    const body = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update in both collections and get the one that was actually updated
    const [updatedBuyOrder, updatedSellOrder] = await Promise.all([
      BuyOrder.findOneAndUpdate(
        { order_id: orderId },
        {
          ...body,
          updated_at: new Date()
        },
        { new: true }
      ),
      SellOrder.findOneAndUpdate(
        { order_id: orderId },
        {
          ...body,
          updated_at: new Date()
        },
        { new: true }
      )
    ]);

    const updatedOrder = updatedBuyOrder || updatedSellOrder;
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Add type field based on which collection it was found in
    const orderWithType = {
      ...updatedOrder.toObject(),
      type: updatedBuyOrder ? 'buy' : 'sell'
    };

    return NextResponse.json(orderWithType);
  } catch (error: unknown) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[orderId] - Delete order
export const DELETE = async (request: NextRequest) => {
  console.log('DELETE request received at:', new Date().toISOString());
  try {
    await connectDB();
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Delete from both collections
    const [deletedBuyOrder, deletedSellOrder] = await Promise.all([
      BuyOrder.findOneAndDelete({ order_id: orderId }),
      SellOrder.findOneAndDelete({ order_id: orderId })
    ]);

    const deletedOrder = deletedBuyOrder || deletedSellOrder;
    if (!deletedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Order deleted successfully',
      order_id: orderId
    });
  } catch (error: unknown) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
};
