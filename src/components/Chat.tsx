"use client";

import { useEffect, useState, useRef, useCallback, type ChangeEvent } from "react";
import Image from "next/image";
// import { useEthSignature } from "@/hooks/useEthSignature";
// import { useInitializedWeb3Modal } from "@/hooks/useInitializedWeb3Modal";
import { usePrivateKeyTransfer } from "@/hooks/usePrivateKeyTransfer";
import { useAccount } from "wagmi";

import type { PollingContextType } from "@/components/providers/SocketProvider";
import type {
  Message,
  OrderDetails,
  PaymentMethod,
  SellerSettings,
  TransactionDetails,
} from "@/types/chat";

interface ChatProps {
  orderId: string;
  currentUser: string;
  otherUser: string;
  transactionId: string;
  role: "buyer" | "seller";
  buyer_payment_confirmed: boolean;
  seller_payment_confirmed: boolean;
  onPaymentConfirm: () => Promise<void>;
  polling: PollingContextType;
}

export default function Chat({
  orderId,
  currentUser,
  otherUser,
  transactionId,
  role,
  buyer_payment_confirmed,
  seller_payment_confirmed,
  onPaymentConfirm,
  polling,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNewOrder] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [transactionDetails, setTransactionDetails] =
    useState<TransactionDetails | null>(null);
  const [sellerSettings, setSellerSettings] = useState<SellerSettings | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chainId } = useAccount();
  const [currentChainId, setCurrentChainId] = useState<
    11155111 | 1 | 56 | 42161
  >(1);
  // const ethSignature = useEthSignature(currentChainId);
  // const { open: openConnectModal } = useInitializedWeb3Modal();
  const privateKeyTransfer = usePrivateKeyTransfer(currentChainId);
  const { sendMessage: sendPollingMessage, updatePaymentStatus } = polling;

  // Use the user's current chain
  useEffect(() => {
    if (chainId) {
      // Map the user's chain to supported chains
      if (
        chainId === 1 ||
        chainId === 11155111 ||
        chainId === 56 ||
        chainId === 42161
      ) {
        // If it's one of our supported chains, use it directly
        setCurrentChainId(chainId as 11155111 | 1 | 56 | 42161);
      } else {
        // For other chains, default to mainnet
        setCurrentChainId(1);
      }
      console.log(`Using chain ID: ${chainId} (mapped to ${currentChainId})`);
    }
  }, [chainId, currentChainId]);

  // Fetch transaction, order details and seller settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get transaction details
        const transactionResponse = await fetch(
          `/api/transactions/${transactionId}`
        );
        const transactionData = await transactionResponse.json();
        setTransactionDetails(transactionData);

        // Get order details
        const orderResponse = await fetch(
          `/api/orders/${transactionData.buy_order_id}`
        );
        const orderData = await orderResponse.json();
        setOrderDetails(orderData);

        // Finally get seller settings
        const settingsResponse = await fetch(
          `/api/settings?wallet=${transactionData.seller_id}`
        );
        const settingsData = await settingsResponse.json();
        setSellerSettings(settingsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [transactionId]);

  // Add state for payment confirmation
  const [buyerPaymentConfirmed, setBuyerPaymentConfirmed] = useState(
    buyer_payment_confirmed
  );
  const [sellerPaymentConfirmed, setSellerPaymentConfirmed] = useState(
    seller_payment_confirmed
  );

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat?orderId=${orderId}`);
      const data = await response.json();

      // Update messages only if there are new ones
      setMessages((prevMessages: Message[]) => {
        // If no previous messages, set all messages
        if (prevMessages.length === 0) return data;

        // Filter out messages we already have
        const newMessages = data.filter(
          (msg: Message) =>
            !prevMessages.some((existingMsg) => existingMsg._id === msg._id)
        );

        // If we have new messages, append them
        if (newMessages.length > 0) {
          return [...prevMessages, ...newMessages];
        }

        return prevMessages;
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [orderId]);

  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Set up polling interval
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Keep payment confirmation states in sync with props
  useEffect(() => {
    setBuyerPaymentConfirmed(buyer_payment_confirmed);
  }, [buyer_payment_confirmed]);

  useEffect(() => {
    setSellerPaymentConfirmed(seller_payment_confirmed);
  }, [seller_payment_confirmed]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        alert("Please select an image file");
      }
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return {
        url: data.url,
        mimeType: file.type,
        filename: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!newMessage && !selectedFile) return;

    setIsLoading(true);
    try {
      let attachment;
      if (selectedFile) {
        attachment = await uploadFile(selectedFile);
      }

      const messageData = {
        orderId,
        sender: currentUser,
        receiver: otherUser,
        content: selectedFile && !newMessage ? "attachment" : newMessage,
        attachment,
      };

      await sendPollingMessage(messageData);
      setNewMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatWidthAdmin = async () => {
    if (!currentUser || !orderId) return;

    const chatData = {
      chatId: `admin-${orderId}`,
      orderId: orderId,
      content: "Contact Admin",
      participants: [currentUser, role],
      roles: {
        idchain: role,
        admin: "admin",
      },
      status: "active",
    };

    try {
      const response = await fetch(`/api/chatGroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create chat group");
      }

      const savedChat = await response.json();
      console.log("Chat group created successfully:", savedChat);
    } catch (error) {
      console.error("Error creating chat group:", error);
    }
  };

  const handlePaymentConfirmation = async (
    isSellerConfirming: boolean = false
  ) => {
    if (!window.confirm("Are you sure you want to confirm this payment?")) {
      return;
    }

    setIsConfirming(true);
    try {
      // First, send a message to indicate we're starting the confirmation process
      await sendPollingMessage({
        orderId,
        sender: currentUser,
        receiver: otherUser,
        content: "Starting payment confirmation process...",
      });

      // For buyer confirmation, proceed as normal
      if (!isSellerConfirming) {
        // Update payment status through polling service
        await updatePaymentStatus({
          transactionId,
          status: "confirmed",
          role,
          sellerId: otherUser,
        });

        // Update transaction in database
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buyer_payment_confirmed: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update transaction");
        }

        // Send confirmation message
        await sendPollingMessage({
          orderId,
          sender: currentUser,
          receiver: otherUser,
          content: "Buyer has confirmed payment (Auto generate message)",
        });

        setBuyerPaymentConfirmed(true);
      }
      // For seller confirmation, first transfer USDT, then confirm
      else {
        if (!buyerPaymentConfirmed) {
          throw new Error("Buyer has not confirmed payment yet");
        }

        if (!transactionDetails?.amount || !transactionDetails?.buyer_id) {
          throw new Error("Transaction details are missing");
        }

        // First attempt the USDT transfer
        try {
          await sendPollingMessage({
            orderId,
            sender: currentUser,
            receiver: otherUser,
            content: "Processing USDT transfer to buyer...",
          });

          const result = await privateKeyTransfer.transfer(
            transactionDetails.buyer_id,
            transactionDetails.amount.toString(),
            transactionDetails.amount.toString()
          );

          const { success } = result;
          const txHash = result.hash;

          if (!success) {
            throw new Error("USDT transfer failed");
          }

          // Send a message that the transfer was successful
          await sendPollingMessage({
            orderId,
            sender: currentUser,
            receiver: otherUser,
            content: "USDT transfer successful. Processing...",
          });

          // Now update the transaction status
          await updatePaymentStatus({
            transactionId,
            status: "confirmed",
            role,
            sellerId: undefined,
          });

          // Update transaction in database
          const transactionResponse = await fetch(`/api/transactions/${transactionId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              seller_payment_confirmed: true,
              status: "complete",
              txHash: txHash || "completed",
            }),
          });

          if (!transactionResponse.ok) {
            throw new Error("Failed to update transaction");
          }
          
          // Also update both buy and sell orders to complete
          if (transactionDetails && orderDetails) {
            // Get the buy order ID from the orderDetails
            const buyOrderId = orderDetails.order_id;
            
            // Update buy order
            const buyOrderResponse = await fetch(`/api/orders/${buyOrderId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "complete",
              }),
            });
            
            if (!buyOrderResponse.ok) {
              console.error("Failed to update buy order status");
            }
            
            // Fetch the transaction to get the sell order ID
            const transactionResponse = await fetch(`/api/transactions/${transactionId}`);
            const transactionData = await transactionResponse.json();
            const sellOrderId = transactionData.sell_order_id;
            
            // Update sell order
            const sellOrderResponse = await fetch(`/api/orders/${sellOrderId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "complete",
              }),
            });
            
            if (!sellOrderResponse.ok) {
              console.error("Failed to update sell order status");
            }
          }

          // Send confirmation messages
          await sendPollingMessage({
            orderId,
            sender: currentUser,
            receiver: otherUser,
            content:
              "Seller has confirmed receiving payment (Auto generate message)",
          });

          await sendPollingMessage({
            orderId,
            sender: currentUser,
            receiver: otherUser,
            content: `Platform has transferred ${
              transactionDetails.amount
            } USDT (minus 3% fee) to buyer. Transaction hash: ${
              txHash || "completed"
            }`,
          });

          setSellerPaymentConfirmed(true);
          await onPaymentConfirm();
        } catch (error) {
          console.error("USDT transfer error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          let userMessage = "USDT transfer failed. Please contact support.";

          if (errorMessage.includes("INSUFFICIENT_PLATFORM_BALANCE")) {
            userMessage =
              "Platform wallet has insufficient USDT balance. Please contact support.";
          } else if (errorMessage.includes("USDT_NOT_CONFIGURED")) {
            userMessage =
              "USDT contract not properly configured. Please contact support.";
          } else if (
            errorMessage.includes("INVALID_PRIVATE_KEY_FORMAT") ||
            errorMessage.includes("INVALID_PRIVATE_KEY_LENGTH")
          ) {
            userMessage =
              "Platform wallet configuration error. Please contact support.";
          } else if (
            errorMessage.includes("RPC_TIMEOUT") ||
            errorMessage.includes("failed to meet quorum")
          ) {
            userMessage =
              "Network connection issue. Please try again in a few moments.";
          }

          alert(userMessage);
          await sendPollingMessage({
            orderId,
            sender: currentUser,
            receiver: otherUser,
            content: `${userMessage} Error: ${errorMessage}`,
          });

          throw new Error(userMessage);
        }
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      if (errorMessage.includes("WRONG_NETWORK")) {
        alert("Please switch to the correct network and try again.");
      } else if (errorMessage.includes("INSUFFICIENT_BALANCE")) {
        alert("Insufficient ETH balance for signature.");
      } else if (errorMessage.includes("USER_REJECTED")) {
        alert("Transaction was rejected. Please try again.");
      } else {
        alert("Failed to confirm payment: " + errorMessage);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleChatWithAdmin = async () => {
    if (!currentUser || !orderId) return;
    const chatData = {
      chatId: `admin-${orderId}`,
      orderId,
      content: "Admin joined the chat",
      participants: [currentUser, otherUser, "admin_demo"],
      roles: {
        [currentUser]: role,
        [otherUser]: role === "buyer" ? "seller" : "buyer",
        "admin_demo": "admin",
      },
      status: "active",
    };
    try {
      const response = await fetch(`/api/chatGroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create admin chat group");
      }
      const savedChat = await response.json();
      console.log("Admin chat group created:", savedChat);
    } catch (error) {
      console.error("Error creating admin chat group:", error);
    }
  };

  useEffect(() => {
    if (role === "seller" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender !== currentUser) {
        // ใช้เสียงจาก environment variable
        const soundUrl = process.env.NEXT_PUBLIC_SOUND_NOTIFICATION;
        if (soundUrl) {
          const audio = new Audio(soundUrl);
          audio.play().catch(err =>
            console.error("Error playing notification sound:", err)
          );
        }
      }
    }
  }, [messages, role, currentUser]);
  

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-gray-900 rounded-lg shadow-xl">
      {/* Header with Order ID and Payment Status */}
      <div className="px-4 py-3 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Order #{orderId}</h2>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={handleChatWidthAdmin}
              disabled={isCreatingNewOrder}
              className="px-3 py-1 text-xs bg-orange-400 text-white rounded hover:bg-orange-300 disabled:opacity-50 transition-colors"
            >
              {isCreatingNewOrder ? "Creating..." : "Admin"}
            </button>
            {role === "buyer" && (
              <button
                // onClick={handleCreateNewBuyOrder}
                onClick={handleChatWithAdmin}
                disabled={isCreatingNewOrder}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCreatingNewOrder ? "Creating..." : "New Buy Order"}
              </button>
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  buyerPaymentConfirmed ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-gray-300">Buyer</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  sellerPaymentConfirmed ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-gray-300">Seller</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {orderDetails && sellerSettings && (
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-base font-semibold text-blue-400">
                Payment Methods
              </h3>
            </div>
            {!(buyerPaymentConfirmed && sellerPaymentConfirmed) && (
              <div className="flex gap-2">
                {role === "buyer" && !buyerPaymentConfirmed && (
                  <button
                    onClick={() => handlePaymentConfirmation(false)}
                    disabled={isConfirming}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isConfirming ? "Confirming..." : "Confirm Payment"}
                  </button>
                )}
                {role === "seller" && !sellerPaymentConfirmed && (
                  <button
                    onClick={() => handlePaymentConfirmation(true)}
                    disabled={isConfirming || !buyerPaymentConfirmed}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isConfirming
                      ? "Confirming..."
                      : !buyerPaymentConfirmed
                      ? "Waiting for Buyer"
                      : "Confirm Received"}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {sellerSettings?.paymentMethods &&
              Object.entries(sellerSettings.paymentMethods)
                .filter(
                  ([countryCode]) => countryCode === orderDetails.countryCodes
                )
                .map(([countryCode, method]: [string, PaymentMethod]) => (
                  <div
                    key={countryCode}
                    className="bg-gray-700/50 rounded-lg p-2.5 hover:bg-gray-700 transition-colors"
                  >
                    <div className="grid grid-cols-[auto,1fr,1fr] gap-2">
                      {/* Flag and Bank Name */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-5 bg-gray-600 rounded overflow-hidden">
                          <div
                            className={`w-full h-full text-xs font-bold flex items-center justify-center ${
                              countryCode === "TH"
                                ? "bg-[#ED1C24]"
                                : "bg-[#CE1126]"
                            }`}
                          >
                            {countryCode}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-white leading-tight">
                            {method.bankName}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {countryCode} Bank Account
                          </p>
                        </div>
                      </div>

                      {/* Account Name */}
                      <div className="bg-gray-800/50 px-2.5 py-1.5 rounded">
                        <p className="text-xs font-medium text-gray-400">
                          Account Name
                        </p>
                        <p className="text-sm text-white font-medium">
                          {method.bankAccountName}
                        </p>
                      </div>

                      {/* Account Number */}
                      <div className="bg-gray-800/50 px-2.5 py-1.5 rounded">
                        <p className="text-xs font-medium text-gray-400">
                          Account Number
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium font-mono">
                              {method.bankAccount}
                            </p>
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                navigator.clipboard.writeText(
                                  method.bankAccount
                                );
                                const btn = e.currentTarget;
                                const icon = btn.querySelector(".copy-icon");
                                const check = btn.querySelector(".check-icon");
                                if (
                                  !(icon instanceof Element) ||
                                  !(check instanceof Element)
                                )
                                  return;

                                icon.classList.add("opacity-0");
                                check.classList.remove("opacity-0");
                                btn.classList.remove(
                                  "text-blue-400",
                                  "hover:text-blue-300"
                                );
                                btn.classList.add("text-green-400");

                                setTimeout(() => {
                                  icon.classList.remove("opacity-0");
                                  check.classList.add("opacity-0");
                                  btn.classList.remove("text-green-400");
                                  btn.classList.add(
                                    "text-blue-400",
                                    "hover:text-blue-300"
                                  );
                                }, 2000);
                              }}
                              id={`copy-btn-${method.bankAccount}`}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors rounded-full hover:bg-gray-600/50"
                              title="Copy to clipboard"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 copy-icon transition-opacity duration-200"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                />
                              </svg>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5 check-icon opacity-0 absolute top-0 left-0 transition-opacity duration-200"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`mb-4 ${
              message.sender === currentUser ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg shadow-sm ${
                message.sender === currentUser
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {message.attachment && (
                <div className="mb-2">
                  <Image
                    src={message.attachment.url}
                    alt={message.attachment.filename}
                    width={200}
                    height={200}
                  />
                </div>
              )}
              <div className="relative">
                {message.content.startsWith("data:image/") ? (
                  <Image
                    src={message.content}
                    alt="Base64 Image"
                    className="rounded-lg"
                    width={200}
                    height={200}
                  />
                ) : (
                  <p>{message.content}</p>
                )}
                <div className="border-t border-gray-600/30 mt-2 pt-1 flex justify-between items-center">
                  <span className="text-[10px] opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.sender === currentUser && (
                    <div className="flex items-center justify-center w-14 h-4 bg-gray-800/50 rounded text-[10px] transition-all duration-300">
                      <span
                        className={`transition-opacity duration-300 ${
                          message.status === "sent"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        sent
                      </span>
                      <span
                        className={`absolute transition-opacity duration-300 ${
                          message.status === "delivered"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        delivered
                      </span>
                      <span
                        className={`absolute transition-opacity duration-300 ${
                          message.status === "read"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        read
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 bg-gray-700 border-0 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading || (!newMessage && !selectedFile)}
            className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {isLoading ? (
              <span>Sending...</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 p-2 bg-gray-700 rounded-lg flex items-center gap-2">
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt="Selected file"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="flex-1 truncate">{selectedFile.name}</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
