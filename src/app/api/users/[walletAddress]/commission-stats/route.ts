import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params;

    // Get all transactions where the user received commissions
    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { buyer_referrer: walletAddress },
          { seller_referrer: walletAddress },
          { vip_beneficiary: walletAddress },
        ],
      },
      orderBy: {
        created_at: "desc",
      },
      take: 10, // Limit to 10 most recent transactions
    });

    // Calculate total earned commissions
    const totalEarned = transactions.reduce((sum, tx) => {
      let userCommission = 0;
      if (tx.buyer_referrer === walletAddress)
        userCommission += tx.buyer_commission;
      if (tx.seller_referrer === walletAddress)
        userCommission += tx.seller_commission;
      if (tx.vip_beneficiary === walletAddress) userCommission += tx.vip_bonus;
      return sum + userCommission;
    }, 0);

    // Get pending commissions (not yet withdrawn)
    const user = await db.user.findUnique({
      where: { wallet_address: walletAddress },
      select: { commission_balance: true },
    });

    return NextResponse.json({
      totalEarned,
      pendingCommissions: user?.commission_balance || 0,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        fee: tx.fee,
        buyer_commission:
          tx.buyer_referrer === walletAddress ? tx.buyer_commission : 0,
        seller_commission:
          tx.seller_referrer === walletAddress ? tx.seller_commission : 0,
        vip_bonus: tx.vip_beneficiary === walletAddress ? tx.vip_bonus : 0,
        created_at: tx.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching commission stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission statistics" },
      { status: 500 }
    );
  }
}
