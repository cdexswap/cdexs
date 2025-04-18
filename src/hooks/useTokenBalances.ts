'use client';

import { useAccount, useBalance } from 'wagmi';
import { chainTokens } from '@/lib/config/chains';
import { useState, useEffect } from 'react';

export function useTokenBalances(chainId: number) {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<{[key: string]: string}>({});

  // Get token balances for the chain
  const tokens = chainTokens[chainId] || {};

  // USDT Balance
  const { data: usdtBalance } = useBalance({
    address,
    token: tokens.USDT?.address as `0x${string}`,
    chainId
  });

  // BUSD Balance
  const { data: busdBalance } = useBalance({
    address,
    token: tokens.BUSD?.address as `0x${string}`,
    chainId  });

  useEffect(() => {
    const newBalances: {[key: string]: string} = {};
    
    if (usdtBalance) {
      newBalances.USDT = usdtBalance.formatted;
    }
    
    if (busdBalance) {
      newBalances.BUSD = busdBalance.formatted;
    }

    setBalances(newBalances);
  }, [usdtBalance, busdBalance]);

  return {
    balances,
    isConnected
  };
}
