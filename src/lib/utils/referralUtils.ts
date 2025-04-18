import {
  CommissionDistribution,
  ReferralTeam,
  ReferralUser,
  VipDashboardType,
  StakeStatus,
} from "@/types/referral";
import { db } from "@/lib/db";
import { Request } from "express";

export async function generateReferralCode(
  walletAddress: string,
  index: number
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(walletAddress);

  // Use Web Crypto API to create SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Take first 8 characters and combine with index
  const shortHash = hashHex.substring(0, 8);
  return `${shortHash}${index.toString().padStart(4, "0")}`.toUpperCase();
}

// Full referral link
export function generateReferralLink(referralCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cdexs.com";
  return `${baseUrl}/signup?ref=${referralCode}`;
}

const COMMISSION_RATES = {
  TOTAL: 0.03, // 3%
  SYSTEM: 0.01, // 1%
  SELLER: 0.01, // 1%
  BUYER_REFERRER: 0.008, // 0.8%
  SELLER_REFERRER: 0.001, // 0.1%
  VIP_UPLINE: 0.001, // 0.1%
};

const VIP_REQUIREMENTS = {
  MIN_TOKENS: 100000,
  KYC_REQUIRED: true,
  MIN_BALANCE: 100000,
};

// Stake validation and status check
export const checkStakeEligibility = async (
  walletAddress: string
): Promise<StakeStatus> => {
  const user = await db.user.findUnique({
    where: { wallet_address: walletAddress },
    include: {
      referrals: {
        where: { referrer_id: walletAddress },
      },
      vip_status: true,
      token_balance: true,
    },
  });

  if (!user) {
    return {
      canStake: false,
      message: "User not found",
      requiresNewWallet: false,
    };
  }

  const hasTeam = user.referrals.length > 0;
  const isVip = user.vip_status?.isActive;
  const hasEnoughTokens = user.token_balance >= VIP_REQUIREMENTS.MIN_TOKENS;

  if (isVip) {
    return {
      canStake: false,
      message: "Already a VIP member",
      requiresNewWallet: false,
    };
  }

  if (!hasEnoughTokens) {
    return {
      canStake: false,
      message: `Need ${VIP_REQUIREMENTS.MIN_TOKENS} CDX to become VIP`,
      requiresNewWallet: hasTeam,
    };
  }

  if (hasTeam) {
    return {
      canStake: true,
      message: "Create a new wallet and stake 100,000 CDX to become VIP",
      requiresNewWallet: true,
    };
  }

  return {
    canStake: true,
    message: "You can stake 100,000 CDX to become VIP immediately",
    requiresNewWallet: false,
  };
};

