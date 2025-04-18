'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useUsdtTransfer } from '@/hooks/useUsdtTransfer';
import { chainMetadata, evmChains, chainTokens } from '@/lib/config/chains';
import type { Order } from '@/types/order';

import CreateSellOrderForm from '@/components/sell/CreateSellOrderForm';
import BankAccountSelection from '@/components/sell/BankAccountSelection';
import PriceSummary from '@/components/sell/PriceSummary';
import ActiveOrders from '@/components/sell/ActiveOrders';
import CancelConfirmDialog from '@/components/sell/CancelConfirmDialog';
import NotificationVideoDialog from '@/components/sell/NotificationVideoDialog';

interface UserSettings {
  supportedCountries?: string[];
  paymentMethods?: Record<string, PaymentMethod>;
}

interface PaymentMethod {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

const BASE_FEE_PERCENTAGE = 3;
const ADDITIONAL_FEE_PER_BUYER = 0.4;
const BASE_GAS_FEE_USDT = 0.4; // Base gas fee (0.4 USDT)
const ADDITIONAL_GAS_FEE_PER_BUYER = 0.4; // Additional gas fee per buyer (0.4 USDT)

export default function SellPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { transfer } = useUsdtTransfer(chainId);
  const [selectedChain, setSelectedChain] = useState<number>(evmChains[1].id); // bsc.id (Binance Chain)
  const [amount, setAmount] = useState<string>('');
  const [numBuyers, setNumBuyers] = useState<string>('1');
  const [bankRates, setBankRates] = useState<Record<string, string>>({});
  const [minBuyAmount, setMinBuyAmount] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [showNotificationVideo, setShowNotificationVideo] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Set default token to USDT
  useEffect(() => {
    setSelectedToken("USDT");
  }, [selectedChain]);

