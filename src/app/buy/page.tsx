'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { chainMetadata, evmChains } from '@/lib/config/chains';
import { Order, UserSettings, BuyOrderResponse } from '@/types/order';
import { getCountryCodes, getMaxAmount, validateAmount, calculateFiatFee, calculateCryptoFee, calculateNetCryptoAmount } from '@/utils/order';
import { getCurrency } from '@/utils/currency';
import OrderFilters from '@/components/buy/OrderFilters';
import OrderListItem from '@/components/buy/OrderListItem';
import BuyConfirmationDialog from '@/components/buy/BuyConfirmationDialog';

export default function BuyPage() {
  const { address } = useAccount();
  const [selectedChain, setSelectedChain] = useState<number | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const safeOrders = Array.isArray(orders) ? orders : [];
  const [selectedToken, setSelectedToken] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [confirmCurrency, setConfirmCurrency] = useState<string>('');
  const [confirmPayment, setConfirmPayment] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sellerSettings, setSellerSettings] = useState<Record<string, UserSettings>>({});

  const fetchSellerSettings = async (wallet: string) => {
    try {
      const response = await fetch(`/api/settings?wallet=${wallet}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching seller settings:', error);
    }
    return null;
  };

  const fetchOrders = useCallback(async () => {
    try {
      // Fetch sell orders
      const response = await fetch('/api/orders?type=sell');
      const data = await response.json();
      
      // Fetch active transactions to adjust available amounts
      const transactionsResponse = await fetch('/api/transactions');
      const transactions = await transactionsResponse.json();
      
      // Check for transactions that need to be canceled (older than 15 minutes and still pending)
      for (const tx of transactions) {
        if (tx.status === 'pending') {
          const txTime = new Date(tx.created_at).getTime();
          const currentTime = Date.now();
          const elapsedSeconds = Math.floor((currentTime - txTime) / 1000);
          
          if (elapsedSeconds > 30) { // 15 minutes = 900 seconds ** chang to 30 sec at this time
            // Cancel the transaction and restore the balance
            try {
              console.log("Updating transaction status to canceled for:", tx.transaction_id);
              
              // First, update the transaction status
              const transactionResponse = await fetch(
                `/api/transactions?transactionId=${tx.transaction_id}`,
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
                continue;
              }
              
              // Then, find the order to get current details
              const orderResponse = await fetch(`/api/orders/${tx.sell_order_id}`);
              if (!orderResponse.ok) {
                console.error("Failed to fetch order details");
                continue;
              }
              
              const orderData = await orderResponse.json();
              
              // Calculate new remaining balance by adding back the canceled amount
              const currentRemainingBalance = orderData.remainingBalance !== undefined ? 
                orderData.remainingBalance : orderData.amount;
              const newRemainingBalance = currentRemainingBalance + tx.amount;
              
              // Calculate new remaining buyers
              const currentRemainingBuyers = orderData.remainingBuyers !== undefined ?
                orderData.remainingBuyers : (orderData.numBuyers || 1);
              const newRemainingBuyers = currentRemainingBuyers + 1;
              
              // Update the order with new remaining balance
              const updateOrderResponse = await fetch(`/api/orders/${tx.sell_order_id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  remainingBalance: Math.min(newRemainingBalance, orderData.amount),
                  remainingBuyers: Math.min(newRemainingBuyers, orderData.numBuyers || 1)
                }),
              });
              
              if (!updateOrderResponse.ok) {
                console.error("Failed to update order remaining balance");
              } else {
                console.log("Successfully restored balance for canceled transaction");
              }
            } catch (error) {
              console.error("Error updating transaction status:", error);
            }
          }
        }
      }
      
      // Create a map of sell order IDs to matching transactions
      const matchingTransactions = new Map();
      transactions.forEach((transaction: any) => {
        if (transaction.sell_order_id) {
          if (!matchingTransactions.has(transaction.sell_order_id)) {
            matchingTransactions.set(transaction.sell_order_id, []);
          }
          matchingTransactions.get(transaction.sell_order_id).push(transaction);
        }
      });
      
      // Adjust available amounts for orders with active transactions
      const adjustedOrders = data.map((order: Order) => {
        const orderTransactions = matchingTransactions.get(order.order_id) || [];
        
        // Calculate total amount in active and completed transactions
        const reservedAmount = orderTransactions.reduce((total: number, tx: any) => {
          // Count all transactions except canceled ones
          if (tx.status !== 'canceled' && tx.status !== 'cancelled') {
            return total + tx.amount;
          }
          return total;
        }, 0);
        
        // Adjust the displayed amount
        return {
          ...order,
          remainingBalance: order.amount - reservedAmount
        };
      });
      
      setOrders(adjustedOrders);

      const uniqueSellers = Array.from(new Set(adjustedOrders.map((order: Order) => order.user_id))) as string[];
      const settingsPromises = uniqueSellers.map((wallet: string) => fetchSellerSettings(wallet));
      const settingsResults = await Promise.all(settingsPromises);
      
      const newSellerSettings: Record<string, UserSettings> = {};
      uniqueSellers.forEach((wallet: string, index) => {
        if (settingsResults[index]) {
          newSellerSettings[wallet] = settingsResults[index];
        }
      });
      
      setSellerSettings(newSellerSettings);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  const getLocation = useCallback(async () => {
    try {
      const response = await fetch('/api/location');
      const data = await response.json();
      if (data.currency) {
        setSelectedCurrency(data.currency);
      }
      console.log('Your country:', data.country_code || 'Unknown');
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, []);

  useEffect(() => {
    (() => {
      fetchOrders();
      getLocation();

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(console.error);
        }
      }
    })();
  }, [fetchOrders, getLocation]);

  const handleBuyOrder = async (order: Order) => {
    setSelectedOrder(order);
    // Use remainingBalance if available, otherwise use the full amount
    const availableAmount = typeof order.remainingBalance !== 'undefined' ? order.remainingBalance : order.amount;
    setBuyAmount(availableAmount.toFixed(4));

    const countryCodes = getCountryCodes(order);
    const primaryCountry = countryCodes[0];
    const currency = getCurrency(primaryCountry);
    setConfirmCurrency(currency || 'THB');

    if (primaryCountry === 'TH') {
      setConfirmPayment('promptpay');
    } else if (primaryCountry === 'CN') {
      setConfirmPayment('alipay');
    } else {
      setConfirmPayment('bank');
    }

    setIsConfirmOpen(true);
  };

  const router = useRouter();

  const handleConfirmBuy = async () => {
    if (!selectedOrder) {
      alert('No order selected');
      return;
    }

    if (!address) {
      alert('Please connect your wallet first');
      setIsConfirmOpen(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!address) {
      alert('Please connect your wallet first');
      setIsConfirmOpen(false);
      return;
    }

    const minAmount = selectedOrder.minBuyAmount || 0;
    const maxAmount = typeof selectedOrder.remainingBalance !== 'undefined' 
      ? selectedOrder.remainingBalance 
      : selectedOrder.amount;

    if (!validateAmount(buyAmount, minAmount, maxAmount) || !address) {
      console.log('Validation failed');
      return;
    }

    try {
      setIsLoading(true);
      const orderAmount = Number(buyAmount);
      const netCryptoAmount = calculateNetCryptoAmount(orderAmount);
      const cryptoFee = calculateCryptoFee(orderAmount);

      const countryCodes = getCountryCodes(selectedOrder);
      const orderPrice = selectedOrder.rates?.[countryCodes[0]] || selectedOrder.price || 0;
      const totalPrice = orderAmount * orderPrice;
      const fiatFee = calculateFiatFee(totalPrice);
      const finalTotalPrice = totalPrice + fiatFee;

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }

      const matchingCountryCodes = countryCodes.filter(code => getCurrency(code) === confirmCurrency);
      const finalCountryCodes = matchingCountryCodes.length > 0 ? matchingCountryCodes : [countryCodes[0]];

      const rates: Record<string, number> = {};
      finalCountryCodes.forEach(code => {
        rates[code] = selectedOrder.rates?.[code] || orderPrice;
      });

      const buyOrderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'buy',
          user_id: address,
          amount: orderAmount,
          net_amount: netCryptoAmount,
          crypto_fee: cryptoFee,
          price: orderPrice,
          rates: rates,
          minBuyAmount: minAmount,
          total_price: finalTotalPrice,
          currency: selectedOrder.currency,
          chain: selectedOrder.chain,
          wallet_address: address,
          payment_method: confirmPayment,
          countryCodes: finalCountryCodes.join(','),
          transaction_fee: fiatFee,
          expiration_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending'
        }),
      });

      if (!buyOrderResponse.ok) {
        const error = await buyOrderResponse.json();
        throw new Error(error.error || 'Failed to create buy order');
      }

      const { order: buyOrderData, notifications } = await buyOrderResponse.json() as BuyOrderResponse;

      if (notifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        notifications.forEach(({ userId, message }) => {
          if (userId === address) {
            new Notification('New Buy Order', {
              body: message,
              icon: '/money-bag.svg',
              tag: buyOrderData.order_id
            });
          }
        });
      }

      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buy_order_id: buyOrderData.order_id,
          sell_order_id: selectedOrder.order_id,
          buyer_id: address,
          seller_id: selectedOrder.user_id,
          amount: orderAmount,
          net_amount: netCryptoAmount,
          crypto_fee: cryptoFee,
          price: orderPrice,
          total_price: finalTotalPrice,
          currency: selectedOrder.currency,
          chain: selectedOrder.chain,
          payment_method: confirmPayment,
          payment_currency: confirmCurrency,
          wallet_address: address,
          transaction_fee: fiatFee,
          txHash: 'pending'
        }),
      });

      if (!transactionResponse.ok) {
        const error = await transactionResponse.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      const transactionData = await transactionResponse.json();
      
      setIsConfirmOpen(false);
      setSelectedOrder(null);
      setBuyAmount('');
      router.push(`/mytrade?chat=true&order=${buyOrderData.order_id}&transactionId=${transactionData.transaction_id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = safeOrders
    .filter((order: Order) => {
      if (selectedChain !== 'all' && Number(selectedChain) !== evmChains.find(chain => chainMetadata[chain.id].name === order.chain)?.id) {
        return false;
      }

      if (selectedToken !== 'all' && order.currency !== selectedToken) {
        return false;
      }

      if (selectedPayment !== 'all' && order.payment_method !== selectedPayment) {
        return false;
      }

      if (selectedCurrency !== 'all') {
        const countryCodes = getCountryCodes(order);
        const hasMatchingCountry = countryCodes.some(code => {
          const currency = getCurrency(code);
          return currency === selectedCurrency;
        });
        if (!hasMatchingCountry) {
          return false;
        }
      }

      return true;
    })
    .sort((a: Order, b: Order) => {
      const aPrice = a.rates?.[getCountryCodes(a)[0]] || a.price || 0;
      const bPrice = b.rates?.[getCountryCodes(b)[0]] || b.price || 0;
      
      if (aPrice === bPrice) {
        return b.amount - a.amount; // Sort by amount from largest to least when prices are equal
      }
      
      return sortOrder === 'desc' ? bPrice - aPrice : aPrice - bPrice;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!address && (
        <div className="mb-4">
        </div>
      )}
      <div className="bg-black shadow rounded-lg overflow-hidden">
        {!address && (
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Please connect wallet to buy cryptocurrency.</h2>
          </div>
        )}
        {address && (
          <>
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Buy Cryptocurrency</h2>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <OrderFilters
                  selectedChain={selectedChain}
                  setSelectedChain={setSelectedChain}
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  selectedCurrency={selectedCurrency}
                  setSelectedCurrency={setSelectedCurrency}
                  selectedPayment={selectedPayment}
                  setSelectedPayment={setSelectedPayment}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                />

                <div className="grid grid-cols-1 gap-4">
                  <div className="hidden md:grid md:grid-cols-5 gap-8 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
                    <div>Advertisers</div>
                    <div className="text-center">Price</div>
                    <div className="text-center">Available/Order Limit</div>
                    <div className="text-center">Countries</div>
                    <div className="text-right">Trade</div>
                  </div>
                  {filteredOrders.map((order: Order) => (
                    <OrderListItem
                      key={order.order_id}
                      order={order}
                      sellerSettings={sellerSettings}
                      selectedCurrency={selectedCurrency}
                      onBuyClick={handleBuyOrder}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BuyConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        selectedOrder={selectedOrder}
        buyAmount={buyAmount}
        setBuyAmount={setBuyAmount}
        confirmCurrency={confirmCurrency}
        setConfirmCurrency={setConfirmCurrency}
        confirmPayment={confirmPayment}
        setConfirmPayment={setConfirmPayment}
        isLoading={isLoading}
        onConfirm={handleConfirmBuy}
        getMaxAmount={getMaxAmount}
        validateAmount={validateAmount}
      />
    </div>
  );
}
