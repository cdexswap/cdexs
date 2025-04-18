"use client"

import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import {
  WalletProvider as SolanaWalletProvider,
  ConnectionProvider
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import Navigation from '@/components/Navigation'
import '@solana/wallet-adapter-react-ui/styles.css'

// Configure React Query
const queryClient = new QueryClient()

// Solana endpoint
const solanaEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!

if (!solanaEndpoint?.startsWith('http://') && !solanaEndpoint?.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_SOLANA_RPC_URL must start with http:// or https://')
}

// Dynamically import Web3ModalProvider with ssr disabled
const Web3ModalProvider = dynamic(
  () => import('./Web3ModalProvider'),
  { ssr: false }
)

// Configure Solana wallet
const walletAdapter = new PhantomWalletAdapter()

interface WalletProviderProps {
  children: React.ReactNode;
  suppressNavbar?: boolean;
}

// Inner component that uses wagmi hooks
function WalletProviderInner({ children, suppressNavbar }: WalletProviderProps) {
  return (
    <>
      {!suppressNavbar && <Navigation />}
      {children}
    </>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-4">
      <p className="text-red-500">Something went wrong with wallet connection:</p>
      <pre className="mt-2 text-sm">{error.message}</pre>
    </div>
  )
}

// Main provider component that sets up the provider tree
export default function WalletProvider({ children, suppressNavbar }: WalletProviderProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Web3ModalProvider>
          <ConnectionProvider endpoint={solanaEndpoint}>
            <SolanaWalletProvider wallets={[walletAdapter]} autoConnect>
              <WalletModalProvider>
                <WalletProviderInner suppressNavbar={suppressNavbar}>
                  {children}
                </WalletProviderInner>
              </WalletModalProvider>
            </SolanaWalletProvider>
          </ConnectionProvider>
        </Web3ModalProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
