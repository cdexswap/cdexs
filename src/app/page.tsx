"use client"

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AnimatedStats from '../components/AnimatedStats';
import Tutorial from '../components/Tutorial';
import CDXPopup from '../components/CDXPopup';

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCDXPopup, setShowCDXPopup] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  useEffect(() => {
    const isFirstTime = localStorage.getItem('isFirstTime') !== 'false' || !localStorage.getItem('isFirstTime');
    console.log('isFirstTime', isFirstTime);
    if (isFirstTime) {
      setShowTutorial(true);
      localStorage.setItem('isFirstTime', 'false');
    }
    
    // Show CDX popup after a short delay
    const timer = setTimeout(() => {
      setShowCDXPopup(true);
    }, 1500);
    
    // Listen for wallet modal open/close events
    const handleWalletModalOpen = () => setIsWalletModalOpen(true);
    const handleWalletModalClose = () => setIsWalletModalOpen(false);

    window.addEventListener('wallet-modal-open', handleWalletModalOpen);
    window.addEventListener('wallet-modal-close', handleWalletModalClose);

    // Also check for wallet connection status to ensure blur is removed
    const checkWalletConnection = () => {
      // If wallet is connected, ensure blur is removed
      if (window.ethereum?.selectedAddress || window.solana?.publicKey) {
        setIsWalletModalOpen(false);
      }
    };

    // Check initially and set up interval to check periodically
    checkWalletConnection();
    const intervalId = setInterval(checkWalletConnection, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      window.removeEventListener('wallet-modal-open', handleWalletModalOpen);
      window.removeEventListener('wallet-modal-close', handleWalletModalClose);
      clearInterval(intervalId);
    };
  }, []);
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {showTutorial && <Tutorial show={showTutorial} onClose={() => setShowTutorial(false)} />}
      <CDXPopup show={showCDXPopup} onClose={() => setShowCDXPopup(false)} />
      {/* Hero Section */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 ${isWalletModalOpen ? 'blur-md' : ''}`}>
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-2/5 text-center lg:text-left">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl xl:text-7xl">
              <span className="block">Trust in AI Blockchain</span>
              <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Third Party Service
              </span>
            </h1>
            <p className="mt-8 text-lg text-gray-300 sm:text-xl">
              The most trusted P2P trading platform and escrow service with transparency and high security measures, using blockchain technology and smart contracts.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link href="/buy" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50">
                Start Trading
              </Link>
              <Link href="/sell" className="inline-flex items-center px-8 py-3 border border-gray-700 text-base font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-gray-700/50">
                Learn More
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-3/5">
            <Image
              src="/home/home-main.png"
              alt="Crypto Exchange Platform"
              width={800}
              height={600}
              priority
              className="w-full h-auto rounded-2xl shadow-2xl shadow-blue-500/20"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* CDXG Coin and CDX Token Section */}
        <div className="mt-24 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-3xl border border-blue-500/30 p-12 backdrop-blur-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* CDXG Coin */}
            <div className="w-full">
              <div className="flex flex-col h-full">
                <h2 className="text-4xl font-bold text-white mb-6">
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    CDXG Coin
                  </span>
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  CDXG is a revolutionary digital asset that powers the next generation of decentralized trading. Built on advanced blockchain technology, CDXG offers:
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-300">
                    <div className="bg-blue-500/20 rounded-full p-1 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Fast & Secure Transactions
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="bg-blue-500/20 rounded-full p-1 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Low Transaction Fees
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="bg-blue-500/20 rounded-full p-1 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Smart Contract Integration
                  </li>
                </ul>
                <div className="flex flex-wrap gap-4 mt-auto">
                  <a 
                    href="https://coin.cdexs.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
                  >
                    Buy CDXG Now
                  </a>
                  <div className="flex items-center text-gray-300">
                  </div>
                </div>
              </div>
            </div>
            
            {/* CDX Token */}
            <div className="w-full">
              <div className="flex flex-col h-full">
                <h2 className="text-4xl font-bold text-white mb-6">
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    CDX Token
                  </span>
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  CDX powers a revolutionary decentralized exchange with enhanced features and security.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-300">
                    <div className="bg-blue-500/20 rounded-full p-1 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Enhanced Security Features
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="bg-blue-500/20 rounded-full p-1 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Decentralized Exchange Support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="bg-blue-500/20 rounded-full p-1 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Cross-Chain Compatibility
                  </li>
                </ul>
                <div className="flex flex-wrap gap-4 mt-auto">
                  <a 
                    href="https://cdx.cdexs.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
                  >
                    Buy CDX Token
                  </a>
                  <div className="flex items-center text-gray-300">
                    <span className="text-2xl font-bold text-blue-400">$0.01</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features Section */}
        <div className="mt-24 space-y-24">
          {/* Security Awareness Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2">
              <Image
                src="/home/security-awareness.webp"
                alt="Security Awareness"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl shadow-blue-500/20 w-full h-auto"
              />
            </div>
            <div className="w-full lg:w-1/2 text-left">
              <h2 className="text-3xl font-bold text-white mb-6">Security Awareness</h2>
              <p className="text-lg text-gray-300">
                We prioritize data security above all else. With our internationally 
                standardized security systems, you can be confident that every 
                transaction is protected and secure.
              </p>
            </div>
          </div>

          {/* Data Privacy Section */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="w-full lg:w-1/2">
              <Image
                src="/home/data-privacy.webp"
                alt="Data Privacy"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl shadow-blue-500/20 w-full h-auto"
              />
            </div>
             <div className="w-full lg:w-1/2 text-left">
              <h2 className ="text-3xl font-bold text-white mb-6">Data Privacy</h2>
              <p className="text-lg text-gray-300">
                We protect your personal information with advanced encryption technology 
                and data management systems that comply with personal data protection standards.
              </p>
            </div>
          </div>

          {/* Cybersecurity Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2">
              <Image
                src="/home/cybersecurity.webp"
                alt="Cybersecurity"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl shadow-blue-500/20 w-full h-auto"
              />
            </div>
            <div className="w-full lg:w-1/2  text-left">
              <h2 className="text-3xl font-bold text-white mb-6">Cybersecurity</h2>
              <p className="text-lg text-gray-300">
                With state-of-the-art cybersecurity technology, we effectively prevent 
                cyber attacks and threats, ensuring your transactions are secure 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg hover:border-blue-500/50 transition-all duration-300">
            <div className="bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/globe.svg" alt="Global" width={24} height={24} className="opacity-80" />
             </div>
            <h3 className="text-lg font-semibold text-gray-100">Global Coverage</h3>
            <p className="mt-2 text-gray-400">Trade with users worldwide with multi-currency support</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg hover:border-blue-500/50 transition-all duration-300">
            <div className="bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/window.svg" alt="Secure" width={24} height={24} className="opacity-80" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Secure Escrow</h3>
            <p className="mt-2 text-gray-400">Protected transactions with professional escrow service</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg hover:border-blue-500/50 transition-all duration-300">
            <div className="bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/chat.svg" alt="Support" width={24} height={24} className="opacity-80" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">24/7 Support</h3>
            <p className="mt-2 text-gray-400">Professional support team ready to help anytime</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg hover:border-blue-500/50 transition-all duration-300">
            <div className="bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/file.svg" alt="Verified" width={24} height={24} className="opacity-80" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Verified Users</h3>
            <p className="mt-2 text-gray-400">Trade with confidence with verified partners</p>
          </div>
        </div>

        {/* Supported Chains */}
        <div className="mt-20 bg-gray-900/30 rounded-2xl border border-gray-800 p-8 backdrop-blur-lg">
          <h2 className="text-2xl font-bold text-center text-gray-100 mb-8">Supported Networks</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { id: 'eth', name: 'Ethereum' },
              { id: 'polygon', name: 'Polygon' },
              { id: 'bsc', name: 'BSC' },
              { id: 'arbitrum', name: 'Arbitrum' },
              { id: 'base', name: 'Base' },
              { id: 'solana', name: 'Solana' }
            ].map((chain) => (
              <div key={chain.id} className="flex flex-col items-center group">
                <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300 w-16 h-16 flex items-center justify-center">
                  <Image 
                    src={`/chains/${chain.id}.svg`} 
                    alt={chain.name}
                    width={44} 
                    height={44}
                    className="w-11 h-11 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <span className="mt-2.5 text-sm font-medium text-gray-400 group-hover:text-blue-400 transition-colors duration-300">
                  {chain.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        { /* Statistics */}
        <div className="mt-20 bg-g ray-900/30 rounded-2xl border border-gray-800 p-8 backdrop-blur-lg">
           <AnimatedStats />
        </div>

        {/* Recent Activity */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Recent Trades</h2>
          <div className="bg-gray-900/30 rounded-xl border border-gray-800 backdrop-blur-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">Buy</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">0.5 BTC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">$20,000</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/50 text-green-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">Sell</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">1.2 ETH</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">$2,400</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/50 text-yellow-400">
                        Pending
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
