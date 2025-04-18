"use client";

import Link from 'next/link';
import Image from 'next/image';
import WalletConnect from './WalletConnect';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected } = useWallet();
  
  const isWalletConnected = isEvmConnected || isSolanaConnected;

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <nav className="bg-gray-900/30 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-[40]">
      <div className="w-full px-6 sm:px-12 lg:px-16">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-3">
                <Image 
                  src="/logo-text.png" 
                  alt="P2P Crypto" 
                  width={150} 
                  height={100} 
                  priority 
                  unoptimized
                  className="w-30 h-15" 
                />
                {/* <span className="font-bold text-xl hidden sm:inline text-gray-100">P2P Crypto</span> */}
              </Link>
            </div>
            <div className="hidden custom:ml-16 lg:ml-20 custom:flex custom:space-x-6 lg:space-x-8">
              <Link 
                href="/buy" 
                data-tutorial="buy-nav"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  isActivePath('/buy') 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-gray-100 hover:bg-blue-500/10 hover:text-blue-400'
                }`}
              >
                Buy Crypto
              </Link>
              <Link 
                href="/sell" 
                data-tutorial="sell-nav"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  isActivePath('/sell') 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                }`}
              >
                Sell Crypto
              </Link>
              <Link 
                href="/roadmap" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  isActivePath('/roadmap') 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                }`}
              >
                Roadmap
              </Link>
              <Link 
                href="/cdx/partner/myteam" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  isActivePath('/cdx/partner/myteam') 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                }`}
              >
                Share To Earn
              </Link>
              <Link 
                href="/about" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  isActivePath('/about') 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                }`}
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Hamburger button */}
            <button
              onClick={toggleMobileMenu}
              className="custom:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            {/* Desktop wallet connect */}
            <div className="hidden custom:flex items-center space-x-2 pl-2 custom:pl-3">
              <WalletConnect />
              {isWalletConnected && (
                <Link 
                  href="/cdx"
                  className={`inline-flex items-center p-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    isActivePath('/cdx') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`custom:hidden fixed inset-0 z-[45] transition-all duration-300 pointer-events-none ${isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
          <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={toggleMobileMenu}></div>
          <div className={`absolute top-16 left-0 right-0 bg-gray-900 border-b border-gray-800 transform transition-transform duration-300 pointer-events-auto ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="px-2 pt-2 pb-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/buy"
                  className={`flex items-center justify-center px-3 py-2 text-base font-medium rounded-md transition-all duration-300 ${
                    isActivePath('/buy') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-100 hover:bg-blue-500/10 hover:text-blue-400'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Buy Crypto
                </Link>
                <Link 
                  href="/sell"
                  className={`flex items-center justify-center px-3 py-2 text-base font-medium rounded-md transition-all duration-300 ${
                    isActivePath('/sell') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sell Crypto
                </Link>
                <Link 
                  href="/roadmap"
                  className={`flex items-center justify-center px-3 py-2 text-base font-medium rounded-md transition-all duration-300 ${
                    isActivePath('/roadmap') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Roadmap
                </Link>
                <Link 
                  href="/cdx/partner/myteam"
                  className={`flex items-center justify-center px-3 py-2 text-base font-medium rounded-md transition-all duration-300 ${
                    isActivePath('/cdx/partner/myteam') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Share To Earn
                </Link>
                <Link 
                  href="/about"
                  className={`flex items-center justify-center px-3 py-2 text-base font-medium rounded-md transition-all duration-300 ${
                    isActivePath('/about') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </div>
              <div className="col-span-2 mt-4 px-3 flex items-center justify-center space-x-2">
                <WalletConnect />
                {isWalletConnected && (
                  <Link 
                    href="/cdx"
                    className={`inline-flex items-center p-2 text-sm font-medium rounded-md transition-all duration-300 ${
                      isActivePath('/cdx') 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-400'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
