'use client';

import Image from 'next/image';
import { formatWalletAddress, getChainIcon, getCurrencyIcon } from '@/utils/trade';
import { MyTradeTableProps, Transaction } from '@/types/trade';
import { formatCountdown } from '@/utils/trade';
import { useEffect, useState } from 'react';

export default function MyTradeTable({
  orders,
  countdowns,
  onOpenChat,
  generateUniqueKey
}: MyTradeTableProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Function to handle confirming receipt of payment
  const handleConfirmReceipt = async (transaction: Transaction) => {
    try {
      setIsUpdating(true);
      
      // First update the transaction status to completed
      const transactionResponse = await fetch(`/api/transactions/${transaction.transaction_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
        }),
      });

      if (!transactionResponse.ok) {
        throw new Error('Failed to update transaction');
      }

      // Then update the order status to complete
      // Update both buy and sell orders
      const buyOrderResponse = await fetch(`/api/orders/${transaction.buy_order_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'complete',
        }),
      });

      if (!buyOrderResponse.ok) {
        console.error('Failed to update buy order');
      }

      const sellOrderResponse = await fetch(`/api/orders/${transaction.sell_order_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'complete',
        }),
      });

      if (!sellOrderResponse.ok) {
        console.error('Failed to update sell order');
      }

      // Show success message
      alert('Transaction marked as complete');
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Failed to confirm receipt');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // We no longer need to update the status locally since it's now updated in the database
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300">No matched trades found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-800">
          <tr>
            {['Trading Partner', 'Type', 'Chain', 'Amount', 'Total', 'Status', 'Time Left', 'Created', 'Actions'].map((header, index) => (
              <th
                key={`header-${index}`}
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-black divide-y divide-gray-700">
          {orders.map((order) => (
            <tr key={generateUniqueKey(order, 'row')} className="hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                {order.type === 'sell' 
                  ? (order.buyer?.name || formatWalletAddress(order.counterparty_id))
                  : (order.seller?.name || formatWalletAddress(order.counterparty_id))
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${order.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {order.type === 'buy' ? 'Buy Order' : 'Sell Order'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Image
                    src={getChainIcon(order.chain)}
                    alt={order.chain}
                    width={32}
                    height={32}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-white ml-2">
                    {order.chain === 'Binance Chain' ? 'Binance' : order.chain}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                <div className="flex items-center">
                  <Image
                    src={getCurrencyIcon(order.currency, order.chain)}
                    alt={order.currency}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  {(order.amount * 0.97).toFixed(2)} {order.currency}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                ฿{(order.amount * order.price).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'matching' && countdowns[order.order_id] > 0 ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'}`}
                >
                  {order.status === 'matching' && countdowns[order.order_id] <= 0 ? 'canceled' : order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                {order.status === 'matching' && countdowns[order.order_id] > 0 ? (
                  <span className="text-yellow-500 font-medium">
                    {formatCountdown(countdowns[order.order_id])}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                {new Date(order.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex space-x-2">
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => onOpenChat(order)}
                  >
                    <Image
                      src="/chat.svg"
                      alt="Chat"
                      width={32}
                      height={32}
                    />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
