'use client';

import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ChatNotification {
  orderId: string;
  sender: string;
  content: string;
  timestamp: string;
}

interface Notification {
  _id: string;
  notification_id: string;
  user_id: string;
  type: string;
  message: string;
  order_id: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsModal(): ReactElement {
  const router = useRouter();
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showChatButton, setShowChatButton] = useState<boolean>(false);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const prevUnreadCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Handle notifications from polling service
  useEffect(() => {
    const handleChatNotification = (data: ChatNotification) => {
      // Only attempt to play sound if user has interacted
      if (hasInteracted && audioRef.current) {
        try {
          audioRef.current.src = '/phone-ringing-48238.mp3';
          audioRef.current.play();
        } catch (error) {
          console.error('Failed to play notification sound:', error);
        }
      }
      
      // Show chat button with order ID
      setChatOrderId(data.orderId);
      setShowChatButton(true);
      
      // Auto open notifications
      setIsOpen(true);
    };

    const handlePaymentUpdate = (data: { orderId: string, message: string }) => {
      console.log('Payment Update:', data);
      // Play phone ringing sound
      if (hasInteracted && audioRef.current) {
        try {
          audioRef.current.src = '/phone-ringing-48238.mp3';
          audioRef.current.play();
        } catch (error) {
          console.error('Failed to play payment confirmation sound:', error);
        }
      }

      // Auto open notifications
      setIsOpen(true);
      
      // Add notification
      setNotifications(prev => [{
        _id: Date.now().toString(),
        notification_id: Date.now().toString(),
        user_id: address || '',
        type: 'payment_confirmation',
        message: data.message,
        order_id: data.orderId,
        read: false,
        created_at: new Date().toISOString()
      }, ...prev]);
      
      setUnreadCount(prev => prev + 1);
    };

    // Set up polling for notifications
    const pollNotifications = async () => {
      if (!address) return;
      
      try {
        const response = await fetch('/api/polling/updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lastPolled: new Date(Date.now() - 3000).toISOString(), // Last 3 seconds
            user_id: address
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle chat notifications
          if (data.messages.length > 0) {
            data.messages.forEach((msg: ChatNotification) => {
              handleChatNotification({
                orderId: msg.orderId,
                sender: msg.sender,
                content: msg.content,
                timestamp: msg.timestamp
              });
            });
          }
          
          // Handle payment notifications
          if (data.notifications.length > 0) {
            data.notifications.forEach((notif: { type: string; orderId: string; message: string }) => {
              if (notif.type === 'payment') {
                handlePaymentUpdate({
                  orderId: notif.orderId,
                  message: notif.message
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollNotifications, 3000);
    return () => clearInterval(interval);
  }, [hasInteracted, address]);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/notifications?user_id=${address}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [address]);

  useEffect(() => {
    // Auto open notifications when new ones arrive
    if (unreadCount > prevUnreadCountRef.current) {
      setIsOpen(true);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (address) {
      fetchNotifications();
    }
  }, [address, fetchNotifications]);

  const markAsRead = async (): Promise<void> => {
    if (!address || unreadCount === 0) return;
    
    try {
      const unreadNotificationIds = notifications
        .filter((n: Notification) => !n.read)
        .map((n: Notification) => n.notification_id);

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: unreadNotificationIds,
          user_id: address
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark notifications as read');
      }
      
      // Update local state
      setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleOpen = (): void => {
    setHasInteracted(true);
    setIsOpen(true);
    markAsRead();
  };

  const handleViewOrder = (orderId: string): void => {
    setIsOpen(false); // Close modal first
    markAsRead(); // Mark as read before navigating
    router.push(`/mytrade?order=${orderId}`);
  };

  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="/phone-ringing-48238.mp3" type="audio/mpeg" />
        <source src="/phone-ringing-48238.mp3" type="audio/mpeg" />
      </audio>
      {/* Notification Bell Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-[4.5rem] sm:right-[168px] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-[150]"
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
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" 
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-[150] p-4">
          <div ref={notificationRef} className="bg-gray-900 rounded-lg p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-100">Notifications</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto relative">
              {showChatButton && chatOrderId && (
                <div className="sticky top-0 bg-blue-600 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <span className="text-white">New message received!</span>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/mytrade?order=${chatOrderId}&chat=true`);
                    }}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Open Chat
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 sm:p-4 rounded-lg border cursor-pointer hover:bg-opacity-75 transition-all duration-200 ${
                      notification.read
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-blue-900/20 border-blue-800'
                    }`}
                    onClick={() => handleViewOrder(notification.order_id)}
                  >
                    <p className="text-gray-200">{notification.message}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                            router.push(`/mytrade?order=${notification.order_id}&chat=true`);
                          }}
                          className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md transition-colors"
                        >
                          <Image
                            src="/chat.svg"
                            alt="Chat Icon"
                            width={16}
                            height={16}
                            priority
                            unoptimized
                          />
                          <span 
                          className="text-xs">Chat</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewOrder(notification.order_id);
                          }}
                          className="flex items-center text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="text-xs">View Order →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
