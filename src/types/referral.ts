export interface ReferralUser {
  id: string;
  wallet_address: string;
  isVip: boolean;
  tokenBalance: number;
  referralCode: string;
  totalTransactions?: number;
  lastActive?: Date | null;
}

export interface ReferralTeam {
  user: ReferralUser;
  children: ReferralTeam[];
  totalMembers: number;
  activeMembers: number;
}

export interface CommissionDistribution {
  system: number;
  seller: number;
  buyerReferrer: number;
  sellerReferrer: number;
  vipBonus: number;
  recipients: {
    buyerReferrer?: string;
    sellerReferrer?: string;
    vipUpline?: string;
  };
}

export interface VipRequirements {
  minTokens: number;
  kycRequired: boolean;
  minBalance: number;
}

export type VipDashboardType =
  | "IS_VIP"
  | "NO_VIP_HAS_REFERRALS"
  | "NO_VIP_NO_REFERRALS";

export interface VipDashboardProps {
  type: VipDashboardType;
  user?: ReferralUser;
  team?: ReferralTeam;
}

export interface StakeStatus {
  canStake: boolean;
  message: string;
  requiresNewWallet: boolean;
}
