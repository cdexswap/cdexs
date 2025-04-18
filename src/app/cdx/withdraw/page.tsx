"use client";

export default function WithdrawPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">Withdraw</h1>
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Available Balance */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-400 mb-1">Available Balance</h2>
            <p className="text-2xl font-bold text-gray-100">฿0.00</p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
              />
              <span className="absolute right-4 top-2 text-gray-400">THB</span>
            </div>
          </div>

          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Bank Account
            </label>
            <select className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Choose a bank account</option>
              <option value="1">Kasikorn Bank - xxx-x-xx789-x</option>
            </select>
          </div>

          {/* Submit Button */}
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Confirm Withdrawal
          </button>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              • Minimum withdrawal: ฿100
            </p>
            <p className="text-sm text-gray-400">
              • Processing time: 1-3 business days
            </p>
            <p className="text-sm text-gray-400">
              • Please verify your bank account details before confirming
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