// Enhanced commission calculation with VIP bonus
export const calculateCommissions = async (
  transactionAmount: number,
  buyerId: string,
  sellerId: string
): Promise<CommissionDistribution> => {
  try {
    const totalFee = transactionAmount * COMMISSION_RATES.TOTAL;

    const [buyer, seller] = await Promise.all([
      db.user.findUnique({
        where: { id: buyerId },
        include: { referredBy: true },
      }),
      db.user.findUnique({
        where: { id: sellerId },
        include: { referredBy: true },
      }),
    ]);

    if (!buyer || !seller) {
      throw new Error("Buyer or seller not found");
    }

    const buyerReferrer = buyer?.referredBy[0]?.referrer;
    const sellerReferrer = seller?.referredBy[0]?.referrer;

    // Find nearest VIP upline for buyer's referrer
    let vipUpline = null;
    if (buyerReferrer) {
      const referralChain = await getReferralChain(buyerReferrer.id);
      vipUpline = await findNearestVIP(referralChain);
    }

    return {
      system: totalFee * (COMMISSION_RATES.SYSTEM / COMMISSION_RATES.TOTAL),
      seller: totalFee * (COMMISSION_RATES.SELLER / COMMISSION_RATES.TOTAL),
      buyerReferrer: buyerReferrer
        ? totalFee * (COMMISSION_RATES.BUYER_REFERRER / COMMISSION_RATES.TOTAL)
        : 0,
      sellerReferrer: sellerReferrer
        ? totalFee * (COMMISSION_RATES.SELLER_REFERRER / COMMISSION_RATES.TOTAL)
        : 0,
      vipBonus: vipUpline
        ? totalFee * (COMMISSION_RATES.VIP_UPLINE / COMMISSION_RATES.TOTAL)
        : 0,
      recipients: {
        buyerReferrer: buyerReferrer?.id,
        sellerReferrer: sellerReferrer?.id,
        vipUpline: vipUpline?.id,
      },
    };
  } catch (error) {
    console.error("Error calculating commissions:", error);
    throw error;
  }
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const teamCache = new Map<string, { data: ReferralTeam; timestamp: number }>();

export const getCompleteTeamStructure = async (
  walletAddress: string,
  maxDepth = 10
): Promise<ReferralTeam> => {
  const cached = teamCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const user = await db.user.findUnique({
    where: { wallet_address: walletAddress },
    include: { vip_status: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const buildTeamTree = async (
    userId: string,
    currentDepth: number
  ): Promise<ReferralTeam> => {
    if (currentDepth >= maxDepth) {
      return {
        user: await getUserBasicInfo(userId),
        children: [],
        totalMembers: 0,
        activeMembers: 0,
      };
    }

    const directReferrals = await db.referral.findMany({
      where: { referrer_id: userId },
      include: {
        referred: {
          include: {
            vip_status: true,
            transactions: {
              where: {
                created_at: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      },
    });

    const children = await Promise.all(
      directReferrals.map((ref) =>
        buildTeamTree(ref.referred.id, currentDepth + 1)
      )
    );

    const totalMembers = children.reduce(
      (sum, child) => sum + child.totalMembers + 1,
      0
    );
    const activeMembers = children.reduce(
      (sum, child) => sum + child.activeMembers,
      0
    );

    return {
      user: await getUserBasicInfo(userId),
      children,
      totalMembers,
      activeMembers,
    };
  };

  const result = await buildTeamTree(user.id, 0);

  teamCache.set(walletAddress, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
};

// Get VIP dashboard type
export const getVipDashboardType = async (
  walletAddress: string
): Promise<{ type: VipDashboardType; message: string }> => {
  const user = await db.user.findUnique({
    where: { wallet_address: walletAddress },
    include: {
      referrals: true,
      vip_status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.vip_status?.isActive) {
    return {
      type: "IS_VIP",
      message: "You are a VIP member",
    };
  }

  if (user.referrals.length > 0) {
    return {
      type: "NO_VIP_HAS_REFERRALS",
      message: "Please create a new wallet and stake 100,000 CDX to become VIP",
    };
  }

  return {
    type: "NO_VIP_NO_REFERRALS",
    message: "Stake 100,000 CDX to become VIP immediately",
  };
};

// Helper function to get user basic info
async function getUserBasicInfo(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      vip_status: true,
      transactions: {
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  return {
    id: user.id,
    wallet_address: user.wallet_address,
    isVip: user.vip_status?.isActive || false,
    totalTransactions: user.transactions.length,
    lastActive: user.transactions[0]?.created_at || null,
  };
}

export const findVipUpline = (
  team: ReferralTeam,
  targetUserId: string
): ReferralUser | null => {
  const findUserInTeam = (
    node: ReferralTeam,
    target: string
  ): ReferralUser | null => {
    // Check if any child matches the target
    for (const child of node.children) {
      if (child.user.id === target) {
        return node.user.isVip ? node.user : null;
      }
      const found = findUserInTeam(child, target);
      if (found) return found;
    }
    return null;
  };

  return findUserInTeam(team, targetUserId);
};

export const isUserInTeam = (team: ReferralTeam, userId: string): boolean => {
  if (team.user.id === userId) return true;
  return team.children.some((child) => isUserInTeam(child, userId));
};

export const getDashboardType = (
  user: ReferralUser,
  hasReferrals: boolean
): VipDashboardType => {
  if (user.isVip) return "IS_VIP";
  return hasReferrals ? "NO_VIP_HAS_REFERRALS" : "NO_VIP_NO_REFERRALS";
};

export const checkVipEligibility = (user: ReferralUser): boolean => {
  return user.tokenBalance >= VIP_REQUIREMENTS.MIN_TOKENS;
};

export const buildReferralTree = async (
  userId: string
): Promise<ReferralTeam | null> => {
  // This would be implemented to fetch data from your backend
  // Placeholder for now - you'll need to implement the actual data fetching
  return null;
};

async function getReferralChain(userId: string): Promise<string[]> {
  const chain: string[] = [];
  let currentUser = await db.user.findUnique({
    where: { id: userId },
    include: { referredBy: true },
  });

  while (currentUser?.referredBy[0]) {
    chain.push(currentUser.referredBy[0].referrer_id);
    currentUser = await db.user.findUnique({
      where: { id: currentUser.referredBy[0].referrer_id },
      include: { referredBy: true },
    });
  }

  return chain;
}

async function findNearestVIP(chain: string[]): Promise<ReferralUser | null> {
  for (const userId of chain) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { vip_status: true },
    });
    if (user?.vip_status?.isActive) {
      return {
        id: user.id,
        wallet_address: user.wallet_address,
        isVip: true,
        tokenBalance: user.token_balance,
        referralCode: user.referral_code,
      };
    }
  }
  return null;
}

export const validateStakeAmount = (amount: number): boolean => {
  if (amount < VIP_REQUIREMENTS.MIN_TOKENS) {
    throw new Error(
      `Minimum stake amount is ${VIP_REQUIREMENTS.MIN_TOKENS} CDX`
    );
  }
  return true;
};

export const validateWalletOwnership = async (
  walletAddress: string,
  signature: string
): Promise<boolean> => {
  // Implement wallet ownership validation
  return true;
};

export const validateRequest = (req: Request) => {
  const { signature, timestamp } = req.headers;
  if (!signature || !timestamp) {
    throw new Error("Missing required headers");
  }
  if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
    throw new Error("Request expired");
  }
};

export async function validateAndProcessReferralCode(
  referralCode: string,
  newUserWallet: string
): Promise<boolean> {
  try {
    const referrer = await db.user.findUnique({
      where: {
        $or: [
          { referral_code: referralCode },
          { wallet_address: referralCode },
        ],
      },
    });

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    if (referrer.wallet_address === newUserWallet) {
      throw new Error("Cannot use own referral code");
    }

    const existingReferral = await db.user.findUnique({
      where: {
        wallet_address: newUserWallet,
        parent_ref: { $exists: true },
      },
    });

    if (existingReferral) {
      throw new Error("User already has a referrer");
    }

    await db.user.update({
      where: { wallet_address: newUserWallet },
      data: {
        parent_ref: referrer.referral_code,
        referrer: referrer.id,
      },
    });

    await db.user.update({
      where: { id: referrer.id },
      data: { $addToSet: { referred_users: newUserWallet } },
    });

    return true;
  } catch (error) {
    console.error("Error processing referral code:", error);
    throw error;
  }
}
