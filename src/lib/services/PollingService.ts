export interface Message {
  orderId: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
}

export interface PaymentNotification {
  orderId: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface PollingData {
  messages: Message[];
  notifications: PaymentNotification[];
  lastPolled: string;
}

class PollingService {
  private static instance: PollingService;
  private pollingInterval = 3000; // 3 seconds
  private timer: NodeJS.Timeout | null = null;
  private callbacks: Map<string, (data: Message[] | PaymentNotification[]) => void> = new Map();
  private lastPolledTimestamp: string = new Date().toISOString();

  private constructor() {}

  public static getInstance(): PollingService {
    if (!PollingService.instance) {
      PollingService.instance = new PollingService();
    }
    return PollingService.instance;
  }

  private async fetchUpdates(): Promise<PollingData> {
    try {
      const response = await fetch('/api/polling/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastPolled: this.lastPolledTimestamp
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch updates');
      }

      const data = await response.json();
      this.lastPolledTimestamp = new Date().toISOString();
      return data;
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }

  public startPolling() {
    if (this.timer) return;

    const poll = async () => {
      try {
        const updates = await this.fetchUpdates();
        
        // Handle new messages
        if (updates.messages.length > 0) {
          this.callbacks.get('new-message')?.(updates.messages);
        }

        // Handle payment notifications
        if (updates.notifications.length > 0) {
          this.callbacks.get('payment-notification')?.(updates.notifications);
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }
    };

    // Initial poll
    poll();
    
    // Start polling interval
    this.timer = setInterval(poll, this.pollingInterval);
  }

  public stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public on(event: string, callback: (data: Message[] | PaymentNotification[]) => void) {
    this.callbacks.set(event, callback);
  }

  public async sendMessage(messageData: Omit<Message, 'timestamp'>) {
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...messageData,
          timestamp: new Date().toISOString()
        })
      });
      console.log('response', response);
      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  public async updatePaymentStatus(data: {
    transactionId: string;
    status: string;
    role: string;
    sellerId?: string;
  }) {
    try {
      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      console.log('updatePaymentStatus response', response);
      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

export default PollingService;
