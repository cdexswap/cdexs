import Image from 'next/image';
import ReactCountryFlag from 'react-country-flag';
import type { Order } from '@/types/order';
import { useEffect, useRef, useState } from 'react';
import { formatCountdown } from '@/utils/trade';

interface ActiveOrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
  fetchOrders: () => Promise<void>;
}

const chainMap: Record<string, string> = {
  'ethereum': '/chains/eth.svg',
  'binance smart chain': '/chains/bsc.svg',
  'binance chain': '/chains/bsc.svg',
  'bsc': '/chains/bsc.svg',
  'arbitrum': '/chains/arbitrum.svg',
  'base': '/chains/base.svg',
  'polygon': '/chains/polygon.svg',
  'solana': '/chains/solana.svg'
};

const getChainIcon = (chainName: string): string => {
  const normalizedChainName = chainName.toLowerCase();
  return chainMap[normalizedChainName] || '/chains/eth.svg';
};

const getCurrencyIcon = (currency: string, chain: string): string => {
  const normalizedCurrency = currency.toLowerCase();
  const normalizedChain = chain.toLowerCase();

  if ((normalizedCurrency === 'bnb' && (normalizedChain === 'bsc' || normalizedChain === 'binance smart chain')) ||
      ((normalizedChain === 'bsc' || normalizedChain === 'binance smart chain') && normalizedCurrency === normalizedChain)) {
    return chainMap['bsc'];
  }
  if (normalizedCurrency === 'eth' || 
    (normalizedChain === 'ethereum' && normalizedCurrency === chain)) {
    return '/chains/eth.svg';
  }
  if (Object.keys(chainMap).includes(normalizedChain) && normalizedCurrency === normalizedChain) {
    return chainMap[normalizedChain];
  }

  return `/${normalizedCurrency}.svg`;
};

const getCountryCodes = (order: Order): string[] => {
  if (order.countryCodes) {
    return order.countryCodes.split(',');
  }
  if (order.countryCode) {
    return [order.countryCode];
  }
  return [];
};

const getCurrency = (countryCode: string): string => {
  switch(countryCode) {
    case 'TH': return 'THB';
    case 'MY': return 'MYR';
    case 'SG': return 'SGD';
    case 'LA': return 'LAK';
    case 'CN': return 'CNY';
    default: return '';
  }
};

