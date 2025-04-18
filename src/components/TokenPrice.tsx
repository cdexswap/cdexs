'use client';

import { useEffect, useState } from 'react';
import { currencySymbols } from '@/utils/currency';

interface TokenPriceProps {
  token: string;
  chain: string;
  amount: string;
  countryCode?: string;
}

const getCurrency = (countryCode?: string) => {
  if (!countryCode) return 'THB';
  switch(countryCode) {
    case 'TH': return 'THB';
    case 'MY': return 'MYR';
    case 'SG': return 'SGD';
    case 'LA': return 'LAK';
    case 'CN': return 'CNY';
    default: return 'THB';
  }
};

const getCurrencySymbol = (currencyCode: string) => {
  return currencySymbols[currencyCode] || '';
};

export default function TokenPrice({ token, chain, amount, countryCode }: TokenPriceProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const currencyCode = getCurrency(countryCode);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        
        // Fetch crypto price if not USDT
        if (token !== 'USDT') {
          const cryptoResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getTokenId(token, chain)}&vs_currencies=usd`);
          const cryptoData = await cryptoResponse.json();
          const tokenId = getTokenId(token, chain);
          if (cryptoData[tokenId]) {
            setPrice(cryptoData[tokenId].usd);
          }
        } else {
          setPrice(1.00); // USDT is pegged to USD
        }

        // Fetch exchange rates for multiple currencies
        const exchangeResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        const exchangeData = await exchangeResponse.json();
        if (exchangeData.rates) {
          setExchangeRates(exchangeData.rates);
        }
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [token, chain]);

  const getTokenId = (token: string, chain: string): string => {
    // Map token symbols to CoinGecko IDs based on chain and token
    if (token === 'ETH') {
      // Use different IDs for ETH based on chain
      switch (chain) {
        case 'Arbitrum':
        case 'Base':
          return 'ethereum'; // Still use ethereum price for L2s
        default:
          return 'ethereum';
      }
    }
    
    const tokenMap: Record<string, string> = {
      'BNB': 'binancecoin',
      'MATIC': 'matic-network',
      'SOL': 'solana',
      'USDT': 'tether',
      'BUSD': 'binance-usd'
    };
    return tokenMap[token] || '';
  };

  if (loading) {
    return <div className="text-gray-400 text-sm mt-1">Loading price...</div>;
  }

  if (!price && token !== 'USDT') {
    return null;
  }

  const currentPrice = token === 'USDT' ? 1.00 : price || 0;
  const totalValue = currentPrice * Number(amount || 0);

  return (
    <div className="text-gray-400 text-sm mt-1">
      {token === 'USDT' ? (
        <div className="space-y-1">
          <div>1 USDT = $1.00 USD</div>
          {exchangeRates[currencyCode] && (
            <div>Rate: {getCurrencySymbol(currencyCode)}{exchangeRates[currencyCode].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode} per USDT</div>
          )}
          {amount && (
            <div>
              Total: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          )}
        </div>
      ) : (
        <>
          1 {token} = ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          {amount && (
            <span className="ml-2">
              (Total: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
            </span>
          )}
        </>
      )}
    </div>
  );
}
