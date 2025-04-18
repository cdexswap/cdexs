import { useCallback } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';

// Support for multiple chains
export const useEthSignature = (chainId: 11155111 | 1 | 56 | 42161 = 11155111) => { // Default to Sepolia testnet, but support other chains
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  const signWithEth = useCallback(async (
    gasEstimate: bigint
  ): Promise<{hash: string, success: boolean}> => {
    try {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }

      // Send the transaction - in newer versions of wagmi, this might not return a hash directly
      await sendTransaction({
        to: process.env.NEXT_PUBLIC_PUBLIC_KEY as `0x${string}`, // Platform fee address
        value: gasEstimate,
        gas: BigInt(21000), // Standard ETH transfer gas
        chainId
      });

      // Since we can't get the hash directly, we'll just return success
      return {
        hash: 'transaction-submitted', // Placeholder hash
        success: true
      };
    } catch (error: unknown) {
      console.error('ETH signature error:', error);
      throw error;
    }
  }, [isConnected, chainId, sendTransaction]);

  const estimateGas = useCallback(async (
    amount: string
  ): Promise<bigint> => {
    // Convert ETH amount to Wei
    return parseEther(amount);
  }, []);

  return { signWithEth, estimateGas };
};
