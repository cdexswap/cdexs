import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseUnits, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { erc20Abi } from 'viem';
import { sepolia, mainnet, bsc, arbitrum } from 'viem/chains';
import { chainTokens } from '@/lib/config/chains';

// Configure chains with RPC URLs
const chainConfigs = {
  // Sepolia testnet
  11155111: {
    ...sepolia,
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '']
      },
      public: {
        http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '']
      }
    }
  },
  // Ethereum mainnet
  1: {
    ...mainnet,
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://ethereum.publicnode.com']
      },
      public: {
        http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://ethereum.publicnode.com']
      }
    }
  },
  // BSC mainnet
  56: {
    ...bsc,
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-mainnet.public.blastapi.io']
      },
      public: {
        http: [process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-mainnet.public.blastapi.io']
      }
    }
  },
  // Arbitrum mainnet
  42161: {
    ...arbitrum,
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum-one.publicnode.com']
      },
      public: {
        http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum-one.publicnode.com']
      }
    }
  }
};

function formatPrivateKey(key: string | undefined): `0x${string}` {
  if (!key) {
    throw new Error('Private key is not configured');
  }
  
  const cleanKey = key.replace(/['"]/g, '');
  const formattedKey = cleanKey.startsWith('0x') ? cleanKey : `0x${cleanKey}`;
  
  if (formattedKey.length !== 66) {
    throw new Error('Invalid private key length');
  }
  
  return formattedKey as `0x${string}`;
}

// Get the appropriate chain configuration based on chainId
// Default to Sepolia if the chain is not supported
const getChainConfig = (id: number) => {
  return chainConfigs[id as keyof typeof chainConfigs] || chainConfigs[11155111];
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { toAddress, amount, originalAmount, chainId } = body;
    
    // Validate request parameters
    if (!toAddress || !amount || !originalAmount || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Check if RPC URL is configured
    if (!process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
      return NextResponse.json(
        { error: 'RPC_URL_NOT_CONFIGURED' },
        { status: 500 }
      );
    }
    
    // Format and validate private key
    try {
      const privateKey = formatPrivateKey(process.env.NEXT_PUBLIC_PRIVATE_KEY);
      const account = privateKeyToAccount(privateKey);
      
      // Get the appropriate chain configuration
      const chainConfig = getChainConfig(chainId);
      
      // Create wallet client with private key
      const walletClient = createWalletClient({
        account,
        chain: chainConfig,
        transport: http()
      });

      const publicClient = createPublicClient({
        chain: chainConfig,
        transport: http()
      });

      // Get USDT token config
      const usdtToken = chainTokens[chainId]?.USDT;
      if (!usdtToken) {
        return NextResponse.json(
          { error: 'USDT_NOT_CONFIGURED' },
          { status: 400 }
        );
      }

      const tokenAddress = usdtToken.address as Address;
      const decimals = usdtToken.decimals;

      // Check platform wallet USDT balance
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address as Address],
      }) as bigint;

      // Calculate final amount with 3% fee
      const amountNumber = parseFloat(originalAmount);
      const feeAmount = amountNumber * 0.03;
      const finalAmount = (amountNumber - feeAmount).toString();
      
      // Convert amount to wei
      const amountInWei = parseUnits(finalAmount, decimals);

      // Check if platform has enough balance
      if (balance < amountInWei) {
        return NextResponse.json(
          { error: 'INSUFFICIENT_PLATFORM_BALANCE' },
          { status: 400 }
        );
      }

      // Send USDT transfer transaction
      const transferHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as Address, amountInWei],
      });

      return NextResponse.json({
        hash: transferHash,
        success: true
      });
      
    } catch (error: any) {
      console.error('Private key transfer error:', error);
      
      if (error?.message?.includes('timeout') || error?.message?.includes('failed to meet quorum')) {
        return NextResponse.json(
          { error: 'RPC_TIMEOUT' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
