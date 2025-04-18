import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User, IUser } from "@/lib/models/user";
import {
  generateReferralLink,
  generateReferralCode,
  validateAndProcessReferralCode,
} from "@/lib/utils/referralUtils";
import { generateQRCode } from "@/lib/utils/qrCodeUtils";
import mongoose from "mongoose";

export async function POST(request: Request) {
  let session = null;

  try {
    console.log("=== START USER REGISTRATION PROCESS ===");
    console.log("Registration Time:", new Date().toISOString());
    await connectDB();

    const body = await request.json();
    const {
      wallet_address,
      username,
      wallet_type = "evm",
      referral_code,
    } = body;

    // Log registration source
    console.log("Registration Source:", {
      type: referral_code ? "REFERRED_USER" : "DIRECT_REGISTRATION",
      wallet_address,
      username,
      referral_code: referral_code || "NONE",
      timestamp: new Date().toISOString(),
      wallet_type,
    });

    if (!wallet_address || !username || !wallet_type) {
      console.error("Missing required fields:", {
        wallet_address,
        username,
        wallet_type,
      });
      return NextResponse.json(
        { error: "Wallet address, username, and wallet type are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ wallet_address });

    if (existingUser) {
      console.log("Existing User Details:", {
        status: "ALREADY_REGISTERED",
        id: existingUser._id,
        username: existingUser.username,
        referral_code: existingUser.referral_code,
        referral_index: existingUser.referral_index,
        registration_date: existingUser.created_at,
        referred_by: existingUser.parent_ref || "NONE",
        total_referrals: existingUser.referred_users?.length || 0,
      });

      if (!existingUser.referral_code) {
        console.log("📝 Generating referral code for existing user");

        const userCount = await User.countDocuments();
        const referral_index = userCount + 1;
        console.log("Calculated new referral index:", referral_index);

        const generatedReferralCode = generateReferralCode(
          wallet_address,
          referral_index
        );
        console.log("Generated new referral code:", generatedReferralCode);

        existingUser.referral_code = generatedReferralCode;
        existingUser.referral_index = referral_index;
        await existingUser.save();

        console.log("Updated existing user with new referral code");

        const referralLink = generateReferralLink(generatedReferralCode);
        const qrCode = await generateQRCode(referralLink);

        return NextResponse.json(
          {
            success: true,
            user: {
              id: existingUser._id,
              username: existingUser.username,
              wallet_address: existingUser.wallet_address,
              referral_code: generatedReferralCode,
              referral_index,
            },
            referral: {
              referralLink,
              qrCode,
            },
          },
          { status: 200 }
        );
      }

      if (!existingUser.parent_ref && referral_code) {
        const referrer = await User.findOne({
          $or: [
            { referral_code: referral_code },
            { wallet_address: referral_code },
          ],
        });

        if (referrer && !referrer._id.equals(existingUser._id)) {
          session = await mongoose.startSession();
          session.startTransaction();

          existingUser.parent_ref = referrer.referral_code;
          existingUser.referrer = referrer._id;
          await existingUser.save({ session });

          await User.findByIdAndUpdate(
            referrer._id,
            { $addToSet: { referred_users: existingUser._id } },
            { session, new: true }
          );

          await session.commitTransaction();
          session = null;

          console.log("Updated existing user with referrer:", {
            user_id: existingUser._id,
            referrer_id: referrer._id,
            referrer_code: referrer.referral_code,
          });
        }
      }

      console.log(
        "User already exists with referral code:",
        existingUser.referral_code
      );

      const referralLink = generateReferralLink(existingUser.referral_code);
      const qrCode = await generateQRCode(referralLink);

      return NextResponse.json(
        {
          success: true,
          user: {
            id: existingUser._id,
            username: existingUser.username,
            wallet_address: existingUser.wallet_address,
            referral_code: existingUser.referral_code,
            referral_index: existingUser.referral_index,
            parent_ref: existingUser.parent_ref,
            referrer: existingUser.referrer,
          },
          referral: {
            referralLink,
            qrCode,
          },
        },
        { status: 200 }
      );
    }

    console.log(" New User Registration Stats:", {
      total_users: await User.countDocuments(),
      registration_type: referral_code ? "REFERRED" : "DIRECT",
      timestamp: new Date().toISOString(),
    });

    session = await mongoose.startSession();
    session.startTransaction();

    const userCount = await User.countDocuments();
    const referral_index = userCount + 1;
    console.log(
      "New user registration - Generated referral index:",
      referral_index
    );

    const generatedReferralCode = generateReferralCode(
      wallet_address,
      referral_index
    );
    console.log(" Generated Referral Code:", {
      code: generatedReferralCode,
      for_wallet: wallet_address,
    });

    const newUser: any = {
      username,
      wallet_address,
      wallet_type,
      referral_index,
      referral_code: generatedReferralCode,
      referral_earnings: 0,
      referred_users: [],
      referral_transactions: {
        buy: { count: 0, volume: 0, earnings: 0 },
        sell: { count: 0, volume: 0, earnings: 0 },
      },
    };

    let referrerId = null;

    if (referral_code) {
      console.log("Looking for Referrer:", {
        referral_code,
        timestamp: new Date().toISOString(),
      });

      const referrer = await User.findOne({
        $or: [
          { referral_code: referral_code },
          { wallet_address: referral_code },
        ],
      });

      if (referrer) {
        console.log("Referrer Found:", {
          referrer_id: referrer._id,
          referrer_username: referrer.username,
          referrer_wallet: referrer.wallet_address,
          current_referrals: referrer.referred_users?.length || 0,
          total_earnings: referrer.referral_earnings || 0,
        });

        newUser.referrer = referrer._id;
        newUser.parent_ref = referrer.referral_code;
        referrerId = referrer._id;

        console.log("Established Referral Relationship:", {
          referrer: referrer.username,
          referred: username,
          referral_code: referrer.referral_code,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn("Invalid Referral:", {
          attempted_code: referral_code,
          status: "REFERRER_NOT_FOUND",
          action: "Proceeding with registration without referrer",
        });
      }
    } else {
      console.log("No referral code provided - new user is not referred");
    }

    console.log("Creating new user with data:", newUser);

    const user = await User.create([newUser], { session });
    const createdUser = user[0];

    console.log("New User Created:", {
      id: createdUser._id,
      username: createdUser.username,
      registration_type: referral_code ? "REFERRED" : "DIRECT",
      referral_code: createdUser.referral_code,
      referred_by: createdUser.parent_ref || "NONE",
      timestamp: new Date().toISOString(),
    });

    if (referral_code && referrerId) {
      const updatedReferrer = await User.findByIdAndUpdate(
        referrerId,
        { $addToSet: { referred_users: createdUser._id } },
        { session, new: true }
      );
      console.log(" Updated Referrer Stats:", {
        referrer_id: referrerId,
        total_referrals: updatedReferrer.referred_users.length,
        timestamp: new Date().toISOString(),
      });
    }

    await session.commitTransaction();
    session = null;

    const referralLink = generateReferralLink(createdUser.referral_code);
    const qrCode = await generateQRCode(referralLink);
    console.log("Generated referral link and QR code for new user");

    // Process referral code if provided
    if (referral_code) {
      try {
        await validateAndProcessReferralCode(referral_code, wallet_address);
      } catch (error) {
        console.error("Error processing referral code:", error);
        // Don't fail registration if referral processing fails
      }
    }

    console.log("=== END USER REGISTRATION PROCESS ===");
    console.log(
      "⏱️ Total Process Time:",
      Date.now() - new Date(createdUser.created_at).getTime(),
      "ms"
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          id: createdUser._id,
          username: createdUser.username,
          wallet_address: createdUser.wallet_address,
          referral_code: createdUser.referral_code,
          referral_index: createdUser.referral_index,
          parent_ref: createdUser.parent_ref,
          referrer: createdUser.referrer,
        },
        referral: {
          referralLink,
          qrCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }

    console.error(" Registration Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to register user",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      session.endSession();
    }
  }
}
