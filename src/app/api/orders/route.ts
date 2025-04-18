import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

interface Order {
  order_id: string;
  user_id: string;
  amount: number;
  price: number;
  rates: Map<string, number>;
  total_price: number;
  currency: string;
  chain: string;
  wallet_address: string;
  payment_method: string;
  countryCodes: string;
  transaction_fee: number;
  expiration_time: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderDocument extends Order, mongoose.Document {
  countryCodes: string;
}

const validateRates = (rates: Map<string, number>, countryCodes: string): boolean => {
  const codes = countryCodes.split(',');
  return codes.every(code => rates.has(code));
};

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
    default: new Map(),
    validate: {
      validator: function(this: OrderDocument, rates: Map<string, number>): boolean {
        return validateRates(rates, this.countryCodes);
      },
      message: 'Each country code must have a corresponding rate'
    }
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
  minBuyAmount: {
    type: Number,
    required: false,
    default: 0
  },
  numBuyers: {
    type: Number,
    required: false,
    default: 1
  },
  remainingBalance: {
    type: Number,
    required: false,
  },
  remainingBuyers: {
    type: Number,
    required: false,
  },
  subOrders: {
    type: Array,
    required: false,
    default: []
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

const BuyOrderSchema = new mongoose.Schema(commonOrderFields);
const SellOrderSchema = new mongoose.Schema(commonOrderFields);

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

const BuyOrder = mongoose.models.BuyOrder || mongoose.model('BuyOrder', BuyOrderSchema);
const SellOrder = mongoose.models.SellOrder || mongoose.model('SellOrder', SellOrderSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let orders = [];
    if (type === 'buy') {
      orders = await BuyOrder.find({}).sort({ created_at: -1 });
    } else if (type === 'sell') {
      orders = await SellOrder.find({}).sort({ created_at: -1 });
    } else {
      const [buyOrders, sellOrders] = await Promise.all([
        BuyOrder.find({}).sort({ created_at: -1 }),
        SellOrder.find({}).sort({ created_at: -1 })
      ]);
      
      const buyOrdersWithType = buyOrders.map(order => ({
        ...order.toObject(),
        type: 'buy'
      }));
      const sellOrdersWithType = sellOrders.map(order => ({
        ...order.toObject(),
        type: 'sell'
      }));
      
      orders = [...buyOrdersWithType, ...sellOrdersWithType];
    }

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('Error fetching orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const timestamp = Date.now();
    // Generate a longer random string for better uniqueness
    const randomStr = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const prefix = body.type === 'buy' ? 'BUY' : 'SELL';
    body.order_id = `${prefix}_${timestamp}_${randomStr}`;

    if (body.type === 'sell' && body.countryCodes) {
      if (!body.rates || !validateRates(new Map(Object.entries(body.rates)), body.countryCodes)) {
        return NextResponse.json(
          { error: 'Each country code must have a corresponding rate' },
          { status: 400 }
        );
      }
      body.rates = new Map(Object.entries(body.rates));
      body.price = body.rates.values().next().value;
    }

    const { type, ...orderData } = body;

    let order: mongoose.Document & Order;
    if (type === 'buy') {
      order = await BuyOrder.create(orderData);
      
      const matchingSellOrders = await SellOrder.find({
        currency: orderData.currency,
        chain: orderData.chain,
        status: 'pending'
      });

      const notifications = await Promise.all(matchingSellOrders.map(async (sellOrder) => {
        const timestamp = Date.now();
        // Use same format for notification IDs
        const randomStr = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        const notificationId = `NOTIF_${timestamp}_${randomStr}`;

        await Notification.create({
          notification_id: notificationId,
          user_id: sellOrder.user_id,
          type: 'buy_order',
          message: `New buy order for ${orderData.amount} ${orderData.currency} on ${orderData.chain}`,
          order_id: order.order_id,
          read: false
        });

        return {
          userId: sellOrder.user_id,
          message: `New buy order for ${orderData.amount} ${orderData.currency} on ${orderData.chain}`
        };
      }));

      return NextResponse.json({
        order,
        notifications
      }, { status: 201 });

    } else if (type === 'sell') {
      order = await SellOrder.create(orderData);
      return NextResponse.json(order, { status: 201 });
    } else {
      throw new Error('Invalid order type');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
