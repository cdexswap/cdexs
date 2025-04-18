import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema({
  transaction_id: { type: String, required: true },
  buy_order_id: { type: String, required: true },
  sell_order_id: { type: String, required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  total_price: { type: Number, required: true },
  buyer_id: { type: String, required: true },
  seller_id: { type: String, required: true },
  currency: { type: String, required: true },
  chain: { type: String, required: true },
  buyer_payment_confirmed: { type: Boolean, default: false },
  seller_payment_confirmed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "matching", "completed", "canceled"],
    default: "pending",
  },
  txHash: { type: String, required: true },
  blockchain_confirmations: { type: Number, default: 0 },
  block_number: { type: Number },
  fees: {
    total_fee: { type: Number, required: true },
    system_fee: { type: Number, required: true },
    seller_refund: { type: Number, required: true },
    buyer_referrer_commission: { type: Number, required: true },
    seller_referrer_commission: { type: Number, required: true },
  },
  referrals: {
    buyer_referrer_id: { type: String, required: false },
    seller_referrer_id: { type: String, required: false },
    commissions_processed: { type: Boolean, default: false },
  },
});

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
