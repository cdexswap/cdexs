import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/user";
import { Transaction } from "@/lib/models/transaction";
import { generateReferralLink } from "@/lib/utils/referralUtils";
import { generateQRCode } from "@/lib/utils/qrCodeUtils";
import type { Types } from "mongoose";
import mongoose from "mongoose";

interface UserDocument {
  _id: Types.ObjectId;
  username: string;
  wallet_address: string;
  wallet_type: string;
  referral_code: string;
  referral_index: number;
  referrer?: Types.ObjectId;
  parent_ref?: string;
  referred_users: Types.ObjectId[];
  referral_earnings: number;
  referral_transactions: {
    buy: {
      count: number;
      volume: number;
      earnings: number;
    };
    sell: {
      count: number;
      volume: number;
      earnings: number;
    };
  };
  created_at: Date;
}

// GET /api/referral - Get referral info for a user
export async function GET(request: Request) {
  try {
    await connectDB();
    if (!mongoose.connection.readyState) {
      throw new Error("Database connection not established");
    }

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    console.log("Wallet address from request:", walletAddress);

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Find user and populate referred users
    console.log("Looking for user with wallet address:", walletAddress);
    const user = (await User.findOne({ wallet_address: walletAddress })
      .populate("referred_users", "username wallet_address created_at")
      .lean()) as UserDocument | null;

    console.log("User search result:", user ? "Found" : "Not found");

    if (!user) {
      return NextResponse.json({
        user: {
          username: "Guest",
          wallet_address: walletAddress,
          referral_code: "",
          referral_earnings: 0,
          referral_transactions: {
            buy: { count: 0, volume: 0, earnings: 0 },
            sell: { count: 0, volume: 0, earnings: 0 },
          },
        },
        referral: {
          referralLink: "",
          qrCode: "",
          buyerSummary: {
            referredBuyers: 0,
            buyTransactions: 0,
            earningsBuyers: 0,
          },
          sellerSummary: {
            referredSellers: 0,
            sellTransactions: 0,
            earningsSellers: 0,
          },
          buyReferrals: [],
          sellReferrals: [],
          buyTransactions: [],
          sellTransactions: [],
        },
      });
    }

    // Generate referral link and QR code
    console.log("Generating referral link and QR code");
    const referralLink = generateReferralLink(user.referral_code);
    const qrCode = await generateQRCode(referralLink);

    // Get buyer referrals data - using parent_ref instead of referrer
    const buyReferrals = await User.find({ parent_ref: user.referral_code })
      .select("username wallet_address created_at")
      .lean();

    // Get seller referrals data - using parent_ref instead of referrer
    // We're actually getting the same users, just displaying them in different contexts
    const sellReferrals = await User.find({ parent_ref: user.referral_code })
      .select("username wallet_address created_at")
      .lean();


    const buyTransactions = await Transaction.find({
      buyer_id: { $in: buyReferrals.map((u) => u.wallet_address) },
      status: "completed",
    })
      .select("amount fees created_at buyer_id")
      .lean();

    const sellTransactions = await Transaction.find({
      seller_id: { $in: sellReferrals.map((u) => u.wallet_address) },
      status: "completed",
    })
      .select("amount fees created_at seller_id")
      .lean();

    // Calculate summary stats - we'll use the correct unique counts
    const buyerSummary = {
      referredBuyers: buyReferrals.length ? buyReferrals.length : 0,
      buyTransactions: buyTransactions.length,
      earningsBuyers: buyTransactions.reduce(
        (sum, tx) => sum + (tx.fees?.buyer_referrer_commission || 0),
        0
      ),
    };

    const sellerSummary = {
      referredSellers: sellReferrals.length ? sellReferrals.length : 0,
      sellTransactions: sellTransactions.length,
      earningsSellers: sellTransactions.reduce(
        (sum, tx) => sum + (tx.fees?.seller_referrer_commission || 0),
        0
      ),
    };

    // Return all referral data
    return NextResponse.json({
      user: {
        username: user.username,
        wallet_address: user.wallet_address,
        referral_code: user.referral_code,
        referral_earnings: user.referral_earnings,
        referral_transactions: user.referral_transactions,
        referred_users: user.referred_users || [],
      },
      referral: {
        referralLink,
        qrCode,
        buyerSummary,
        sellerSummary,
        buyReferrals,
        sellReferrals, // Keep the sellReferrals for UI display
        buyTransactions,
        sellTransactions,
      },
    });
  } catch (error) {
    console.error("Error fetching referral data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch referral data",
      },
      { status: 500 }
    );
  }
}
