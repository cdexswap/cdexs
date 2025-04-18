"use client";

import Link from "next/link";

export default function PartnerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Partner Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Total Referrals</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Total Earnings</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">$0.00</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Active Partners</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">0</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value="https://example.com/ref/your-code"
            readOnly
            className="flex-1 bg-gray-900 text-gray-100 px-4 py-2 rounded-lg"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Copy
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          href="/cdx/partner/myteam"
          className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Share to Earn</h3>
              <p className="text-sm text-gray-400">Invite new partners</p>
            </div>
          </div>
        </Link>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Performance</h3>
              <p className="text-sm text-gray-400">View statistics</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Network</h3>
              <p className="text-sm text-gray-400">View your partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Partners */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Recent Partners</h2>
        <div className="text-center text-gray-400 py-8">
          No partners yet
        </div>
      </div>
    </div>
  );
}
