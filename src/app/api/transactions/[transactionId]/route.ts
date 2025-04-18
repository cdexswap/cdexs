import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { ethers } from 'ethers';
import { createNotification } from '@/lib/models/notification';
import { Transaction } from '@/lib/models/transaction';

// ETH Mainnet RPC configuration
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);

interface BlockchainStatus {
  confirmed: boolean;
  confirmations?: number;
  blockNumber?: number;
}

async function checkBlockchainConfirmation(txHash: string): Promise<BlockchainStatus> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    const confirmations = receipt?.confirmations;
    return {
      confirmed: !!receipt,
      confirmations: typeof confirmations === 'function' ? await confirmations() : (confirmations || 0),
      blockNumber: receipt?.blockNumber
    };
  } catch (error) {
    console.error('Blockchain confirmation check failed:', error);
    return { confirmed: false };
  }
}

// GET /api/transactions/[transactionId] - Get specific transaction
export async function GET(request: Request) {
  try {
    await connectDB();

  const transactionId = request.url.split('/').pop()?.split('?')[0];

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await Transaction.findOne({ transaction_id: transactionId });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

interface TransactionUpdate {
  buyer_payment_confirmed?: boolean;
  seller_payment_confirmed?: boolean;
  blockchain_confirmations?: number;
  block_number?: number | null;
  status?: string;
}

// PATCH /api/transactions/[transactionId] - Update transaction
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const transactionId = request.url.split('/').pop()?.split('?')[0];
    const body = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get existing transaction
    const transaction = await Transaction.findOne({ transaction_id: transactionId });
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update confirmation status
    const updateData: TransactionUpdate = {};
    if (body.buyer_payment_confirmed !== undefined) {
      updateData.buyer_payment_confirmed = body.buyer_payment_confirmed;
    }
    if (body.seller_payment_confirmed !== undefined) {
      updateData.seller_payment_confirmed = body.seller_payment_confirmed;
    }
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Check blockchain confirmation if either party confirms
    if (body.buyer_payment_confirmed || body.seller_payment_confirmed) {
      const blockchainStatus = await checkBlockchainConfirmation(transaction.txHash);
      
      if (blockchainStatus.confirmed) {
        updateData.blockchain_confirmations = blockchainStatus.confirmations;
        updateData.block_number = blockchainStatus.blockNumber;
        updateData.status = 'matching';
        
        // Create notification for both parties
        await createNotification({
          userId: transaction.buyer_id,
          type: 'transaction',
          message: `Payment confirmed on blockchain for transaction ${transactionId}`,
          link: `/transactions/${transactionId}`
        });
        
        await createNotification({
          userId: transaction.seller_id,
          type: 'transaction',
          message: `Payment confirmed on blockchain for transaction ${transactionId}`,
          link: `/transactions/${transactionId}`
        });
      }
    }

    await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      { $set: updateData },
      { new: true }
    );

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

      // If both parties have confirmed payment, update order status to complete
      if (transaction.buyer_payment_confirmed && transaction.seller_payment_confirmed) {
        const BuyOrder = mongoose.models.BuyOrder;
        const SellOrder = mongoose.models.SellOrder;

        // Always mark the sell order as completed when transaction is completed
        await SellOrder.findOneAndUpdate(
          { order_id: transaction.sell_order_id },
          { 
            status: 'completed',
            updated_at: new Date()
          }
        );

      // Update buy order to completed
      await BuyOrder.findOneAndUpdate(
        { order_id: transaction.buy_order_id },
        { 
          status: 'completed',
          updated_at: new Date()
        }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
