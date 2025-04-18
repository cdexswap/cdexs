"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useInitializedWeb3Modal } from '@/hooks/useInitializedWeb3Modal'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import { useAccount, useDisconnect } from 'wagmi'
import Image from 'next/image'
import ReferralDialog from './ReferralDialog'
import Tutorial from './Tutorial'

export default function WalletConnect() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [pendingWallet, setPendingWallet] = useState<{address: string, type: 'evm' | 'solana'} | null>(null)
  const [selectedChainType, setSelectedChainType] = useState<'evm' | 'solana'>('evm')
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connected: isSolanaConnected, disconnect: disconnectSolana } = useWallet()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const walletOptionsRef = useRef<HTMLDivElement>(null)
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const { open, isReady } = useInitializedWeb3Modal()
  
  // Get Solana wallet address
  const solanaWallet = typeof window !== 'undefined' && window.solana?.publicKey?.toString()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false)
          // Dispatch custom event for wallet modal close
          window.dispatchEvent(new Event('wallet-modal-close'))
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Ensure blur is removed when wallet is connected
  useEffect(() => {
    if (isEvmConnected || isSolanaConnected) {
      // Dispatch event to remove blur when wallet is connected
      window.dispatchEvent(new Event('wallet-modal-close'))
    }
  }, [isEvmConnected, isSolanaConnected])

  const checkUser = useCallback(async (address: string, type: 'evm' | 'solana') => {
    try {
      const response = await fetch('/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, wallet_type: type })
      })
      const data = await response.json()
      
      if (!data.exists) {
        setPendingWallet({ address, type })
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }, [])

  const handleReferralSubmit = async (referralCode: string) => {
    if (!pendingWallet) return
    
    try {
      await fetch('/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: pendingWallet.address,
          wallet_type: pendingWallet.type,
          referral_code: referralCode
        })
      })
    } catch (error) {
      console.error('Error saving referral:', error)
    } finally {
      setShowReferralDialog(false)
      setPendingWallet(null)
    }
  }

  // Unified wallet connection for all browsers
  const handleOpenModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (isPending) {
      console.log('Connection request already pending');
      return;
    }
    
    // Force close dropdown first to prevent UI issues
    setIsOpen(false);
    
    try {
      setIsPending(true);
      
      // Try multiple approaches to ensure compatibility across browsers
      const tryOpenWallet = async () => {
        try {
          // First try with default options
          await open();
          return true;
        } catch (error) {
          console.log('First wallet open attempt failed:', error);
          
          try {
            // Second try with Connect view
            await open({ view: 'Connect' });
            return true;
          } catch (error2) {
            console.log('Second wallet open attempt failed:', error2);
            
            try {
              // Third try with a different approach - using direct DOM interaction
              // Find and click the Web3Modal button if it exists in the DOM
              const w3mButtons = document.querySelectorAll('w3m-button');
              if (w3mButtons.length > 0) {
                console.log('Found Web3Modal button, clicking directly');
                // @ts-ignore
                w3mButtons[0].click();
                return true;
              }
            } catch (error3) {
              console.log('Third wallet open attempt failed:', error3);
            }
          }
        }
        return false;
      };
      
      // Try opening with a delay to ensure UI is ready
      setTimeout(async () => {
        const success = await tryOpenWallet();
        if (!success) {
          console.log('All wallet open attempts failed');
        }
        setIsPending(false);
      }, 200);
    } catch (error) {
      console.error('Wallet connection setup error:', error);
      setIsPending(false);
    }
  };

  // Effect to check EVM wallet on connection
  useEffect(() => {
    console.log('Checking EVM wallet:', isEvmConnected, evmAddress)
    if (isEvmConnected && evmAddress) {
      checkUser(evmAddress, 'evm')
    }
  }, [isEvmConnected, evmAddress, checkUser])

  // Effect to check Solana wallet on connection
  useEffect(() => {
    if (isSolanaConnected && solanaWallet) {
      checkUser(solanaWallet, 'solana')
    }
  }, [isSolanaConnected, solanaWallet, checkUser])

  // Close wallet options dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletOptionsRef.current && !walletOptionsRef.current.contains(event.target as Node)) {
        setShowWalletOptions(false);
      }
    }
    
    if (showWalletOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWalletOptions]);

  // Copy functions for wallet addresses
  const copyEvmAddressToClipboard = () => {
    if (evmAddress) {
      navigator.clipboard.writeText(evmAddress);
      setShowWalletOptions(false);
    }
  };

  const copySolanaAddressToClipboard = () => {
    if (solanaWallet) {
      navigator.clipboard.writeText(solanaWallet);
      setShowWalletOptions(false);
    }
  };

  // Disconnect functions
  const disconnectEvmWallet = () => {
    disconnect();
    setShowWalletOptions(false);
  };

  const disconnectSolanaWallet = () => {
    if (disconnectSolana) {
      disconnectSolana();
    } else if (window.solana && window.solana.disconnect) {
      window.solana.disconnect();
    }
    setShowWalletOptions(false);
  };

  if (!isReady) {
    return null
  }

  if (selectedChainType === 'evm' && isEvmConnected && evmAddress) {
    return (
      <div className="relative" ref={walletOptionsRef}>
        <button
          onClick={() => setShowWalletOptions(!showWalletOptions)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300"
        >
          {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showWalletOptions && (
          <div className="fixed right-4 top-16 w-48 bg-gray-900 rounded-md shadow-lg z-[200] border border-gray-800">
            <div className="py-1">
              <button
                onClick={copyEvmAddressToClipboard}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Address
              </button>
              <button
                onClick={disconnectEvmWallet}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (selectedChainType === 'solana' && isSolanaConnected) {
    const solanaWallet = window.solana?.publicKey?.toString();
    
    const copySolanaAddressToClipboard = () => {
      if (solanaWallet) {
        navigator.clipboard.writeText(solanaWallet);
        setShowWalletOptions(false);
      }
    };
    
    return (
      <div className="relative" ref={walletOptionsRef}>
        <button
          onClick={() => setShowWalletOptions(!showWalletOptions)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300"
        >
          {solanaWallet ? `${solanaWallet.slice(0, 6)}...${solanaWallet.slice(-4)}` : 'Connected'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showWalletOptions && (
          <div className="fixed right-4 top-16 w-48 bg-gray-900 rounded-md shadow-lg z-[200] border border-gray-800">
            <div className="py-1">
              <button
                onClick={copySolanaAddressToClipboard}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Address
              </button>
              <button
                onClick={() => {
                  // Disconnect Solana wallet
                  if (window.solana && window.solana.disconnect) {
                    window.solana.disconnect();
                  }
                  setShowWalletOptions(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <ReferralDialog 
        isOpen={showReferralDialog}
        onClose={() => {
          setShowReferralDialog(false)
          setPendingWallet(null)
        }}
        onSubmit={handleReferralSubmit}
      />
      {/* Connect Wallet Button */}
      <button
        data-tutorial="wallet-connect"
        onClick={(e) => {
          // Show the dropdown for all browsers
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Dispatch custom event for wallet modal open
            window.dispatchEvent(new Event('wallet-modal-open'));
          } else {
            // Dispatch custom event for wallet modal close
            window.dispatchEvent(new Event('wallet-modal-close'));
          }
        }}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 group safari-click-fix"
        style={{ WebkitAppearance: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
      >
        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Connect Wallet
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <>
          {/* Backdrop overlay - more subtle with blur */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" onClick={() => {
            setIsOpen(false)
            // Dispatch custom event for wallet modal close
            window.dispatchEvent(new Event('wallet-modal-close'))
            // Force blur removal when exiting chain selection
            setTimeout(() => {
              window.dispatchEvent(new Event('wallet-modal-close'))
            }, 100)
          }}></div>
          
          {/* Popup centered in viewport with adjusted vertical position and dark styling */}
          <div className="fixed top-[40%] left-1/2 transform -translate-x-1/2 w-80 bg-gray-900 rounded-xl shadow-2xl ring-1 ring-blue-500/20 z-[101]">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Select Network</h3>
            {/* Chain Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedChainType('evm')
                  // Ensure blur is removed when changing chain type
                  window.dispatchEvent(new Event('wallet-modal-close'))
                }}
                className={`relative px-3 py-3 rounded-xl transition-all duration-200 ${
                  selectedChainType === 'evm'
                    ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 shadow-sm border border-blue-500/30'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full ${
                    selectedChainType === 'evm' ? 'bg-blue-900/30' : 'bg-gray-700'
                  }`}>
                    <Image src="/chains/eth.svg" alt="EVM" width={24} height={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-100">EVM Chains</div>
                    <div className="text-xs text-gray-400">ETH, BSC</div>
                  </div>
                </div>
                {selectedChainType === 'evm' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedChainType('solana')
                  // Ensure blur is removed when changing chain type
                  window.dispatchEvent(new Event('wallet-modal-close'))
                }}
                className={`relative px-3 py-3 rounded-xl transition-all duration-200 ${
                  selectedChainType === 'solana'
                    ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 shadow-sm border border-blue-500/30'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full ${
                    selectedChainType === 'solana' ? 'bg-blue-900/30' : 'bg-gray-700'
                  }`}>
                    <Image src="/chains/solana.svg" alt="Solana" width={24} height={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-100">Solana</div>
                    <div className="text-xs text-gray-400">SPL Tokens</div>
                  </div>
                </div>
                {selectedChainType === 'solana' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                )}
              </button>
            </div>

            {/* Connection UI */}
            <div className="flex justify-center">
              <div className="w-[220px]">
                {selectedChainType === 'evm' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Ensure blur is removed when connecting
                      window.dispatchEvent(new Event('wallet-modal-close'));
                      
                      // Use unified approach for all browsers
                      handleOpenModal(e);
                    }}
                    disabled={isPending}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white w-full justify-center safari-click-fix ${
                      isPending
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                    } transition-all duration-300`}
                    style={{ WebkitAppearance: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
                  >
                    {isPending ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )}
                {selectedChainType === 'solana' && (
                  <div className="flex justify-center">
                    <WalletMultiButton className="!bg-blue-500 hover:!bg-blue-600 !rounded-lg !w-full !flex !justify-center" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
      <Tutorial show={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  )
}
