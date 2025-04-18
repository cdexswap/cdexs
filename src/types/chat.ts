export interface OrderDetails {
  order_id: string;
  countryCodes: string;
  chain: string;
  price?: number;
  rates: Record<string, number>;
  currency: string;
  payment_method: string;
}

export interface TransactionDetails {
  amount: number;
  buyer_id: string;
  seller_id: string;
}

export interface PaymentMethod {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

export interface SellerSettings {
  paymentMethods: {
    [key: string]: PaymentMethod;
  };
}

export interface Message {
  _id: string;
  orderId: string;
  sender: string;
  receiver: string;
  content: string;
  attachment?: {
    url: string;
    mimeType: string;
    filename: string;
    size: number;
  };
  timestamp: string;
  status: "sent" | "delivered" | "read";
}
