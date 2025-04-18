import { UserSettings } from "@/types/order";
import { PollingContextType } from "@/components/providers/SocketProvider";

export interface Order {
  order_id: string;
  user_id: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  total_price: number;
  currency: string;
  chain: string;
  wallet_address: string;
  payment_method: string;
  transaction_fee: number;
  expiration_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  transaction_id?: string;
  counterparty_id?: string;
}

export interface Transaction {
  transaction_id: string;
  buy_order_id: string;
  sell_order_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  price: number;
  total_price: number;
  currency: string;
  chain: string;
  created_at: string;
  buyer_payment_confirmed: boolean;
  seller_payment_confirmed: boolean;
}

export interface CompletedOrder extends Order {
  transaction_id: string;
  counterparty_id: string;
  buyer?: UserSettings;
  seller?: UserSettings;
  buyer_payment_confirmed: boolean;
  seller_payment_confirmed: boolean;
}

export interface PaymentStatus {
  [key: string]: {
    buyer: boolean;
    seller: boolean;
  };
}

export interface MyTradeTableProps {
  orders: CompletedOrder[];
  countdowns: Record<string, number>;
  onOpenChat: (order: CompletedOrder) => void;
  generateUniqueKey: (order: CompletedOrder, prefix: string) => string;
}

export interface CancelConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCancelling: boolean;
}

export interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: CompletedOrder | null;
  paymentStatus: PaymentStatus;
  onPaymentConfirmation: (order: CompletedOrder) => Promise<void>;
  polling: PollingContextType;
  currentUserAddress: string;
  isPlaySound: boolean;
}
