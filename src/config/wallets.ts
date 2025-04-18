import { InjectedConnector } from '@web3-react/injected-connector'

// Configure supported chain IDs
export const supportedChainIds = [1, 56, 42161, 11155111] // Ethereum, BSC, Arbitrum, Sepolia

// Initialize injected connector
export const injected = new InjectedConnector({
  supportedChainIds
})

// Define available wallets
export const wallets = [
  {
    name: 'MetaMask',
    connector: injected
  }
]
