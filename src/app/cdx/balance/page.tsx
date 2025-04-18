"use client";
import Link from 'next/link';
import SettingsModal from '@/components/SettingsModal';

export default function BalancePage() {
  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-100">Balance</h1>
        
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-300 mb-2">Total Assets Value</h2>
              <p className="text-3xl font-bold text-gray-100">฿0.00</p>
            </div>
            <div className="border border-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-300 mb-2">CDX Token Balance</h2>
              <p className="text-3xl font-bold text-gray-100">0.00000000</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <Link href="/buy" className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-center transition-colors">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Buy Crypto</span>
              </div>
            </Link>

            <Link href="/sell" className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg text-center transition-colors">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span className="text-sm font-medium">Sell Crypto</span>
              </div>
            </Link>

            <button 
              onClick={() => {
                const settingsButton = document.querySelector('[data-tutorial="settings"]') as HTMLElement;
                if (settingsButton) {
                  settingsButton.click();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-center transition-colors"
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <span className="text-sm font-medium">Open Shop</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <SettingsModal />
    </>
  );
}
