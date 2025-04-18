import type { Order } from "@/types/order";
import { getCurrency } from "./currency";

export const getCountryCodes = (order: Order): string[] => {
  if (order.countryCodes) {
    return order.countryCodes.split(',');
  }
  if (order.countryCode) {
    return [order.countryCode];
  }
  return [];
};

export const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getRate = (order: Order, countryCode: string): number => {
  // Use rate from rates map if available
  if (order.rates?.[countryCode]) {
    return order.rates[countryCode];
  }
  // Use price field if available (for backward compatibility)
  if (order.price) {
    return order.price;
  }
  // Fallback to first available rate
  if (order.rates) {
    const firstCountry = Object.keys(order.rates)[0];
    return order.rates[firstCountry] || 0;
  }
  // Fallback to exchange rates if no rates available
  const currency = getCurrency(countryCode);
  if (currency) {
    return 0; // Exchange rate should be fetched from an API in production
  }
  return 0;
};

export const calculateCryptoFee = (cryptoAmount: number) => {
  return cryptoAmount * 0.03; // 3% fee
};

export const calculateFiatFee = (fiatAmount: number) => {
  return fiatAmount * 0.0144; // 1.44% fee for fiat transactions
};

export const calculateNetCryptoAmount = (grossAmount: number) => {
  return grossAmount - calculateCryptoFee(grossAmount);
};

export const calculateTotal = (price: number) => {
  return price + calculateFiatFee(price);
};

export const getMaxAmount = (order: Order) => {
  // Use remainingBalance if available, otherwise use the full amount
  const availableAmount = typeof order.remainingBalance !== 'undefined' 
    ? order.remainingBalance 
    : order.amount;
  
  return availableAmount * 0.9725;
};

export const validateAmount = (amount: string, minAmount: number, maxAmount: number) => {
  const numAmount = Number(amount);
  return !Number.isNaN(numAmount) && 
         numAmount >= minAmount && 
         numAmount <= maxAmount &&
         amount.trim() !== '' &&
         (minAmount > 0 ? !/^0+$/.test(amount.replace(/\.0+$/, '')) : true);
};
