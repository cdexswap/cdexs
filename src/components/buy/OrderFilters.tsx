import { chainMetadata, evmChains } from "@/lib/config/chains";

interface OrderFiltersProps {
  selectedChain: number | 'all';
  setSelectedChain: (chain: number | 'all') => void;
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  selectedPayment: string;
  setSelectedPayment: (payment: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export default function OrderFilters({
  selectedChain,
  setSelectedChain,
  selectedToken,
  setSelectedToken,
  selectedCurrency,
  setSelectedCurrency,
  selectedPayment,
  setSelectedPayment,
  sortOrder,
  setSortOrder
}: OrderFiltersProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {/* Chain Selection */}
      <div className="relative">
        <label htmlFor="chain" className="block text-xs md:text-sm font-medium text-gray-400 mb-2">
          Chain
        </label>
        <select
          id="chain"
          value={selectedChain}
          onChange={(e) => {
            const newChain = e.target.value === 'all' ? 'all' : Number(e.target.value);
            setSelectedChain(newChain);
            setSelectedToken('all');
          }}
          className="block w-full pl-3 pr-8 py-2.5 md:py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-800 appearance-none"
        >
          <option value="all">All Chains</option>
          {evmChains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chainMetadata[chain.id].name}
            </option>
          ))}
        </select>
      </div>

      {/* Token Filter */}
      <div className="relative">
        <label htmlFor="token" className="block text-xs md:text-sm font-medium text-gray-400 mb-2">
          Token
        </label>
        <select
          id="token"
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="block w-full pl-3 pr-8 py-2.5 md:py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-800 appearance-none"
        >
          <option value="all">All Tokens</option>
          <option value="USDT">USDT</option>
          <option value="BUSD">BUSD</option>
          {selectedChain !== 'all' && chainMetadata[selectedChain] && (
            <option value={chainMetadata[selectedChain].symbol}>
              {chainMetadata[selectedChain].symbol}
            </option>
          )}
        </select>
      </div>

      {/* Currency Filter */}
      <div className="relative">
        <label htmlFor="currency" className="block text-xs md:text-sm font-medium text-gray-400 mb-2">
          Currency
        </label>
        <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="block w-full pl-3 pr-8 py-2.5 md:py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-800 appearance-none"
        >
          <option value="all">All Currencies</option>
          <option value="USD">US Dollar (USD)</option>
          <option value="THB">Thai Baht (THB)</option>
          <option value="SGD">Singapore Dollar (SGD)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="LAK">Lao Kip (LAK)</option>
          <option value="MYR">Malaysian Ringgit (MYR)</option>
          <option value="VND">Vietnamese Dong (VND)</option>
          <option value="CNY">Chinese Yuan (CNY)</option>
        </select>
      </div>

      {/* Payment Method Filter */}
      <div className="relative">
        <label htmlFor="payment" className="block text-xs md:text-sm font-medium text-gray-400 mb-2">
          Payment Method
        </label>
        <select
          id="payment"
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
          className="block w-full pl-3 pr-8 py-2.5 md:py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-800 appearance-none"
        >
          <option value="all">All Methods</option>
          <option value="bank">Bank Transfer</option>
          <option value="promptpay">PromptPay</option>
          <option value="truemoney">TrueMoney</option>
          <option value="wechat">WeChat Pay</option>
          <option value="alipay">Alipay</option>
        </select>
      </div>

      {/* Sort by Price */}
      <div className="relative">
        <label htmlFor="sortOrder" className="block text-xs md:text-sm font-medium text-gray-400 mb-2">
          Sort by Price
        </label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="block w-full pl-3 pr-8 py-2.5 md:py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-800 appearance-none"
        >
          <option value="asc">Lowest First</option>
          <option value="desc">Highest First</option>
        </select>
      </div>
    </div>
  );
}