export default function ActiveOrders({ orders, onCancelOrder, fetchOrders }: ActiveOrdersProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  // Set up polling interval
  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        await fetchOrders();
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    
    fetchData();

    // Set up polling interval (every 5 seconds instead of 3 to reduce flickering)
    intervalRef.current = setInterval(fetchData, 5000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchOrders]); // Include fetchOrders in dependency array to ensure it's using the latest function

  // Function to update transaction status to canceled and restore the balance
  const updateTransactionStatus = async (transactionId: string, orderId: string, subOrderAmount: number) => {
    try {
      console.log("Checking transaction status before updating:", transactionId);
      
      // First, check the current transaction status
      const checkResponse = await fetch(`/api/transactions/${transactionId}`);
      if (!checkResponse.ok) {
        console.error("Failed to check transaction status");
        return;
      }
      
      const transaction = await checkResponse.json();
      
      // Don't update if the transaction is already completed
      if (transaction.status === 'completed') {
        console.log("Transaction is already completed, not updating to canceled:", transactionId);
        return;
      }
      
      console.log("Updating transaction status to canceled for:", transactionId);
      
      // Update the transaction status to canceled only if it's not completed
      const transactionResponse = await fetch(
        `/api/transactions?transactionId=${transactionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "canceled"
          }),
        }
      );

      if (!transactionResponse.ok) {
        console.error("Failed to update transaction status");
        return;
      }
      
      // Then, find the order to get current details
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        console.error("Failed to fetch order details");
        return;
      }
      
      const orderData = await orderResponse.json();
      
      // Recalculate remaining balance based on all subOrders
      let totalMatchedAmount = 0;
      let activeSubOrders = 0;
      
      if (orderData.subOrders && orderData.subOrders.length > 0) {
        // Update the local subOrder status to canceled
        orderData.subOrders.forEach((so: any) => {
          if (so.id === transactionId) {
            so.status = 'canceled';
          }
          
          // Count only non-canceled subOrders for the total matched amount
          if (so.status !== 'canceled' && so.status !== 'cancelled') {
            totalMatchedAmount += so.amount;
            activeSubOrders++;
          }
        });
      }
      
      // Calculate new remaining balance as original amount minus matched amount
      const newRemainingBalance = Math.max(0, orderData.amount - totalMatchedAmount);
      
      // Calculate new remaining buyers based on active subOrders
      const numBuyers = orderData.numBuyers || 1;
      const newRemainingBuyers = Math.max(0, numBuyers - activeSubOrders);
      
      // Update the order with recalculated values
      const updateOrderResponse = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remainingBalance: newRemainingBalance,
          remainingBuyers: newRemainingBuyers
        }),
      });
      
      if (!updateOrderResponse.ok) {
        console.error("Failed to update order remaining balance");
      } else {
        console.log("Successfully restored balance for canceled transaction");
        // Fetch updated orders to refresh the UI
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
    }
  };

  // Initialize and update countdowns for matching sub-orders
  useEffect(() => {
    // Initialize countdowns for all matching sub-orders
    const initialCountdowns: Record<string, number> = {};
    
    // Keep track of which sub-orders need to be updated to avoid unnecessary API calls
    const subOrdersToUpdate: Array<{id: string, orderId: string, amount: number}> = [];
    
    orders.forEach(order => {
      if (order.subOrders && order.subOrders.length > 0) {
        order.subOrders.forEach((subOrder: any) => {
          if (subOrder.status === 'matching') {
            const matchTime = new Date(subOrder.updated_at || subOrder.created_at).getTime();
            const currentTime = new Date().getTime();
            const elapsedSeconds = Math.floor((currentTime - matchTime) / 1000);
            const remainingSeconds = Math.max(30 - elapsedSeconds, 0); // 30 seconds
            initialCountdowns[subOrder.id] = remainingSeconds;
            
            // Add to update list if countdown is 0, but don't update status yet to avoid UI flicker
            if (remainingSeconds === 0 && subOrder.status === 'matching') {
              subOrdersToUpdate.push({
                id: subOrder.id,
                orderId: order.order_id,
                amount: subOrder.amount
              });
            }
          }
        });
      }
    });
    
    // Set countdowns first
    setCountdowns(initialCountdowns);
    
    // Then update statuses in a batch to reduce UI flicker
    if (subOrdersToUpdate.length > 0) {
      // Small delay to ensure UI is stable before updates
      setTimeout(() => {
        subOrdersToUpdate.forEach(({id, orderId, amount}) => {
          // Find and update the subOrder status locally
          orders.forEach(order => {
            if (order.order_id === orderId && order.subOrders) {
              const subOrder = order.subOrders.find((so: any) => so.id === id);
              if (subOrder && subOrder.status === 'matching') {
                subOrder.status = 'canceled';
                // Update in database
                updateTransactionStatus(id, orderId, amount);
              }
            }
          });
        });
      }, 100);
    }
    
    // Update countdowns every second
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(id => {
          if (updated[id] > 0) {
            updated[id] -= 1;
            hasChanges = true;
            
            // Find the corresponding sub-order and update its status if countdown reaches 0
            orders.forEach(order => {
              if (order.subOrders) {
                const subOrder = order.subOrders.find((so: any) => so.id === id);
                if (subOrder && updated[id] === 0 && subOrder.status === 'matching') {
                  subOrder.status = 'canceled';
                  updateTransactionStatus(subOrder.id, order.order_id, subOrder.amount);
                }
              }
            });
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [orders]);

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-white mb-4">Your Active Orders</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-800">
            <tr>
              {[
                'Order #', 
                'Chain', 
                'Amount', 
                'Rate', 
                'Remaining Balance', 
                'Buyers', 
                'Remaining', 
                'Status'
              ].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-black divide-y divide-gray-700">
            {orders.map((order: Order, index: number) => (
              <>
              <tr key={`${order.order_id}-main`} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  #{String(index + 1).padStart(4, '0')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <Image
                        src={getChainIcon(order.chain)}
                        alt={order.chain}
                        width={24}
                        height={24}
                      />
                    </div>
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
                    {order.amount} {order.currency}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div className="space-y-1">
                    {getCountryCodes(order).map((code) => (
                      <div key={code} className="flex items-center gap-2">
                        <ReactCountryFlag
                          countryCode={code}
                          svg
                          style={{
                            width: '16px',
                            height: '16px'
                          }}
                          className="rounded-sm"
                        />
                        <span>{getCurrency(code)} {order.rates?.[code]?.toLocaleString() || '-'}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {(order.remainingBalance !== undefined ? order.remainingBalance : order.amount).toFixed(2)}/{order.amount.toFixed(2)} {order.currency}
                    </span>
                    <span className="text-xs text-gray-400">
                      {order.remainingBalance !== undefined ? 
                        `${Math.max(0, Math.min(100, ((order.remainingBalance / order.amount) * 100))).toFixed(0)}% remaining` : 
                        '100% remaining'}
                    </span>
                    {order.remainingBalance === 0 && (
                      <span className="text-xs text-green-400">Fully matched</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {order.numBuyers || 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {order.remainingBuyers !== undefined ? order.remainingBuyers : order.numBuyers || 1}/{order.numBuyers || 1}
                    </span>
                    {order.subOrders && order.subOrders.length > 0 && (
                      <span className="text-xs text-blue-400">
                        {order.subOrders.filter((so: any) => so.status === 'matching').length} matching, 
                        {order.subOrders.filter((so: any) => so.status === 'completed').length} completed,
                        {order.subOrders.filter((so: any) => (so.status === 'canceled' || so.status === 'cancelled')).length} canceled
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${order.subOrders && order.subOrders.every((so: any) => so.status === 'completed') ? 
                      'bg-green-100 text-green-800' : 
                      order.subOrders && order.subOrders.every((so: any) => ['completed', 'canceled', 'cancelled'].includes(so.status)) ?
                      'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'}`}
                  >
                    {order.subOrders && order.subOrders.every((so: any) => so.status === 'completed') ? 
                      'completed' : 
                      order.subOrders && order.subOrders.every((so: any) => ['completed', 'canceled', 'cancelled'].includes(so.status)) ?
                      'finished' :
                      'active'}
                  </span>
                </td>
              </tr>
              
              {/* Sub-row for sub-orders and actions */}
              <tr key={`${order.order_id}-sub`} className="bg-gray-900">
                <td colSpan={10} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    {/* Sub-orders section */}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-2">Sub-Orders</h4>
                      <div className="space-y-2" style={{ minHeight: '50px' }}>
                        {order.subOrders && order.subOrders.length > 0 ? (
                          order.subOrders.map((subOrder: any, idx: number) => (
                            <div key={idx} className="bg-gray-800 p-3 rounded">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full 
                                    ${subOrder.status === 'matching' ? 'bg-blue-500' : 
                                      subOrder.status === 'completed' ? 'bg-green-500' : 
                                      (subOrder.status === 'canceled' || subOrder.status === 'cancelled') ? 'bg-red-500' : 'bg-yellow-500'}`}
                                  />
                                  <span className="text-white text-sm font-medium">
                                    {subOrder.amount} {order.currency}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {subOrder.status === 'matching' && countdowns[subOrder.id] > 0 && (
                                    <span className="text-yellow-500 font-medium">
                                      {formatCountdown(countdowns[subOrder.id])}
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                    ${subOrder.status === 'matching' ? 'bg-blue-100 text-blue-800' : 
                                      subOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                      (subOrder.status === 'canceled' || subOrder.status === 'cancelled') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                                  >
                                    {(subOrder.status === 'cancelled') ? 'canceled' : subOrder.status}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-2 text-xs text-gray-400 flex flex-col gap-1">
                                {subOrder.buyer_id && (
                                  <div className="flex justify-between">
                                    <span>Buyer:</span>
                                    <span className="text-gray-300">{subOrder.buyer_id.substring(0, 6)}...{subOrder.buyer_id.substring(subOrder.buyer_id.length - 4)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Created:</span>
                                  <span className="text-gray-300">{new Date(subOrder.created_at).toLocaleString()}</span>
                                </div>
                                {subOrder.status === 'matching' ? (
                                  <div className="mt-1 text-blue-400">
                                    Waiting for buyer to complete payment
                                  </div>
                                ) : (subOrder.status === 'canceled' || subOrder.status === 'cancelled') ? (
                                  <div className="mt-1 text-red-400">
                                    Payment time expired
                                  </div>
                                ) : subOrder.status === 'completed' ? (
                                  <div className="mt-1 text-green-400">
                                    Payment completed successfully
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-400">No sub-orders yet</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions section */}
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-white mb-2">Actions</h4>
                      <button 
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                        onClick={() => onCancelOrder(order.order_id)}
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
