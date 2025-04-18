"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { CompletedOrder, Transaction, PaymentStatus } from "@/types/trade";
import { usePolling } from "@/components/providers/SocketProvider";
import MyTradeTable from "@/components/mytrade/MyTradeTable";
import ChatDialog from "@/components/mytrade/ChatDialog";
import CancelConfirmDialog from "@/components/mytrade/CancelConfirmDialog";
import NotificationsModal from "@/components/NotificationsModal";

export default function MyTradePage() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(
    null
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(
    null
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [isPlaySound, setIsPlaySound] = useState<boolean>(false);

  const polling = usePolling();

  // Add a function to generate unique keys
  const generateUniqueKey = (order: CompletedOrder, prefix: string) => {
    return `${prefix}-${order.order_id}-${order.transaction_id}`;
  };

  // Fetch matched orders
  const fetchMatchedOrders = useCallback(async () => {
    if (!address) return;

    try {
      // Fetch transactions where the user is either buyer or seller
      const transactionsResponse = await fetch("/api/transactions");
      if (!transactionsResponse.ok) {
        throw new Error(`HTTP error! status: ${transactionsResponse.status}`);
      }
      const data = await transactionsResponse.json();

      // Ensure transactions is an array
      const transactions: Transaction[] = Array.isArray(data) ? data : [];

      // Filter transactions where user is involved
      const userTransactions = transactions.filter(
        (t) => t.buyer_id === address || t.seller_id === address
      );

      // Fetch all orders
      const ordersResponse = await fetch("/api/orders");
      const allOrders = await ordersResponse.json();

      // Fetch user settings for all users involved
      const uniqueUserIds = new Set([
        ...userTransactions.map((t) => t.buyer_id),
        ...userTransactions.map((t) => t.seller_id),
      ]);

      const userSettingsPromises = Array.from(uniqueUserIds).map(
        async (userId) => {
          const response = await fetch(`/api/settings?wallet=${userId}`);
          if (!response.ok) return null;
          const data = await response.json();
          return { userId, settings: data };
        }
      );

      const userSettingsResults = await Promise.all(userSettingsPromises);
      const userSettings = Object.fromEntries(
        userSettingsResults
          .filter(
            (
              result
            ): result is {
              userId: string;
              settings: { wallet_address: string; [key: string]: unknown };
            } => result !== null
          )
          .map(({ userId, settings }) => [userId, settings])
      );

      // Create orders from transactions
      const matchedOrders = userTransactions
        .map((transaction) => {
          const isBuyer = transaction.buyer_id === address;
          const orderType = isBuyer ? "buy" : "sell";
          const counterpartyId = isBuyer
            ? transaction.seller_id
            : transaction.buyer_id;

          // Find the corresponding original order
          const originalOrder = allOrders.find((o: { order_id: string }) =>
            isBuyer
              ? o.order_id === transaction.buy_order_id
              : o.order_id === transaction.sell_order_id
          );

          if (!originalOrder) return null;

          return {
            ...originalOrder,
            type: orderType,
            amount: transaction.amount,
            price: transaction.price,
            total_price: transaction.total_price,
            transaction_id: transaction.transaction_id,
            counterparty_id: counterpartyId,
            status: originalOrder.status, // Use original order status
            buyer: userSettings[transaction.buyer_id],
            seller: userSettings[transaction.seller_id],
            buyer_payment_confirmed:
              transaction.buyer_payment_confirmed || false,
            seller_payment_confirmed:
              transaction.seller_payment_confirmed || false,
          } as CompletedOrder;
        })
        .filter((order): order is CompletedOrder => order !== null);

      setOrders(matchedOrders);
    } catch (error) {
      console.error("Error fetching matched orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Function to update transaction status to canceled
  const updateTransactionStatus = useCallback(async (transactionId: string) => {
    try {
      console.log("Updating transaction status to canceled for:", transactionId);
      
      // First, find the order associated with this transaction
      const order = orders.find(o => o.transaction_id === transactionId);
      if (!order) {
        console.error("Order not found for transaction:", transactionId);
        return;
      }
      
      // Get the sell order ID (regardless of whether the current user is buyer or seller)
      // We need to fetch the transaction to get the sell_order_id
      const transactionResponse = await fetch(`/api/transactions/${transactionId}`);
      if (!transactionResponse.ok) {
        console.error("Failed to fetch transaction details");
        return;
      }
      
      const transactionData = await transactionResponse.json();
      const sellOrderId = transactionData.sell_order_id;
      if (!sellOrderId) {
        console.error("Sell order ID not found for transaction:", transactionId);
        return;
      }
      
      // Update transaction status to canceled
      const response = await fetch(
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

      if (!response.ok) {
        console.error("Failed to update transaction status");
        return;
      }
      
      console.log("Successfully updated transaction status to canceled");
      
      // Force a refresh of the sell page data by making a request to the sell order API
      try {
        await fetch(`/api/orders?refresh=true`);
      } catch (error) {
        console.error("Error refreshing orders data:", error);
      }
      
      // Then, find the sell order to get current remaining balance
      const orderResponse = await fetch(`/api/orders/${sellOrderId}`);
      if (!orderResponse.ok) {
        console.error("Failed to fetch sell order details");
        return;
      }
      
      const orderData = await orderResponse.json();
      
      // Calculate new remaining balance by adding back the canceled amount
      const subOrderAmount = order.amount;
      const currentRemainingBalance = orderData.remainingBalance !== undefined ? 
        orderData.remainingBalance : orderData.amount;
      const newRemainingBalance = currentRemainingBalance + subOrderAmount;
      
      // Calculate new remaining buyers
      const currentRemainingBuyers = orderData.remainingBuyers !== undefined ?
        orderData.remainingBuyers : (orderData.numBuyers || 1);
      const newRemainingBuyers = currentRemainingBuyers + 1;
      
      // Update the order with new remaining balance
      const updateOrderResponse = await fetch(`/api/orders/${sellOrderId}`, {
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
      
      // Update orders locally to reflect the canceled status immediately
      setOrders(prevOrders => 
        prevOrders.map(o => {
          if (o.transaction_id === transactionId) {
            return {
              ...o,
              status: "canceled"
            };
          }
          return o;
        })
      );
      
      // Force refresh orders to get the updated status from the database
      await fetchMatchedOrders();
    } catch (error) {
      console.error("Error updating transaction status:", error);
    }
  }, [orders, fetchMatchedOrders]);

  // Initialize payment status from orders
  useEffect(() => {
    const initialStatus: PaymentStatus = {};
    orders.forEach((order) => {
      initialStatus[order.transaction_id] = {
        buyer: order.buyer_payment_confirmed,
        seller: order.seller_payment_confirmed,
      };
    });
    setPaymentStatus(initialStatus);
  }, [orders]);

  // Event handlers
  const handlePaymentStatusUpdate = useCallback(
    (data: { transactionId: string; role: "buyer" | "seller" }) => {
      console.log("Payment status updated:", data);

      setPaymentStatus((prev) => ({
        ...prev,
        [data.transactionId]: {
          buyer:
            data.role === "buyer"
              ? true
              : prev[data.transactionId]?.buyer || false,
          seller:
            data.role === "seller"
              ? true
              : prev[data.transactionId]?.seller || false,
        },
      }));

      // Update orders state to trigger re-render
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.transaction_id === data.transactionId) {
            const buyerConfirmed = data.role === "buyer" ? true : order.buyer_payment_confirmed;
            const sellerConfirmed = data.role === "seller" ? true : order.seller_payment_confirmed;
            
            // If both buyer and seller have confirmed, update status to "completed"
            const newStatus = buyerConfirmed && sellerConfirmed ? "completed" : order.status;
            
            return {
              ...order,
              buyer_payment_confirmed: buyerConfirmed,
              seller_payment_confirmed: sellerConfirmed,
              status: newStatus,
            };
          }
          return order;
        })
      );
    },
    []
  );

  // Poll for payment status updates
  useEffect(() => {
    const checkPaymentUpdates = async () => {
      try {
        // Get all transactions
        const response = await fetch("/api/transactions");
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const transactions = await response.json();

        // Check each transaction for updates
        transactions.forEach((transaction: Transaction) => {
          // Find matching order
          const order = orders.find(
            (o) => o.transaction_id === transaction.transaction_id
          );
          if (!order) return;

          // Check for buyer payment confirmation for seller's orders
          if (
            transaction.buyer_payment_confirmed &&
            !order.buyer_payment_confirmed &&
            transaction.seller_id === address
          ) {
            // Update payment status first
            handlePaymentStatusUpdate({
              transactionId: transaction.transaction_id,
              role: "buyer",
            });

            // Play ringing sound
            const audio = new Audio("/phone-ringing-48238.mp3");
            audio.volume = 1.0; // Ensure full volume
            audio.loop = true; // Keep playing until stopped
            audio.play().catch(console.error);

            // Stop the sound after 10 seconds
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 10000);

            // Show browser notification
            if (Notification.permission === "granted") {
              new Notification("Payment Confirmed", {
                body: "Payment has been confirmed for your transaction",
                icon: "/logo.png",
              });
            }

            // Open chat modal
            setSelectedOrder(order);
            setIsChatOpen(true);

            // Update URL to reflect chat state
            const url = new URL(window.location.href);
            url.searchParams.set("chat", "true");
            url.searchParams.set("order", order.order_id);
            url.searchParams.set("transactionId", order.transaction_id);
            window.history.replaceState({}, "", url);

            // No need to join room with polling
          }

          // Update seller payment confirmation status
          if (
            transaction.seller_payment_confirmed &&
            !order.seller_payment_confirmed
          ) {
            handlePaymentStatusUpdate({
              transactionId: transaction.transaction_id,
              role: "seller",
            });
          }
        });
      } catch (error) {
        console.error("Error checking payment updates:", error);
      }
    };

    // Poll every 5 seconds
    const pollInterval = setInterval(checkPaymentUpdates, 5000);

    // Initial check
    checkPaymentUpdates();

    return () => clearInterval(pollInterval);
  }, [orders, address, handlePaymentStatusUpdate]);

  // Manage countdowns
  useEffect(() => {
    const matchingOrders = orders.filter(
      (order) => order.status === "matching"
    );
    const initialCountdowns: Record<string, number> = {};

    matchingOrders.forEach((order) => {
      const matchTime = new Date(order.updated_at).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - matchTime) / 1000);
      const remainingSeconds = Math.max(30 - elapsedSeconds, 0); // 30 seconds
      initialCountdowns[order.order_id] = remainingSeconds;
      
      // If countdown is already at 0, update the transaction status
      if (remainingSeconds === 0 && order.status === "matching") {
        updateTransactionStatus(order.transaction_id);
      }
    });

    setCountdowns(initialCountdowns);

    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach((orderId) => {
          if (updated[orderId] > 0) {
            updated[orderId] -= 1;
            hasChanges = true;
            
            // If countdown reaches 0, update the transaction status
            if (updated[orderId] === 0) {
              const order = orders.find(o => o.order_id === orderId);
              if (order && order.status === "matching") {
                updateTransactionStatus(order.transaction_id);
              }
            }
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, updateTransactionStatus]);

  // Fetch orders initially and then poll every 5 seconds
  useEffect(() => {
    fetchMatchedOrders().then(() => {
      // Check URL parameters to auto-open chat
      const shouldOpenChat = searchParams.get("chat") === "true";
      const orderId = searchParams.get("order");
      const transactionId = searchParams.get("transactionId");

      if (shouldOpenChat && orderId && transactionId) {
        // Find the order that matches both orderId and transactionId
        const matchingOrder = orders.find(
          (order) =>
            order.order_id === orderId && order.transaction_id === transactionId
        );
        if (matchingOrder) {
          setSelectedOrder(matchingOrder);
          setIsChatOpen(true);
          setIsPlaySound(true);
          // No need to join room with polling
        }
      }
    });

    // Set up polling
    const interval = setInterval(() => {
      console.log("Polling for order updates...");
      fetchMatchedOrders();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [fetchMatchedOrders, searchParams, orders]);

  const handlePaymentConfirmation = useCallback(
    async (order: CompletedOrder) => {
      try {
        const response = await fetch(
          `/api/transactions?transactionId=${order.transaction_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: order.type === "buy" ? "buyer" : "seller",
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to confirm payment");
        }

        // Update will happen through socket event
      } catch (error) {
        console.error("Error confirming payment:", error);
        alert("Failed to confirm payment. Please try again.");
      }
    },
    []
  );

  const handleOpenChat = (order: CompletedOrder) => {
    setSelectedOrder(order);
    setIsChatOpen(true);
    // No need to join room with polling
  };

  const confirmCancelTransaction = async () => {
    if (!transactionToCancel) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/transactions?transactionId=${transactionToCancel}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel transaction");
      }

      await fetchMatchedOrders();
      setShowCancelConfirm(false);
      setTransactionToCancel(null);
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      alert("Failed to cancel transaction. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!address) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">
            Please connect your wallet
          </h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="bg-black shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6">My Trades</h2>
          <MyTradeTable
            orders={orders}
            countdowns={countdowns}
            onOpenChat={handleOpenChat}
            generateUniqueKey={generateUniqueKey}
          />
        </div>
      </div>

      <ChatDialog
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setSelectedOrder(null);
          // Remove chat and related parameters from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("chat");
          url.searchParams.delete("order");
          url.searchParams.delete("transactionId");
          window.history.replaceState({}, "", url);
        }}
        selectedOrder={selectedOrder}
        paymentStatus={paymentStatus}
        onPaymentConfirmation={handlePaymentConfirmation}
        polling={polling}
        currentUserAddress={address}
        isPlaySound={isPlaySound}
      />

      <CancelConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancelTransaction}
        isCancelling={isCancelling}
      />

      <NotificationsModal />
    </div>
  );
}
