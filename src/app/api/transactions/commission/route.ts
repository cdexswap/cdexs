import { NextResponse } from "next/server";
import { Transaction } from "@/lib/models/transaction";
import { User } from "@/lib/models/user";
import { calculateCommissions } from "@/lib/utils/referralUtils";
import type { CommissionDistribution } from "@/types/referral";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, buyerId, sellerId } = body;

    if (!amount || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commissionData = await calculateCommissions(
      amount,
      buyerId,
      sellerId
    );

    const transaction = await Transaction.create({
      amount,
      fee: amount * 0.03,
      buyer_id: buyerId,
      seller_id: sellerId,
      buyer_referrer: commissionData.recipients.buyerReferrer,
      seller_referrer: commissionData.recipients.sellerReferrer,
      vip_beneficiary: commissionData.recipients.vipUpline,
      buyer_commission: commissionData.buyerReferrer,
      seller_commission: commissionData.sellerReferrer,
      vip_bonus: commissionData.vipBonus,
      system_fee: commissionData.system,
      seller_rebate: commissionData.seller,
      created_at: new Date(),
    });

    if (commissionData.recipients.buyerReferrer) {
      await updateUserCommissionBalance(
        commissionData.recipients.buyerReferrer,
        commissionData.buyerReferrer
      );
    }
    if (commissionData.recipients.sellerReferrer) {
      await updateUserCommissionBalance(
        commissionData.recipients.sellerReferrer,
        commissionData.sellerReferrer
      );
    }
    if (commissionData.recipients.vipUpline) {
      await updateUserCommissionBalance(
        commissionData.recipients.vipUpline,
        commissionData.vipBonus
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
      commissions: commissionData,
      recipients: commissionData.recipients,
    });
  } catch (error) {
    console.error("Error processing transaction commission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateUserCommissionBalance(
  walletAddress: string,
  amount: number
) {
  const user = await User.findOne({ wallet_address: walletAddress });

  if (!user) return;

  await User.findOneAndUpdate(
    { wallet_address: walletAddress },
    { $inc: { commission_balance: amount } }
  );
}
