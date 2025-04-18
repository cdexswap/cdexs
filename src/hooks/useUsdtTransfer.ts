import { useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, type Address, createPublicClient, http } from 'viem';
import { chainTokens } from '@/lib/config/chains';
import { erc20Abi } from 'viem';
import { bsc } from 'wagmi/chains';

const PUBLIC_KEY = (process.env.NEXT_PUBLIC_PUBLIC_KEY || "0xEa0Be39EDeb75463F96A544214590414Ea427A96") as Address;

export const useUsdtTransfer = (chainId: number) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const usdtToken = chainTokens[chainId]?.USDT;

  const transfer = useCallback(async (amount: string): Promise<{hash: string, success: boolean}> => {
    const waitForClients = async (retries = 5, delay = 2000): Promise<boolean> => {
      console.log(`Waiting for clients (retries: ${retries}, delay: ${delay}ms)...`);
      for (let i = 0; i < retries; i++) {
        console.log(`Attempt ${i + 1}/${retries} to get clients...`);
        if (walletClient && publicClient) {
          console.log('Clients found!');
          return true;
        }
        console.log(`Clients not available, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      console.log('Failed to get clients after all retries');
      return false;
    };

    try {
      console.log('Starting transfer process...');
      console.log('Current chain:', currentChainId);
      console.log('Target chain:', chainId);
      
      // Check wallet connection
      // if (!isConnected || !address) {
      //   console.error('Wallet connection check failed:', { isConnected, address });
      //   throw new Error('WALLET_NOT_CONNECTED');
      // }

      // Check if we're on the correct network
      if (currentChainId !== chainId) {
        console.log('Wrong network, switching...');
        try {
          await switchChainAsync({ chainId });
          // Give some time for the network switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Network switched successfully to chainId:', chainId);
        } catch (error) {
          console.error('Network switching failed:', error);
          // Provide more detailed error message
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`NETWORK_SWITCHING_FAILED: ${errorMessage}`);
        }
      }

      // Verify USDT configuration
      if (!usdtToken) {
        console.error('USDT not configured for chain:', chainId);
        throw new Error('USDT_NOT_CONFIGURED');
      }

      // Check client availability and wait if needed
      console.log('Checking client availability...');
      const clientsAvailable = await waitForClients();
      if (!clientsAvailable || !walletClient || !publicClient) {
        console.error('Clients not available after waiting:', { 
          walletClient: !!walletClient, 
          publicClient: !!publicClient 
        });
        throw new Error('PUBLIC_CLIENT_NOT_AVAILABLE');
      }
      console.log('Clients available, proceeding...');

      // From this point on, we know walletClient and publicClient are available
      const safeWalletClient = walletClient;
      const safePublicClient = publicClient;
      const tokenAddress = usdtToken.address as Address;
      console.log('USDT address:', tokenAddress);

      // Get token decimals and calculate amount in wei
      console.log('Getting token decimals...');
      let decimals: number | undefined;
      
      // Try with multiple fallback RPC URLs for BSC
      const bscFallbackRpcs = [
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed2.binance.org',
        'https://bsc-dataseed3.binance.org',
        'https://bsc-dataseed4.binance.org',
        'https://bsc-dataseed.binance.org',
        'https://binance.nodereal.io',
        'https://bsc-mainnet.public.blastapi.io',
        'https://bsc.publicnode.com',
        'https://bsc-rpc.gateway.pokt.network',
        'https://1rpc.io/bnb'
      ];
      
      let lastError: unknown;
      let success = false;
      
      try {
        // First try with the configured client
        decimals = await safePublicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        });
        console.log('Token decimals:', decimals);
        success = true;
      } catch (error) {
        console.error('Error getting token decimals with primary RPC:', error);
        lastError = error;
        
        // If we're on BSC and the first attempt failed, try fallback RPCs
        if (chainId === 56) {
          console.log('Trying fallback BSC RPC URLs...');
          
          for (const rpcUrl of bscFallbackRpcs) {
            try {
              console.log(`Trying fallback RPC: ${rpcUrl}`);
              
              // Create a temporary client with the fallback RPC
              const fallbackClient = createPublicClient({
                chain: bsc,
                transport: http(rpcUrl)
              });
              
              decimals = await fallbackClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'decimals',
              });
              
              console.log('Token decimals (from fallback):', decimals);
              success = true;
              break;
            } catch (fallbackError) {
              console.error(`Error with fallback RPC ${rpcUrl}:`, fallbackError);
              lastError = fallbackError;
            }
          }
        }
      }
      
      if (!success || decimals === undefined) {
        const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
        throw new Error(`RPC_CONNECTION_ERROR: Failed to get token decimals - ${errorMessage}`);
      }

      // Default to 6 decimals for USDT if for some reason we couldn't get it
      const tokenDecimals = typeof decimals === 'number' ? decimals : 6;
      const amountInWei = parseUnits(amount, tokenDecimals);
      console.log('Amount in wei:', amountInWei);

      // Check balance
      console.log('Checking balance...');
      let balance: bigint = BigInt(0);
      success = false;
      
      try {
        // First try with the configured client
        balance = await safePublicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as Address],
        });
        console.log('Current balance:', balance);
        success = true;
      } catch (error) {
        console.error('Error checking balance with primary RPC:', error);
        lastError = error;
        
        // If we're on BSC and the first attempt failed, try fallback RPCs
        if (chainId === 56) {
          console.log('Trying fallback BSC RPC URLs for balance check...');
          
          for (const rpcUrl of bscFallbackRpcs) {
            try {
              console.log(`Trying fallback RPC for balance: ${rpcUrl}`);
              
              // Create a temporary client with the fallback RPC
              const fallbackClient = createPublicClient({
                chain: bsc,
                transport: http(rpcUrl)
              });
              
              balance = await fallbackClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address as Address],
              });
              
              console.log('Current balance (from fallback):', balance);
              success = true;
              break;
            } catch (fallbackError) {
              console.error(`Error with fallback RPC ${rpcUrl} for balance:`, fallbackError);
              lastError = fallbackError;
            }
          }
        }
      }
      
      if (!success || balance === undefined) {
        const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
        throw new Error(`RPC_CONNECTION_ERROR: Failed to check balance - ${errorMessage}`);
      }
      
      if (balance < amountInWei) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Check allowance
      console.log('Checking allowance...');
      let allowance: bigint = BigInt(0);
      success = false;
      
      try {
        // First try with the configured client
        allowance = await safePublicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address as Address, PUBLIC_KEY],
        });
        console.log('Current allowance:', allowance);
        success = true;
      } catch (error) {
        console.error('Error checking allowance with primary RPC:', error);
        lastError = error;
        
        // If we're on BSC and the first attempt failed, try fallback RPCs
        if (chainId === 56) {
          console.log('Trying fallback BSC RPC URLs for allowance check...');
          
          for (const rpcUrl of bscFallbackRpcs) {
            try {
              console.log(`Trying fallback RPC for allowance: ${rpcUrl}`);
              
              // Create a temporary client with the fallback RPC
              const fallbackClient = createPublicClient({
                chain: bsc,
                transport: http(rpcUrl)
              });
              
              allowance = await fallbackClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'allowance',
                args: [address as Address, PUBLIC_KEY],
              });
              
              console.log('Current allowance (from fallback):', allowance);
              success = true;
              break;
            } catch (fallbackError) {
              console.error(`Error with fallback RPC ${rpcUrl} for allowance:`, fallbackError);
              lastError = fallbackError;
            }
          }
        }
      }
      
      if (!success || allowance === undefined) {
        const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
        throw new Error(`RPC_CONNECTION_ERROR: Failed to check allowance - ${errorMessage}`);
      }

      // If allowance is insufficient, request approval
      if (allowance < amountInWei) {
        console.log('Requesting approval...');
        let approvalHash: `0x${string}`;
        try {
          approvalHash = await safeWalletClient.writeContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [PUBLIC_KEY, amountInWei],
          });

          // Wait for approval transaction
          console.log('Waiting for approval confirmation...');
          await safePublicClient.waitForTransactionReceipt({ hash: approvalHash });
          console.log('Approval confirmed');
        } catch (error) {
          console.error('Error during approval process:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Check if user rejected the transaction
          if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
            throw new Error('USER_REJECTED');
          }
          
          throw new Error(`APPROVAL_FAILED: ${errorMessage}`);
        }
      }

      // Send USDT transfer transaction
      console.log('Initiating transfer...');
      let transferHash: `0x${string}`;
      try {
        transferHash = await safeWalletClient.writeContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [PUBLIC_KEY, amountInWei],
        });

        // Return success immediately after transaction is submitted to the network
        // Don't wait for it to be mined or confirmed
        console.log('Transfer submitted with hash:', transferHash);
        
        // Start a background process to monitor the transaction status
        // This doesn't block the UI or order creation
        setTimeout(() => {
          // Try to check if the transaction was mined
          safePublicClient.waitForTransactionReceipt({ 
            hash: transferHash,
            confirmations: 1,
            timeout: 60000 // 60 second timeout
          }).then(receipt => {
            console.log('Transfer mined:', receipt.transactionHash);
            
            // Then try to wait for full confirmation in the background
            safePublicClient.waitForTransactionReceipt({ 
              hash: transferHash,
              confirmations: 3 // Wait for 3 confirmations in the background
            }).then(fullReceipt => {
              console.log('Transfer fully confirmed:', fullReceipt.transactionHash);
            }).catch(error => {
              console.error('Error confirming transfer (but transaction was mined):', error);
            });
          }).catch(error => {
            console.error('Error checking if transaction was mined:', error);
            // Even if we can't check if it was mined, the transaction was submitted
            // and the order was created, so this is just for logging
          });
        }, 100); // Start checking almost immediately, but in the background
        
        return {
          hash: transferHash,
          success: true
        };
      } catch (error) {
        console.error('Error during transfer process:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check if user rejected the transaction
        if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
          throw new Error('USER_REJECTED');
        }
        
        throw new Error(`TRANSFER_EXECUTION_FAILED: ${errorMessage}`);
      }

      // This return statement is not needed as we already return inside the try block
    } catch (error: unknown) {
      console.error('Original error:', error);
      
      if (error instanceof Error) {
        // Known errors
        if (['WALLET_NOT_CONNECTED', 'USDT_NOT_CONFIGURED', 'NETWORK_SWITCHING_NOT_SUPPORTED', 
             'TOKEN_INTERACTION_FAILED', 'APPROVAL_OR_TRANSFER_FAILED', 'CONFIRMATION_FAILED',
             'INSUFFICIENT_BALANCE'].includes(error.message)) {
          throw error;
        }
        
        // For other Error instances, include the original message
        const errorMessage = error.message || 'Unknown error';
        throw new Error(`TRANSFER_ERROR: ${errorMessage}`);
      }
      
      // For non-Error objects, try to get more information
      const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
      throw new Error(`TRANSFER_ERROR: ${errorString}`);
    }
  }, [address, usdtToken, walletClient, publicClient, currentChainId, switchChainAsync, chainId]);

  return { transfer };
};
