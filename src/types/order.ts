export interface SubOrder {
  id: string;
  amount: number;
  status: 'active' | 'matching' | 'completed' | 'canceled';
  buyer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  type: 'buy' | 'sell';
  amount: number;
  rates: Record<string, number>;
  price?: number;
  remainingBalance?: number;
  total_price: number;
  currency: string;
  chain: string;
  wallet_address: string;
  payment_method: string;
  countryCode?: string;
  countryCodes?: string;
  bankCountry?: string;
  transaction_fee: number;
  expiration_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  minBuyAmount?: number;
  maxBuyAmount?: number;
  transaction_id?: string;
  numBuyers?: number;
  remainingBuyers?: number;
  subOrders?: SubOrder[];
}

export interface UserSettings {
  wallet: string;
  name: string;
}

export interface NotificationData {
  userId: string;
  message: string;
}

export interface BuyOrderResponse {
  order: Order;
  notifications: NotificationData[];
}
