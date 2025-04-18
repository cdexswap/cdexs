"use client";

import { useEffect, Suspense } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import WalletConnect from '@/components/WalletConnect';
import { useWallet } from '@solana/wallet-adapter-react';

function SignupContent() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const { publicKey: solanaAddress, disconnect: disconnectSolana } = useWallet();

  // Disconnect wallet on mount
  useEffect(() => {
    if (isConnected) {
      disconnect();
    }
    if (solanaAddress) {
      disconnectSolana();
    }
  }, []);

  // Handle wallet connection and user creation
  useEffect(() => {
    const createAccount = async () => {
      if (isConnected && address) {
        try {
          const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: `${address.slice(0, 6)}...${address.slice(-4)}`,
              wallet_address: address,
              wallet_type: 'evm',
              referral_code: ref
            })
          });

          if (response.ok) {
            router.push('/referral');
          }
        } catch (error) {
          console.error('Error creating account:', error);
        }
      }
    };

    createAccount();
  }, [address, isConnected, ref, router]);

  return (
    <main className="text-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full py-16 text-center">
        {/* Welcome Banner */}
        <div className="bg-blue-800 text-white p-8 rounded-lg mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to CDEXS
            </h1>
            <p className="text-xl mb-8 opacity-90">
              You&apos;ve been invited to join the future of digital token trading
            </p>

            {ref && (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 inline-block">
                <p className="text-lg mb-2">Your Referral ID</p>
                <p className="text-3xl font-bold text-blue-300">{ref}</p>
              </div>
            )}
          </div>

          <div className="absolute top-0 right-0 opacity-10">
            <Image src="/money-bag.svg" alt="Decoration" width={200} height={200} />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6">
            <div className="bg-blue-600/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image src="/referral-step1-blue.svg" alt="Security" width={32} height={32} priority />
            </div>
            <h3 className="font-bold mb-2">Secure Trading</h3>
            <p className="text-gray-400 text-sm">Advanced security measures to protect your digital assets</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6">
            <div className="bg-blue-600/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image src="/referral-step2-blue.svg" alt="Trading" width={32} height={32} priority />
            </div>
            <h3 className="font-bold mb-2">Easy Trading</h3>
            <p className="text-gray-400 text-sm">Simple and intuitive platform for seamless transactions</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6">
            <div className="bg-blue-600/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image src="/referral-step3-blue.svg" alt="Rewards" width={32} height={32} priority />
            </div>
            <h3 className="font-bold mb-2">Earn Rewards</h3>
            <p className="text-gray-400 text-sm">Get 20% cashback on trading fees through referrals</p>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="space-y-4">
          <p className="text-lg mb-4">Connect your wallet to get started</p>
          <WalletConnect />
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
