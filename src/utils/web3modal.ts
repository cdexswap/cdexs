import { defaultWagmiConfig, createWeb3Modal } from '@web3modal/wagmi/react'
import { mainnet, bsc, arbitrum, sepolia } from 'wagmi/chains'
import { http } from 'viem'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required');
}

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required')
}

const metadata = {
  name: 'P2P Trading',
  description: 'P2P Trading Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://p2p-trading.com',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://p2p-trading.com/favicon.ico']
}

// Configure chains with transports
const chains = [mainnet, bsc, arbitrum, sepolia] as const
const transports = {
  [mainnet.id]: http(),
  [bsc.id]: http(),
  [arbitrum.id]: http(),
  [sepolia.id]: http()
}

// Create wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  transports
})

// Initialize web3modal with Safari compatibility
if (typeof window !== 'undefined') {
  // Create Web3Modal with basic configuration
  createWeb3Modal({
    wagmiConfig,
    projectId,
    themeMode: 'light',
    defaultChain: bsc // Set BSC as default chain for better trading experience
  })
  
  // Add Safari detection to window for use in WalletConnect component
  // @ts-ignore
  window.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
