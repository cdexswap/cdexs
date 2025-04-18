import mongoose from "mongoose";
import { generateReferralCode } from "../utils/referralUtils";

const dropReferralCodeIndex = async () => {
  if (typeof window !== "undefined") return;

  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      const usersCollection = db.collection("users");

      const indexInfo = await usersCollection.indexInformation();
      if (indexInfo.refCode_1) {
        await usersCollection.dropIndex("refCode_1");
        console.log("Dropped refCode_1 index");
      }
    }
  } catch (error) {
    console.error("Error dropping index:", error);
  }
};

if (typeof window === "undefined") {
  dropReferralCodeIndex();
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  wallet_address: {
    type: String,
    required: true,
    unique: true,
  },
  wallet_type: {
    type: String,
    enum: ["evm", "solana"],
    required: true,
  },
  parent_ref: {
    type: String,
    required: false,
  },
  referral_code: {
    type: String,
    required: false,
  },
  referred_users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  referral_index: {
    type: Number,
    required: true,
    default: 1,
  },
  referral_earnings: {
    type: Number,
    default: 0,
  },
  referral_transactions: {
    buy: {
      count: { type: Number, default: 0 },
      volume: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
    },
    sell: {
      count: { type: Number, default: 0 },
      volume: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
    },
  },
  vip_status: {
    type: Boolean,
    default: false,
  },
  staked_tokens: {
    type: Number,
    default: 0,
  },
  staking_history: [
    {
      amount: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      type: {
        type: String,
        enum: ["stake", "unstake"],
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

if (typeof window === "undefined") {
  userSchema.index({ referral_code: 1 }, { unique: true, sparse: true });
}

if (typeof window === "undefined") {
  userSchema.pre("save", async function (next) {
    try {

      if (!this.referral_code) {
        // Ensure we have an index
        if (!this.referral_index) {
          const count = await mongoose.models.User.countDocuments();
          this.referral_index = count + 1;
        }

        this.referral_code = generateReferralCode(
          this.wallet_address,
          this.referral_index
        );

        console.log(
          `Generated referral code for ${this.wallet_address}: ${this.referral_code}`
        );
      }
      next();
    } catch (error) {
      console.error("Error in pre-save hook:", error);
      next(error);
    }
  });
}

if (typeof window === "undefined") {
  userSchema.methods.updateReferralEarnings = async function (
    amount: number,
    type: "buy" | "sell",
    commission: number
  ) {
    this.referral_earnings += commission;

    if (type === "buy") {
      this.referral_transactions.buy.count += 1;
      this.referral_transactions.buy.volume += amount;
      this.referral_transactions.buy.earnings += commission;
    } else {
      this.referral_transactions.sell.count += 1;
      this.referral_transactions.sell.volume += amount;
      this.referral_transactions.sell.earnings += commission;
    }

    return this.save();
  };
}

let User;
if (typeof window === "undefined") {
  User = mongoose.models.User || mongoose.model("User", userSchema);
} else {
  User = {
    findOne: () => Promise.resolve(null),
    find: () => Promise.resolve([]),
    create: () => Promise.resolve(null),
    countDocuments: () => Promise.resolve(0),
    findByIdAndUpdate: () => Promise.resolve(null),
  };
}

export { User };
