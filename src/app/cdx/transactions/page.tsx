"use client";

export default function TransactionsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">Transaction History</h1>
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="transfer">Transfer</option>
          </select>
          <select className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {/* Example Transaction - Buy */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-green-400 font-medium">Buy CDX</span>
                <p className="text-xl font-bold text-gray-100 mt-1">100 CDX</p>
                <p className="text-sm text-gray-400">฿5,000.00</p>
              </div>
              <span className="px-3 py-1 text-sm text-green-400 bg-green-400/10 rounded-full">
                Completed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Price</p>
                <p className="text-gray-300">฿50.00/CDX</p>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p className="text-gray-300">Feb 9, 2025 13:15</p>
              </div>
              <div>
                <p className="text-gray-400">Transaction ID</p>
                <p className="text-gray-300">#TRX789012</p>
              </div>
              <div>
                <p className="text-gray-400">Wallet</p>
                <p className="text-gray-300">0x1234...5678</p>
              </div>
            </div>
          </div>

          {/* Example Transaction - Sell */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-red-400 font-medium">Sell CDX</span>
                <p className="text-xl font-bold text-gray-100 mt-1">50 CDX</p>
                <p className="text-sm text-gray-400">฿2,750.00</p>
              </div>
              <span className="px-3 py-1 text-sm text-yellow-400 bg-yellow-400/10 rounded-full">
                Pending
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Price</p>
                <p className="text-gray-300">฿55.00/CDX</p>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p className="text-gray-300">Feb 9, 2025 12:30</p>
              </div>
              <div>
                <p className="text-gray-400">Transaction ID</p>
                <p className="text-gray-300">#TRX789011</p>
              </div>
              <div>
                <p className="text-gray-400">Wallet</p>
                <p className="text-gray-300">0x1234...5678</p>
              </div>
            </div>
          </div>
        </div>

        {/* Load More Button */}
        <button className="w-full mt-6 py-3 px-4 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors">
          Load More
        </button>
      </div>
    </div>
  );
}
