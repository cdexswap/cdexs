import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, amount } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: "Wallet address and amount are required" },
        { status: 400 }
      );
    }

    if (amount < 100000) {
      return NextResponse.json(
        { error: "Minimum stake amount is 100,000 CDX" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { wallet_address: walletAddress },
      include: {
        referrals: true,
        vipStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has team members
    const hasTeam = user.referrals.length > 0;

    if (hasTeam && !user.vipStatus?.isActive) {
      return NextResponse.json(
        {
          error:
            "Users with existing team members must create a new wallet to stake",
        },
        { status: 422 }
      );
    }

    // Update or create VIP status
    await db.vIPStatus.upsert({
      where: { userId: user.id },
      update: {
        isActive: true,
        stakedAmount: amount,
        lastStakeDate: new Date(),
      },
      create: {
        userId: user.id,
        isActive: true,
        stakedAmount: amount,
        lastStakeDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully staked CDX tokens",
    });
  } catch (error) {
    console.error("Error staking tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