  // Fetch user settings
  const fetchUserSettings = useCallback(async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/settings?wallet=${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserSettings(data);
        // Set all countries with bank details as default
        const countriesWithBank = data.supportedCountries?.filter(
          (code: string) => data.paymentMethods?.[code]?.bankName
        );
        if (countriesWithBank?.length) {
          setSelectedCountries(countriesWithBank);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [address]);

  useEffect(() => {
    fetchUserSettings();
  }, [fetchUserSettings]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!address) return;
    
    try {
      // Fetch sell orders
      const response = await fetch('/api/orders?type=sell');
      const data = await response.json();
      const userOrders = data.filter((order: Order) => order.wallet_address === address);
      
      // Fetch transactions to ensure we have the latest sub-order data
      const transactionsResponse = await fetch(`/api/transactions?userId=${address}`);
      const transactions = await transactionsResponse.json();
      
      // Process orders to ensure subOrders are properly populated and calculations are correct
      const processedOrders = userOrders.map((order: Order) => {
        let subOrders = [];
        
        // If the order already has subOrders from the database, use them
        if (order.subOrders && order.subOrders.length > 0) {
          subOrders = order.subOrders;
        } else {
          // Otherwise, check if there are any transactions for this order
          const orderTransactions = transactions.filter((tx: any) => tx.sell_order_id === order.order_id);
          
          if (orderTransactions.length === 0) {
            return order;
          }
          
          // Create subOrders from transactions
          subOrders = orderTransactions.map((tx: any) => ({
            id: tx.transaction_id,
            amount: tx.amount,
            status: tx.status,
            buyer_id: tx.buyer_id,
            created_at: tx.created_at,
            updated_at: tx.updated_at || tx.created_at
          }));
        }
        
        // Always recalculate remaining balance and buyers to ensure accuracy
        const totalMatchedAmount = subOrders.reduce((total: number, so: any) => {
          // Only count non-canceled orders in the matched amount
          return total + (so.status !== 'cancelled' && so.status !== 'canceled' ? so.amount : 0);
        }, 0);
        
        const remainingBalance = Math.max(0, order.amount - totalMatchedAmount);
        const numBuyers = order.numBuyers || 1;
        const usedBuyers = subOrders.filter((so: any) => 
          so.status !== 'cancelled' && so.status !== 'canceled'
        ).length;
        const remainingBuyers = Math.max(0, numBuyers - usedBuyers);
        
        return {
          ...order,
          subOrders,
          remainingBalance,
          remainingBuyers,
          status: subOrders.some((so: any) => so.status === 'matching') ? 'matching' : order.status
        };
      });
      
      setOrders(processedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [address]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const createOrder = async (txHash?: string) => {
    try {
      // Calculate fees based on number of buyers
      const numBuyersValue = Number(numBuyers) || 1;
      const totalFeePercentage = BASE_FEE_PERCENTAGE + (ADDITIONAL_FEE_PER_BUYER * (numBuyersValue - 1));
      const totalGasFee = BASE_GAS_FEE_USDT + (ADDITIONAL_GAS_FEE_PER_BUYER * (numBuyersValue - 1));
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: address || 'USR001',
          type: 'sell',
          amount: Number(amount),
          rates: Object.fromEntries(
            selectedCountries.map(country => [country, Number(bankRates[country] || 0)])
          ),
          total_price: Number(amount) * Number(bankRates[selectedCountries[0]] || 0),
          currency: selectedToken,
          chain: chainMetadata[selectedChain].name,
          wallet_address: address,
          payment_method: selectedCountries.map(country => userSettings?.paymentMethods?.[country]?.bankName || '').join(','),
          transaction_fee: (Number(amount) * Number(bankRates[selectedCountries[0]] || 0) * totalFeePercentage) / 100,
          expiration_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          countryCodes: selectedCountries.join(','),
          minBuyAmount: Number(minBuyAmount[selectedCountries[0]] || '0'),
          maxBuyAmount: Number(amount),
          numBuyers: numBuyersValue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      
      if (txHash) {
        // Update transaction hash
        await fetch(`/api/orders/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usdt_transfer_tx: txHash
          })
        });
      }

      // Reset form
      setAmount('');
      setNumBuyers('1');
      setSelectedCountries([]);
      setBankRates({});
      setMinBuyAmount({});
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const handleCreateOrder = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || selectedCountries.length === 0 || !selectedCountries.every(country => bankRates[country])) {
      alert('Please fill in all required fields including rates for each selected bank');
      return;
    }

    if (selectedToken === 'USDT') {
      try {
        setIsTransferring(true);

        // Pre-validate everything before showing confirmation
        // if (!chainId) {
        //   throw new Error('WALLET_NOT_CONNECTED');
        // }

        // if (!address) {
        //   throw new Error('WALLET_NOT_CONNECTED');
        // }

        // Check if USDT is configured for this chain
        const chainConfig = chainTokens[chainId];
        if (!chainConfig?.USDT) {
          throw new Error('USDT_NOT_CONFIGURED');
        }

        // Then show confirmation dialog
        const numBuyersValue = Number(numBuyers) || 1;
        const totalGasFee = BASE_GAS_FEE_USDT + (ADDITIONAL_GAS_FEE_PER_BUYER * (numBuyersValue - 1));
        const totalAmount = (Number(amount) + totalGasFee).toFixed(2);
        if (!window.confirm(`Please confirm:\n\n1. You will transfer ${amount} USDT + ${totalGasFee.toFixed(2)} USDT gas fee (total: ${totalAmount} USDT) to our escrow wallet\n2. This requires your approval in MetaMask\n3. Your sell order will be created after successful transfer`)) {
          setIsTransferring(false);
          return;
        }
        
        try {
          // Calculate total amount with gas fee
          const numBuyersValue = Number(numBuyers) || 1;
          const totalGasFee = BASE_GAS_FEE_USDT + (ADDITIONAL_GAS_FEE_PER_BUYER * (numBuyersValue - 1));
          const totalAmount = (Number(amount) + totalGasFee).toFixed(2);
          
          // Initiate the transfer with the total amount including gas fee
          const result = await transfer(totalAmount);
          
          // Force create order immediately after transaction is submitted to the network
          // Don't wait for any confirmation or mining
          if (result.success) {
            console.log('Transaction submitted with hash:', result.hash);
            
            // Create order immediately
            try {
              // Check if notification permission is already granted
              if (Notification.permission === 'granted') {
                // If already granted, create order with tx hash
                await createOrder(result.hash);
                alert('Order created successfully! Your transaction has been submitted to the blockchain network.');
              } else {
                // Show notification video if permission not granted
                setShowNotificationVideo(true);
                // Store tx hash to use after video
                localStorage.setItem('pendingTxHash', result.hash);
              }
              
              // Start a background process to monitor the transaction status
              // This doesn't block the UI or order creation
              setTimeout(() => {
                fetch(`https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${result.hash}&apikey=YourBscScanApiKey`)
                  .then(response => response.json())
                  .then(data => {
                    console.log('Transaction status:', data);
                    // We don't need to do anything with this data, just logging for monitoring
                  })
                  .catch(error => {
                    console.error('Error checking transaction status:', error);
                    // Errors here don't affect the user experience since the order is already created
                  });
              }, 10000); // Check after 10 seconds
            } catch (orderError) {
              console.error('Error creating order:', orderError);
              alert('Transaction was submitted, but there was an error creating your order. Please contact support with your transaction hash: ' + result.hash);
            }
          } else {
            alert('USDT transfer failed. Please try again.');
          }
        } catch (error) {
          // This catch block handles errors from the transfer function
          console.error('Transfer error:', error);
          
          // Handle specific error types
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('USER_REJECTED')) {
            console.log('User rejected the transaction');
            // No need to show an alert for user rejection
          } else {
            // For other errors, show the alert from the outer catch block
            throw error;
          }
        }
      } catch (error: Error | unknown) {
        console.error('Transfer error:', error);
        
        // Handle specific error types
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        switch (errorMessage) {
          case 'USDT_NOT_CONFIGURED':
            alert('USDT is not configured for the selected chain. Please switch to a supported network.');
            break;
          case 'WALLET_NOT_CONNECTED':
            alert('Please connect your wallet first.');
            break;
          case 'USER_REJECTED':
            // User rejected in MetaMask - no need to show error
            console.log('User rejected the transaction');
            break;
          case 'INSUFFICIENT_BALANCE':
            alert('Insufficient USDT balance. Please check your balance and try again.');
            break;
          case 'PUBLIC_CLIENT_NOT_AVAILABLE':
            alert('Network client not available. Please check your wallet connection.');
            break;
          case 'NETWORK_ERROR':
            alert('Network error occurred. Please check your connection and try again.');
            break;
          case 'TRANSFER_ERROR':
            // Handle simple TRANSFER_ERROR case
            alert('Error occurred during transfer. Please try again.');
            break;
          case 'APPROVAL_FAILED':
            alert('Failed to approve token transfer. Please try again.');
            break;
          case 'TRANSFER_EXECUTION_FAILED':
            alert('Failed to execute token transfer. Please try again.');
            break;
          case 'RPC_CONNECTION_ERROR':
            alert('Connection error with blockchain network. Please check your internet connection and try again.');
            break;
          case 'NETWORK_SWITCHING_FAILED':
            alert('Failed to switch to the required network. Please manually switch networks in your wallet and try again.');
            break;
          default:
            // Check if it's a detailed error message
            if (typeof errorMessage === 'string') {
              if (errorMessage.startsWith('TRANSFER_ERROR:')) {
                // Extract and display the detailed error message
                const detailedError = errorMessage.substring('TRANSFER_ERROR:'.length).trim();
                console.error('Detailed transfer error:', detailedError);
                alert(`Transfer error: ${detailedError}`);
              } else if (errorMessage.startsWith('RPC_CONNECTION_ERROR:')) {
                const detailedError = errorMessage.substring('RPC_CONNECTION_ERROR:'.length).trim();
                console.error('RPC connection error:', detailedError);
                alert(`Network connection error: ${detailedError}`);
              } else if (errorMessage.startsWith('APPROVAL_FAILED:')) {
                const detailedError = errorMessage.substring('APPROVAL_FAILED:'.length).trim();
                console.error('Approval error:', detailedError);
                alert(`Approval error: ${detailedError}`);
              } else if (errorMessage.startsWith('TRANSFER_EXECUTION_FAILED:')) {
                const detailedError = errorMessage.substring('TRANSFER_EXECUTION_FAILED:'.length).trim();
                console.error('Transfer execution error:', detailedError);
                alert(`Transfer execution error: ${detailedError}`);
              } else if (errorMessage.startsWith('NETWORK_SWITCHING_FAILED:')) {
                const detailedError = errorMessage.substring('NETWORK_SWITCHING_FAILED:'.length).trim();
                console.error('Network switching error:', detailedError);
                alert(`Network switching error: ${detailedError}`);
              } else {
                // Only show generic error for unexpected cases
                console.error('Unexpected error:', error);
                alert('An unexpected error occurred. Please try again.');
              }
            } else {
              // Only show generic error for unexpected cases
              console.error('Unexpected error:', error);
              alert('An unexpected error occurred. Please try again.');
            }
        }
      } finally {
        setIsTransferring(false);
      }
    } else {
      // For non-USDT tokens, proceed without transfer
      if (Notification.permission === 'granted') {
        await createOrder();
      } else {
        setShowNotificationVideo(true);
      }
    }
  };

  const handleVideoEnded = async () => {
    setShowNotificationVideo(false);
    
    // Request notification permission after video ends
    const notificationGranted = await requestNotificationPermission();
    if (!notificationGranted) {
      const confirmContinue = window.confirm('Would you like to continue without notifications? You won\'t receive alerts when someone wants to buy your order.');
      if (!confirmContinue) {
        return;
      }
    }
    
    // Get pending tx hash if exists
    try {
      const pendingTxHash = localStorage.getItem('pendingTxHash');
      if (pendingTxHash) {
        localStorage.removeItem('pendingTxHash');
        await createOrder(pendingTxHash);
      } else {
        await createOrder();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      const response = await fetch(`/api/orders/${orderToCancel}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Refresh orders
      fetchOrders();
      setShowCancelConfirm(false);
      setOrderToCancel(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="bg-black shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Create Sell Order</h2>
          
          {(process.env.NODE_ENV === 'development' || isConnected) && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                {/* Chain and Amount Selection */}
                <CreateSellOrderForm
                  selectedChain={selectedChain}
                  setSelectedChain={setSelectedChain}
                  amount={amount}
                  setAmount={setAmount}
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  numBuyers={numBuyers}
                  setNumBuyers={setNumBuyers}
                />

                {/* Bank Account Selection */}
                <BankAccountSelection
                  userSettings={userSettings}
                  selectedCountries={selectedCountries}
                  setSelectedCountries={setSelectedCountries}
                  bankRates={bankRates}
                  setBankRates={setBankRates}
                  minBuyAmount={minBuyAmount}
                  setMinBuyAmount={setMinBuyAmount}
                  selectedToken={selectedToken}
                  chainMetadata={chainMetadata[selectedChain]}
                />

                {/* Price Summary */}
                <PriceSummary
                  amount={amount}
                  selectedCountries={selectedCountries}
                  bankRates={bankRates}
                  selectedToken={selectedToken}
                  userSettings={userSettings}
                  numBuyers={numBuyers}
                />

                {/* Create Order Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateOrder}
                    disabled={isTransferring}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      isTransferring 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isTransferring ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Confirming Transfer...
                      </>
                    ) : (
                      'Create Sell Order'
          )}
                  </button>
                </div>
              </div>

              {/* Active Orders */}
              <ActiveOrders
                orders={orders}
                onCancelOrder={handleCancelOrder}
                fetchOrders={fetchOrders}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CancelConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancelOrder}
      />

      <NotificationVideoDialog
        isOpen={showNotificationVideo}
        onClose={() => setShowNotificationVideo(false)}
        onVideoEnded={handleVideoEnded}
      />
    </div>
  );
}
