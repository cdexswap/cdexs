"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SideMenuProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, isMobile, onClose }: SideMenuProps) {
  const pathname = usePathname();

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`bg-gray-900 border-r border-gray-800 ${
      isMobile 
        ? 'w-full border-b overflow-x-auto flex items-center space-x-4 px-4 py-3' 
        : 'w-64 min-h-screen'
    }`}>
      {isMobile ? (
        <div className="flex items-center space-x-6">
          {/* Trading Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-100">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium">Trading</span>
            </div>
            <Link
              href="/cdx/balance"
              onClick={onClose}
              className={`flex items-center whitespace-nowrap text-sm ${
                isActivePath('/cdx/balance') ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span>Balance</span>
            </Link>
            <Link
              href="/cdx/withdraw"
              onClick={onClose}
              className={`flex items-center whitespace-nowrap text-sm ${
                isActivePath('/cdx/withdraw') ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span>Withdraw</span>
            </Link>
          </div>

          {/* Partner Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-100">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium">Partner</span>
            </div>
            <Link
              href="/cdx/partner/myteam"
              onClick={onClose}
              className={`flex items-center whitespace-nowrap text-sm ${
                isActivePath('/cdx/partner/myteam') ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span>My Team</span>
            </Link>
          </div>

          {/* Shop Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-100">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium">Shop</span>
            </div>
            <Link
              href="/cdx/bank"
              onClick={onClose}
              className={`flex items-center whitespace-nowrap text-sm ${
                isActivePath('/cdx/bank') ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span>Bank</span>
            </Link>
          </div>

          {/* Account Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-100">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Account</span>
            </div>
            <Link
              href="/cdx/kyc"
              onClick={onClose}
              className={`flex items-center whitespace-nowrap text-sm ${
                isActivePath('/cdx/kyc') ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span>KYC</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {/* Trading Section */}
          <div className="mb-6">
            <Link
              href="/cdx/trading"
              className={`flex items-center justify-between w-full px-4 py-2 text-left text-gray-100 bg-gray-800/50 rounded-lg mb-2 ${
                isActivePath('/cdx/trading') ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium">Trading Dashboard</span>
              </div>
            </Link>

            <div className="pl-2 space-y-1">
              <Link
                href="/cdx/balance"
                onClick={isMobile ? onClose : undefined}
                className={`block px-4 py-2 text-sm rounded-lg ${
                  isActivePath('/cdx/balance')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Balance
              </Link>
              <Link
                href="/cdx/withdraw"
                onClick={isMobile ? onClose : undefined}
                className={`block px-4 py-2 text-sm rounded-lg ${
                  isActivePath('/cdx/withdraw')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Withdraw
              </Link>
              <Link
                href="/cdx/transactions"
                onClick={isMobile ? onClose : undefined}
                className={`block px-4 py-2 text-sm rounded-lg ${
                  isActivePath('/cdx/transactions')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Transaction History
              </Link>
            </div>
          </div>

          {/* Partner Section */}
          <div className="mb-6">
            <Link
              href="/cdx/partner"
              className={`flex items-center justify-between w-full px-4 py-2 text-left text-gray-100 bg-gray-800/50 rounded-lg mb-2 ${
                isActivePath('/cdx/partner') ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">Partner Dashboard</span>
              </div>
            </Link>

            <div className="pl-2 space-y-1">
              <Link
                href="/cdx/partner/myteam"
                onClick={isMobile ? onClose : undefined}
                className={`block px-4 py-2 text-sm rounded-lg ${
                  isActivePath('/cdx/partner/myteam')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                My Team
              </Link>
            </div>
          </div>

          {/* Shop Section */}
          <div className="mb-6">
            <Link
              href="#"
              className={`flex items-center justify-between w-full px-4 py-2 text-left text-gray-100 bg-gray-800/50 rounded-lg mb-2 ${
                isActivePath('/cdx/shop') ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">Shop Dashboard</span>
              </div>
            </Link>

            <div className="pl-2 space-y-1">
              <Link
                href="/cdx/bank"
                onClick={isMobile ? onClose : undefined}
                className={`block px-4 py-2 text-sm rounded-lg ${
                  isActivePath('/cdx/bank')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Bank Accounts
              </Link>
            </div>
          </div>

          {/* Account Section */}
          <div className="mb-6">
            <Link
              href="#"
              className={`flex items-center justify-between w-full px-4 py-2 text-left text-gray-100 bg-gray-800/50 rounded-lg mb-2 ${
                isActivePath('/cdx/account') ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Account</span>
              </div>
            </Link>

            <div className="pl-2 space-y-1">
              <Link
                href="/cdx/kyc"
                onClick={isMobile ? onClose : undefined}
                className={`block px-4 py-2 text-sm rounded-lg ${
                  isActivePath('/cdx/kyc')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                KYC
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
