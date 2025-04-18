import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Transaction } from "@/lib/models/transaction";
import { calculateCommissions } from "@/lib/utils/referralUtils";
import { User } from "@/lib/models/user";

interface TransactionQuery {
  $or?: Array<{
    buyer_id?: string;
    seller_id?: string;
    buy_order_id?: string;
    sell_order_id?: string;
  }>;
}

interface TransactionDocument {
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  price: number;
  total_price: number;
  currency: string;
  chain: string;
  status: string;
  created_at: Date;
  fees?: {
    buyer_referrer_commission?: number;
    seller_referrer_commission?: number;
  };
}

// GET /api/transactions - Get all transactions
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const orderId = searchParams.get("orderId");

    const query: TransactionQuery = {};
    if (userId) {
      query.$or = [{ buyer_id: userId }, { seller_id: userId }];
    }
    if (orderId) {
      query.$or = [{ buy_order_id: orderId }, { sell_order_id: orderId }];
    }

    const transactions = await Transaction.find(query).sort({ created_at: -1 });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[transactionId] - Update transaction
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Get the transaction first to check current status
    const existingTransaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Determine if both parties will have confirmed after this update
    const willBuyerConfirm =
      body.buyer_payment_confirmed !== undefined
        ? body.buyer_payment_confirmed
        : existingTransaction.buyer_payment_confirmed;
    const willSellerConfirm =
      body.seller_payment_confirmed !== undefined
        ? body.seller_payment_confirmed
        : existingTransaction.seller_payment_confirmed;

    // If both will be confirmed, also update status to completed
    const updateFields: {
      buyer_payment_confirmed?: boolean;
      seller_payment_confirmed?: boolean;
      status?: string;
    } = {
      ...(body.buyer_payment_confirmed !== undefined && {
        buyer_payment_confirmed: body.buyer_payment_confirmed,
      }),
      ...(body.seller_payment_confirmed !== undefined && {
        seller_payment_confirmed: body.seller_payment_confirmed,
      }),
    };

    // Add status update if explicitly provided or if both parties are confirming
    if (body.status !== undefined) {
      updateFields.status = body.status;
    } else if (willBuyerConfirm && willSellerConfirm) {
      updateFields.status = "completed";
    }

    // Update transaction
    const transaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      { $set: updateFields },
      { new: true }
    );

    // If status is set to canceled, update the subOrder status in the sell order
    if (updateFields.status === "canceled") {
      const SellOrder = mongoose.models.SellOrder;

      // Get the sell order to update its subOrders array
      const sellOrder = await SellOrder.findOne({
        order_id: transaction.sell_order_id,
      });

      if (sellOrder) {
        // Update the subOrder status to canceled
        const currentSubOrders = sellOrder.subOrders || [];
        const updatedSubOrders = currentSubOrders.map((order: any) => {
          if (order.id === transaction.transaction_id) {
            return {
              ...order,
              status: "canceled",
              updated_at: new Date().toISOString(),
            };
          }
          return order;
        });

        // Update the sell order
        await SellOrder.findOneAndUpdate(
          { order_id: transaction.sell_order_id },
          {
            updated_at: new Date(),
            subOrders: updatedSubOrders,
          }
        );
      }
    }
    // If both parties have confirmed, update the orders status
    else if (willBuyerConfirm && willSellerConfirm) {
      const BuyOrder = mongoose.models.BuyOrder;
      const SellOrder = mongoose.models.SellOrder;

      // Update buy order status
      await BuyOrder.findOneAndUpdate(
        { order_id: transaction.buy_order_id },
        { status: "completed", updated_at: new Date() }
      );

      // Get the sell order to update its subOrders array
      const sellOrder = await SellOrder.findOne({
        order_id: transaction.sell_order_id,
      });

      if (sellOrder) {
        // Update the subOrder status to completed
        const currentSubOrders = sellOrder.subOrders || [];
        const updatedSubOrders = currentSubOrders.map((order: any) => {
          if (order.id === transaction.transaction_id) {
            return {
              ...order,
              status: "completed",
              updated_at: new Date().toISOString(),
            };
          }
          return order;
        });

        // Check if all subOrders are completed
        const allCompleted = updatedSubOrders.every(
          (order: any) =>
            order.status === "completed" || order.status === "cancelled"
        );

        // Update the sell order
        await SellOrder.findOneAndUpdate(
          { order_id: transaction.sell_order_id },
          {
            status: allCompleted ? "completed" : "matching",
            updated_at: new Date(),
            subOrders: updatedSubOrders,
          }
        );
      } else {
        // Fallback if sell order not found
        await SellOrder.findOneAndUpdate(
          { order_id: transaction.sell_order_id },
          { status: "completed", updated_at: new Date() }
        );
      }
    }

    return NextResponse.json(transaction);
  } catch (error: unknown) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update transaction",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions - Cancel a transaction
