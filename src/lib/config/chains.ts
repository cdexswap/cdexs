import { mainnet, bsc, arbitrum, base, polygon, sepolia } from 'wagmi/chains'

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
}

export interface ChainTokens {
  USDT?: Token;
  BUSD?: Token;
}

// Define supported EVM chains
export const evmChains = [
  mainnet,
  bsc,
  arbitrum,
  base,
  polygon,
  sepolia,
]

// Token addresses for each chain
export const chainTokens: Record<number, ChainTokens> = {
  [mainnet.id]: {
    USDT: {
      symbol: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6
    }
  },
  [bsc.id]: {
    USDT: {
      symbol: 'USDT',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18
    },
    BUSD: {
      symbol: 'BUSD',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      decimals: 18
    }
  },
  [arbitrum.id]: {
    USDT: {
      symbol: 'USDT',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6
    }
  },
  [polygon.id]: {
    USDT: {
      symbol: 'USDT',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6
    }
  },
  [sepolia.id]: {
    USDT: {
      symbol: 'USDT',
      address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      decimals: 6
    }
  }
}

// Define Solana network (mainnet)
export const solanaNetwork = 'mainnet-beta'

// Chain metadata for UI
export interface ChainMetadata {
  name: string;
  icon: string;
  symbol: string;
  tokens?: ChainTokens;
}

export const chainMetadata: Record<string | number, ChainMetadata> = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '/chains/eth.svg',
    symbol: 'ETH',
    tokens: chainTokens[mainnet.id]
  },
  [bsc.id]: {
    name: 'Binance Chain',
    icon: '/chains/bsc.svg',
    symbol: 'BNB',
    tokens: chainTokens[bsc.id]
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '/chains/arbitrum.svg',
    symbol: 'ETH',
    tokens: chainTokens[arbitrum.id]
  },
  [base.id]: {
    name: 'Base',
    icon: '/chains/base.svg',
    symbol: 'ETH'
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '/chains/polygon.svg',
    symbol: 'MATIC',
    tokens: chainTokens[polygon.id]
  },
  'solana': {
    name: 'Solana',
    icon: '/chains/solana.svg',
    symbol: 'SOL'
  },
  [sepolia.id]: {
    name: 'Sepolia',
    icon: '/chains/eth.svg',
    symbol: 'ETH',
    tokens: chainTokens[sepolia.id]
  }
}
