'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import PollingService, { Message, PaymentNotification } from '@/lib/services/PollingService';

export interface PollingContextType {
  sendMessage: (messageData: Omit<Message, 'timestamp'>) => Promise<void>;
  updatePaymentStatus: (data: {
    transactionId: string;
    status: string;
    role: string;
    sellerId?: string;
  }) => Promise<void>;
}

const PollingContext = createContext<PollingContextType>({
  sendMessage: async () => {},
  updatePaymentStatus: async () => {}
});

export const usePolling = () => useContext(PollingContext);

export default function PollingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [pollingService] = useState(() => PollingService.getInstance());

  useEffect(() => {
    // Request notification permission
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          await Notification.requestPermission();
        }
      }
    };
    requestNotificationPermission();

    // Set up event handlers for messages and notifications
    pollingService.on('new-message', (messages: Message[]) => {
      messages.forEach(message => {
        // Trigger notification for new messages
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('New Message', {
            body: `New message from ${message.sender}`,
            icon: '/logo.png',
            tag: `chat-${message.orderId}`, // Prevent duplicate notifications
            requireInteraction: true // Keep notification until user interacts
          });

          // Handle notification click
          notification.onclick = () => {
            window.focus(); // Focus the window
            window.location.href = `/mytrade?order=${message.orderId}&chat=true`;
          };
        }
      });
    });

    pollingService.on('payment-notification', (notifications: PaymentNotification[]) => {
      notifications.forEach(notification => {
        // Trigger notification for payment updates
        if ('Notification' in window && Notification.permission === 'granted') {
          const notif = new Notification('Payment Update', {
            body: notification.message,
            icon: '/logo.png',
            tag: `payment-${notification.orderId}`,
            requireInteraction: true
          });

          // Handle notification click
          notif.onclick = () => {
            window.focus();
            window.location.href = `/mytrade?order=${notification.orderId}`;
          };
        }
      });
    });

    // Start polling
    pollingService.startPolling();

    // Cleanup
    return () => {
      pollingService.stopPolling();
    };
  }, [pollingService]);

  const contextValue = {
    sendMessage: (messageData: Omit<Message, 'timestamp'>) => 
      pollingService.sendMessage(messageData),
    updatePaymentStatus: (data: {
      transactionId: string;
      status: string;
      role: string;
      sellerId?: string;
    }) => pollingService.updatePaymentStatus(data)
  };

  return (
    <PollingContext.Provider value={contextValue}>
      {children}
    </PollingContext.Provider>
  );
}
