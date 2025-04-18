import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Get user's VIP status and team data
    const user = await db.user.findUnique({
      where: { wallet_address: walletAddress },
      include: {
        vipStatus: true,
        referredBy: {
          include: {
            referrer: {
              include: {
                vipStatus: true,
              },
            },
          },
        },
        referrals: {
          include: {
            referred: {
              include: {
                vipStatus: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has team members
    const hasTeam = user.referrals.length > 0;

    // Get team data for tree visualization
    const teamData = await getTeamTreeData(walletAddress);

    // Get commission stats
    const commissionStats = await getCommissionStats(walletAddress);

    return NextResponse.json({
      isVIP: user.vipStatus?.isActive || false,
      hasTeam,
      teamData,
      ...commissionStats,
    });
  } catch (error) {
    console.error("Error fetching VIP status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getTeamTreeData(walletAddress: string) {
  // Implement recursive function to get team tree data
  // Limit depth to 10 levels for performance
  const getTeamMembers = async (address: string, depth = 0): Promise<any> => {
    if (depth >= 10) return null;

    const user = await db.user.findUnique({
      where: { wallet_address: address },
      include: {
        referrals: {
          include: {
            referred: {
              include: {
                vipStatus: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const children = await Promise.all(
      user.referrals.map(async (ref) => {
        const childData = await getTeamMembers(
          ref.referred.wallet_address,
          depth + 1
        );
        return {
          id: ref.referred.wallet_address,
          name: ref.referred.username,
          isVIP: ref.referred.vipStatus?.isActive || false,
          children: childData ? [childData] : [],
        };
      })
    );

    return {
      id: user.wallet_address,
      name: user.username,
      isVIP: user.vipStatus?.isActive || false,
      children,
    };
  };

  return getTeamMembers(walletAddress);
}

async function getCommissionStats(walletAddress: string) {
  // Get commission stats from transactions
  const transactions = await db.transaction.findMany({
    where: {
      OR: [
        { buyer_referrer: walletAddress },
        { seller_referrer: walletAddress },
        { vip_beneficiary: walletAddress },
      ],
    },
  });

  const stats = {
    totalEarnings: 0,
    buyerCommission: 0,
    sellerCommission: 0,
    vipBonus: 0,
  };

  transactions.forEach((tx) => {
    if (tx.buyer_referrer === walletAddress) {
      stats.buyerCommission += tx.buyer_commission || 0;
    }
    if (tx.seller_referrer === walletAddress) {
      stats.sellerCommission += tx.seller_commission || 0;
    }
    if (tx.vip_beneficiary === walletAddress) {
      stats.vipBonus += tx.vip_bonus || 0;
    }
  });

  stats.totalEarnings =
    stats.buyerCommission + stats.sellerCommission + stats.vipBonus;

  return stats;
}
