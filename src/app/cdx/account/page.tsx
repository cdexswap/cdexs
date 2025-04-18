"use client";

import Link from "next/link";

export default function AccountDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Account Dashboard</h1>
      
      {/* Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">KYC Status</h3>
          <p className="text-2xl font-bold text-yellow-400 mt-2">Pending</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Bank Accounts</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Account Level</h3>
          <p className="text-2xl font-bold text-gray-100 mt-2">Basic</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/cdx/kyc"
          className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Complete KYC</h3>
              <p className="text-sm text-gray-400">Verify your identity</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/cdx/bank"
          className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-100">Bank Accounts</h3>
              <p className="text-sm text-gray-400">Manage your bank accounts</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Account Security
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Account Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-100">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400">Secure your account with 2FA</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600">
              Enable
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-100">Change Password</h3>
                <p className="text-sm text-gray-400">Update your password</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-gray-100 bg-gray-700 rounded-lg hover:bg-gray-600">
              Update
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
}
