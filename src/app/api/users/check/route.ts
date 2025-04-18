import { NextResponse } from "next/server";
import { User } from "@/lib/models/user";
import connectDB from "@/lib/db";
import { generateReferralCode } from "@/lib/utils/referralUtils";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { wallet_address, wallet_type, referral_code } = await req.json();

    // Validate wallet_address is provided
    if (!wallet_address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    console.log(`Checking user with wallet address: ${wallet_address}`);

    // Check if user already exists
    const existingUser = await User.findOne({ wallet_address });
    if (existingUser) {
      console.log(`User exists: ${existingUser._id}`);
      return NextResponse.json({
        exists: true,
        user: existingUser,
      });
    }

    console.log("User not found, creating new user");

    // If referral code provided, validate it first
    let referrerId = null;
    if (referral_code) {
      console.log(`Validating referral code: ${referral_code}`);
      const referrer = await User.findOne({ referral_code });
      if (!referrer) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 }
        );
      }
      referrerId = referrer._id;
      console.log(`Valid referrer found: ${referrerId}`);
    }

    // Get total user count for generating referral index
    const userCount = await User.countDocuments();
    const referral_index = userCount + 1;
    console.log(`Generating referral index: ${referral_index}`);

    // Generate a new referral code for the user
    const userReferralCode = generateReferralCode(
      wallet_address,
      referral_index
    );
    console.log(`Generated referral code: ${userReferralCode}`);

    // Create new user document with all required fields EXPLICITLY set
    const newUserData = {
      username: `user_${wallet_address.slice(0, 6)}`,
      wallet_address,
      wallet_type: wallet_type || "evm",
      referral_code: userReferralCode, // Important: explicitly set this!
      referral_index,
      parent_ref: referral_code || null,
      referral_earnings: 0,
      referred_users: [],
      referral_transactions: {
        buy: { count: 0, volume: 0, earnings: 0 },
        sell: { count: 0, volume: 0, earnings: 0 },
      },
    };

    if (referrerId) {
      newUserData.referrer = referrerId;
    }

    console.log("Creating new user with data:", newUserData);

    // Create a new user with all required fields
    const newUser = await User.create(newUserData);
    console.log(`User created with ID: ${newUser._id}`);

    // If this is a new user with referral code, update referrer's referred_users
    if (referral_code && referrerId) {
      await User.findByIdAndUpdate(referrerId, {
        $addToSet: { referred_users: newUser._id },
      });
      console.log(`Updated referrer ${referrerId} with new referred user`);
    }

    return NextResponse.json({
      exists: false,
      user: newUser,
    });
  } catch (error) {
    console.error("User check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