export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if the transaction is in a state that can be canceled
    // Only allow cancellation if it's been less than 15 minutes (900 seconds) since creation
    const creationTime = new Date(transaction.created_at).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - creationTime) / 1000);

    if (elapsedSeconds > 900) {
      return NextResponse.json(
        { error: "Transaction cannot be canceled after 15 minutes" },
        { status: 400 }
      );
    }

    // Get the buy and sell orders
    const BuyOrder = mongoose.models.BuyOrder;
    const SellOrder = mongoose.models.SellOrder;

    const buyOrder = await BuyOrder.findOne({
      order_id: transaction.buy_order_id,
    });
    if (!buyOrder) {
      return NextResponse.json(
        { error: "Buy order not found" },
        { status: 404 }
      );
    }

    // Get the sell order to update its subOrders array
    const sellOrder = await SellOrder.findOne({
      order_id: transaction.sell_order_id,
    });

    if (!sellOrder) {
      return NextResponse.json(
        { error: "Sell order not found" },
        { status: 404 }
      );
    }

    // Update the subOrder status to cancelled
    const currentSubOrders = sellOrder.subOrders || [];
    const updatedSubOrders = currentSubOrders.map((order: any) => {
      if (order.id === transaction.transaction_id) {
        return {
          ...order,
          status: "cancelled",
          updated_at: new Date().toISOString(),
        };
      }
      return order;
    });

    // Recalculate remaining balance and buyers
    const totalMatchedAmount = updatedSubOrders.reduce(
      (total: number, order: any) => {
        return total + (order.status !== "cancelled" ? order.amount : 0);
      },
      0
    );

    const remainingBalance = Math.max(0, sellOrder.amount - totalMatchedAmount);
    const numBuyers = sellOrder.numBuyers || 1;
    const usedBuyers = updatedSubOrders.filter(
      (order: any) => order.status !== "cancelled"
    ).length;
    const remainingBuyers = Math.max(0, numBuyers - usedBuyers);

    // Determine the new status for the sell order
    // If there are no active subOrders, set status to 'active', otherwise keep it as 'matching'
    const hasActiveSubOrders = updatedSubOrders.some(
      (order: any) =>
        order.status === "matching" || order.status === "completed"
    );
    const newStatus = hasActiveSubOrders ? "matching" : "active";

    // Update the sell order
    await SellOrder.findOneAndUpdate(
      { order_id: transaction.sell_order_id },
      {
        status: newStatus,
        updated_at: new Date(),
        subOrders: updatedSubOrders,
        remainingBalance: remainingBalance,
        remainingBuyers: remainingBuyers,
      }
    );

    // Update the buy order to canceled
    await BuyOrder.findOneAndUpdate(
      { order_id: transaction.buy_order_id },
      {
        status: "canceled",
        updated_at: new Date(),
      }
    );

    // Delete the transaction
    await Transaction.deleteOne({ transaction_id: transactionId });

    return NextResponse.json({
      success: true,
      message: "Transaction canceled successfully",
    });
  } catch (error: unknown) {
    console.error("Error canceling transaction:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel transaction",
      },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.buyer_id || !body.seller_id || !body.amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newTransaction = new Transaction({
      transaction_id: new mongoose.Types.ObjectId().toString(),
      buy_order_id: body.buy_order_id,
      sell_order_id: body.sell_order_id,
      amount: body.amount,
      price: body.price,
      total_price: body.total_price,
      buyer_id: body.buyer_id,
      seller_id: body.seller_id,
      currency: body.currency,
      chain: body.chain,
      status: "pending",
      created_at: new Date(),
    });

    const savedTransaction = await newTransaction.save();
    await processReferralCommissions(savedTransaction);

    return NextResponse.json(savedTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// Process referral commissions for a transaction
async function processReferralCommissions(transaction: TransactionDocument) {
  try {
    const buyer = await User.findOne({ wallet_address: transaction.buyer_id });
    const seller = await User.findOne({
      wallet_address: transaction.seller_id,
    });

    if (!buyer || !seller) {
      console.warn(
        "Buyer or seller not found for transaction:",
        transaction.transaction_id
      );
      return;
    }

    const commissions = calculateCommissions(transaction.amount);

    // Update transaction with commission fees
    await Transaction.findOneAndUpdate(
      { transaction_id: transaction.transaction_id },
      {
        $set: {
          fees: {
            buyer_referrer_commission: commissions.buyerReferrerCommission,
            seller_referrer_commission: commissions.sellerReferrerCommission,
          },
        },
      }
    );

    // Update buyer's referral earnings if they have a referrer
    if (buyer.parent_ref) {
      const buyerReferrer = await User.findOne({
        referral_code: buyer.parent_ref,
      });
      if (buyerReferrer) {
        await User.findByIdAndUpdate(buyerReferrer._id, {
          $inc: { referral_earnings: commissions.buyerReferrerCommission },
        });
      }
    }

    // Update seller's referral earnings if they have a referrer
    if (seller.parent_ref) {
      const sellerReferrer = await User.findOne({
        referral_code: seller.parent_ref,
      });
      if (sellerReferrer) {
        await User.findByIdAndUpdate(sellerReferrer._id, {
          $inc: { referral_earnings: commissions.sellerReferrerCommission },
        });
      }
    }
  } catch (error) {
    console.error("Error processing referral commissions:", error);
  }
}
