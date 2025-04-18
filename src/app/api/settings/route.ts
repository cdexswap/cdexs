import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Settings } from '@/lib/models/settings';

// GET /api/settings - Get user settings
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    let settings = await Settings.findOne({ wallet });

    if (!settings) {
      // Return default settings when none exist
      const defaultPaymentMethod = {
        phone: '',
        bankName: '',
        bankAccount: '',
        bankAccountName: ''
      };

      const defaultSettings = {
        wallet,
        name: '',
        supportedCountries: [],
        paymentMethods: {
          TH: defaultPaymentMethod,
          LA: defaultPaymentMethod,
          MY: defaultPaymentMethod,
          VN: defaultPaymentMethod,
          CN: defaultPaymentMethod
        },
        shopOpened: false
      };

      // Return default settings with isDefault flag in response
      return NextResponse.json({
        ...defaultSettings,
        isDefault: true
      });
    }

    // Return existing settings without isDefault flag
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create/Update user settings
export async function POST(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const body = await request.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Create/Update settings with new values
    const settings = await Settings.findOneAndUpdate(
      { wallet },
      { 
        ...body,
        updated_at: new Date()
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const body = await request.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Update settings with new values
    const settings = await Settings.findOneAndUpdate(
      { wallet },
      { 
        ...body,
        updated_at: new Date()
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings - Delete user settings
export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Delete the settings document
    const result = await Settings.findOneAndDelete({ wallet });

    if (!result) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Settings deleted successfully' });
  } catch (error) {
    console.error('Error deleting settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
