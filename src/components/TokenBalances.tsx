'use client';

import { useState } from 'react';
import { useTokenBalances } from '../hooks/useTokenBalances';
import { evmChains } from '../lib/config/chains';
import Image from 'next/image';

export default function TokenBalances() {
  const [selectedChain] = useState(evmChains[0].id);
  const { balances, isConnected } = useTokenBalances(selectedChain);

  if (!isConnected) return null;

  return (
    <div className="flex items-center space-x-6 bg-white px-6 py-3 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 relative">
          <Image src="/usdt.svg" alt="USDT" fill className="object-contain" />
        </div>
        <span className="text-sm font-medium text-gray-900">{balances.USDT || '0.00'} USDT</span>
      </div>
      <div className="flex items-center space-x-2">
      <div className="w-8 h-8 relative">
      <Image src="/busd.svg" alt="BUSD" fill className="object-contain" />
        </div>
        <span className="text-sm font-medium text-gray-900">{balances.BUSD || '0.00'} BUSD</span>
      </div>
    </div>
  );
}
