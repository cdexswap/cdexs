import { useCallback } from 'react';
import { chainTokens } from '@/lib/config/chains';

export const usePrivateKeyTransfer = (chainId: number) => {
  const transfer = useCallback(async (
    toAddress: string,
    amount: string,
    originalAmount: string
  ): Promise<{hash: string, success: boolean}> => {
    try {
      // Get USDT token config for validation
      const usdtToken = chainTokens[chainId]?.USDT;
      if (!usdtToken) {
        throw new Error('USDT_NOT_CONFIGURED');
      }

      // Call the server-side API endpoint
      const response = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress,
          amount,
          originalAmount,
          chainId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      return {
        hash: data.hash,
        success: data.success
      };
    } catch (error) {
      console.error('Private key transfer error:', error);
      throw error;
    }
  }, [chainId]);

  return { transfer };
};
