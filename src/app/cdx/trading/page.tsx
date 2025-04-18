"use client";

import Link from "next/link";

export default function TradingDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Trading Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Total Balance</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">$0.00</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">24h Trading Volume</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">$0.00</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Open Orders</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">0</p>
        </div>
      </div>

      {/* Quick Actions */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          href="/cdx/balance"
          className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Balance</h3>
              <p className="text-sm text-gray-400">View your assets</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/cdx/withdraw"
          className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-red-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" transform="rotate(45 12 12)" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Withdraw</h3>
              <p className="text-sm text-gray-400">Withdraw funds</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/cdx/transactions"
          className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">History</h3>
              <p className="text-sm text-gray-400">Transaction history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Recent Transactions</h2>
        <div className="text-center text-gray-400 py-8">
          No recent transactions
        </div>
      </div>
    </div>
  );
}
