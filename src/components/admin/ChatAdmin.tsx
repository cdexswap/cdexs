"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";

enum RoleType {
  Admin = "admin",
  Buyer = "buyer",
  Seller = "seller",
}

interface ChatAdminProps {
  orderId: string;
}

interface ChatMessage {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
  attachment?: {
    url: string;
    filename: string;
  };
  status: "sent" | "delivered" | "read";
}

export default function ChatAdmin({ orderId }: ChatAdminProps) {
  // สำหรับ admin เราสามารถตั้งค่าเริ่มต้นเป็น false สำหรับการยืนยัน
    const buyerPaymentConfirmed = false;
    const sellerPaymentConfirmed = false;
  // ตั้งค่า dummy objects เพื่อให้ Payment Information แสดง
  const orderDetails = { dummy: true };
  const sellerSettings = { paymentMethods: {} };
  const role: RoleType = RoleType.Admin;

  const [adminPaymentConfirmed, setAdminPaymentConfirmed] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


const handleAdminConfirmation = async () => {
  if (!window.confirm("Are you sure you want to confirm the order as admin?")) {
    return;
  }
  setIsConfirming(true);
  try {

    const response = await fetch(`/api/admin/confirmOrder?orderId=${orderId}`, {
      method: "PATCH"
    });
    if (!response.ok) {
      throw new Error("Failed to confirm order as admin");
    }

    // await sendPollingMessage({
    //   orderId,
    //   sender: "admin_demo",
    //   receiver: "all",
    //   content: "Admin has confirmed the order (Auto generate message)"
    // });
    setAdminPaymentConfirmed(true);
    alert("Order has been confirmed by admin");
  } catch (error) {
    console.error("Error confirming order as admin:", error);
    alert("Failed to confirm order as admin: " + (error instanceof Error ? error.message : ""));
  } finally {
    setIsConfirming(false);
  }
};


  useEffect(() => {
    if (!orderId) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat?orderId=${orderId}`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return { url: data.url, filename: file.name };
  };

  const sendMessage = async () => {
    if (!newMessage && !selectedFile) return;
    setIsLoading(true);
    try {
      let attachment: ChatMessage['attachment'] | undefined;
      if (selectedFile) {
        attachment = await uploadFile(selectedFile);
      }
      const messageData = {
        orderId,
        sender: "admin_demo",
        receiver: "all",
        content: selectedFile && !newMessage ? "attachment" : newMessage,
        attachment,
      };
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) {
        console.error("Error sending message");
      }
      setNewMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl bg-gray-900 rounded-lg shadow-xl">
      <div className="px-4 py-3 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Order #{orderId}</h2>
          <div className="flex items-center gap-4 text-sm mt-2 sm:mt-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${buyerPaymentConfirmed ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-gray-300">Buyer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${sellerPaymentConfirmed ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-gray-300">Seller</span>
            </div>
          </div>
        </div>
      </div>

      {(role === RoleType.Admin || (orderDetails && sellerSettings)) && (
  <div className="p-4 bg-gray-800 border-b border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          title="Payment Methods Icon"
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
          {!buyerPaymentConfirmed && (
            <button
              type="button"
              disabled={isConfirming}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isConfirming ? "Confirming..." : "Confirm Payment"}
            </button>
          )}
          {!sellerPaymentConfirmed && (
            <button
              type="button"
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
          {role === RoleType.Admin && !adminPaymentConfirmed && (
            <button
              type="button"
              onClick={handleAdminConfirmation}
              disabled={isConfirming}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isConfirming ? "Confirming..." : "Confirm Order"}
            </button>
          )}
        </div>
      )}
    </div>
    <div className="space-y-3">xxx</div>
  </div>
)}


      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`mb-4 ${message.sender === "admin_demo" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block p-3 rounded-lg shadow-sm ${
                message.sender === "admin_demo" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"
              }`}
            >
              {message.attachment && (
                <div className="mb-2">
                  <Image
                    src={message.attachment.url}
                    alt={message.attachment.filename || "Attachment image"}
                    width={200}
                    height={200}
                  />
                </div>
              )}
              <div>
                {message.content.startsWith("data:image/") ? (
                  <Image src={message.content} alt="Base64 Image" className="rounded-lg" width={200} height={200} />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              <div className="text-[10px] opacity-75 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
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
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
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
            type="button"
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
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12z"
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
            <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500">
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
