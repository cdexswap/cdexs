import Image from "next/image";
import ReactCountryFlag from "react-country-flag";
import { Order, UserSettings } from "@/types/order";
import { getChainIcon, getCurrencyIcon, getCurrency, currencySymbols } from "@/utils/currency";
import { getCountryCodes, truncateAddress, getRate } from "@/utils/order";

interface OrderListItemProps {
  order: Order;
  sellerSettings: Record<string, UserSettings>;
  selectedCurrency: string;
  onBuyClick: (order: Order) => void;
}

export default function OrderListItem({ 
  order, 
  sellerSettings, 
  selectedCurrency,
  onBuyClick 
}: OrderListItemProps) {
  const countryCodes = getCountryCodes(order);
  const primaryCountry = countryCodes[0];
  const primaryCurrency = getCurrency(primaryCountry);
  const otherCurrencies = countryCodes.slice(1).map(code => getCurrency(code)).filter(Boolean);

  const getDisplayPrice = () => {
    // Get rate based on selected currency
    if (selectedCurrency !== 'all') {
      const countryCode = Object.entries(order.rates || {}).find(([country]) => 
        getCurrency(country) === selectedCurrency
      )?.[0];
      
      if (countryCode && order.rates?.[countryCode]) {
        return `${currencySymbols[selectedCurrency]}${order.rates[countryCode].toFixed(2)}`;
      }
    }
    
    // If no currency selected or not found, use the first available rate
    const firstCountry = Object.keys(order.rates || {})[0];
    if (firstCountry && order.rates?.[firstCountry]) {
      const currency = getCurrency(firstCountry);
      if (currency && currencySymbols[currency]) {
        return `${currencySymbols[currency]}${order.rates[firstCountry].toFixed(2)}`;
      }
    }
    
    // Fallback to default rate
    return `฿${(order.price || 0).toFixed(2)}`;
  };

  return (
    <div className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 md:p-6 transition-colors">
      <div className="flex flex-col md:grid md:grid-cols-5 gap-4 md:gap-8 md:items-center">
        {/* Advertiser - Full width on mobile */}
        <div className="flex items-center gap-3 md:col-span-1">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-white">
              {(sellerSettings[order.user_id]?.name || '').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white mb-0.5">
              {sellerSettings[order.user_id]?.name || truncateAddress(order.user_id)}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-gray-700/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                <span className="text-blue-400">63</span>
                <span className="text-gray-400">orders</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-700/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                <span className="text-green-400">94.10%</span>
                <span className="text-gray-400">success</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-700/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                <span className="text-purple-400">15</span>
                <span className="text-gray-400">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price - Aligned left on mobile */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-center md:pl-16 mt-4 md:mt-0">
          <div className="flex items-center justify-between md:block">
            <span className="text-sm text-gray-400 md:hidden">Price:</span>
            <div className="text-lg font-semibold text-white">
              {getDisplayPrice()}
            </div>
          </div>
          <div className="text-sm text-gray-400 mt-1 md:mt-0 md:ml-2">
            {selectedCurrency !== 'all' ? selectedCurrency : (primaryCurrency || 'THB')}
          </div>
        </div>

        {/* Available/Order Limit - Full width on mobile */}
        <div className="flex items-start justify-between md:justify-start md:pl-16 mt-4 md:mt-0">
          <span className="text-sm text-gray-400 md:hidden">Available:</span>
          <div className="flex items-center gap-2 text-sm text-gray-400 group relative whitespace-nowrap">
            <div className="flex flex-col">
              <div className="flex items-center">
                <Image
                  src={getCurrencyIcon(order.currency, order.chain)}
                  alt={order.currency}
                  width={18}
                  height={18}
                  className="opacity-90 mr-2"
                />
                <span className="text-base font-semibold text-white">
                  {typeof order.remainingBalance !== 'undefined' ? order.remainingBalance : order.amount} {order.currency}
                </span>
              </div>
              {/* Show price range based on seller's rate and limits */}
              <div className="text-gray-400 mt-1">
                {(() => {
                  let currency;
                  if (selectedCurrency !== 'all') {
                    // Show range for selected currency if the seller accepts it
                    const acceptedCountryCodes = getCountryCodes(order);
                    const matchingCountry = acceptedCountryCodes.find(code => getCurrency(code) === selectedCurrency);
                    if (matchingCountry) {
                      currency = selectedCurrency;
                    }
                  }
                  
                  // Default to primary currency if selected currency not accepted
                  if (!currency) {
                    currency = primaryCurrency;
                  }
                  
                  if (!currency || !currencySymbols[currency]) return '';
                  
                  // Get rate based on selected currency or first available rate
                  let rate;
                  if (selectedCurrency !== 'all') {
                    const countryCode = Object.entries(order.rates || {}).find(([country]) => 
                      getCurrency(country) === selectedCurrency
                    )?.[0];
                    rate = countryCode ? order.rates?.[countryCode] : undefined;
                  }
                  
                  if (!rate) {
                    const firstCountry = Object.keys(order.rates || {})[0];
                    rate = firstCountry ? order.rates?.[firstCountry] : order.price;
                  }

                  const minPrice = order.minBuyAmount ? order.minBuyAmount * (rate || 0) : 0;
                  const maxPrice = order.maxBuyAmount ? order.maxBuyAmount * (rate || 0) : order.amount * (rate || 0);
                  
                  return `${currencySymbols[currency]}${minPrice.toLocaleString()} - ${currencySymbols[currency]}${maxPrice.toLocaleString()}`;
                })()}
              </div>
            </div>
            
            {/* Show other currencies in tooltip */}
            {otherCurrencies.length > 0 && (
              <div className="absolute left-0 -bottom-20 hidden group-hover:block bg-gray-900 text-white text-sm rounded p-2 whitespace-pre">
                {otherCurrencies
                  .filter((curr): curr is string => Boolean(curr))
                  .map(curr => {
                    const rate = getRate(order, primaryCountry);
                    const minPrice = order.minBuyAmount ? order.minBuyAmount * rate : 0;
                    const maxPrice = order.maxBuyAmount ? order.maxBuyAmount * rate : order.amount * rate;
                    return `${currencySymbols[curr]}${minPrice.toLocaleString()} - ${currencySymbols[curr]}${maxPrice.toLocaleString()}`;
                  })
                  .join('\n')}
              </div>
            )}
          </div>
        </div>

        {/* Countries - Aligned left on mobile */}
        <div className="flex flex-col md:items-center md:justify-center md:pl-16 mt-4 md:mt-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getCountryCodes(order).map((countryCode) => (
              <ReactCountryFlag
                key={countryCode}
                countryCode={countryCode}
                svg
                style={{
                  width: '24px',
                  height: '24px'
                }}
                className="rounded-sm"
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Image
              src={getChainIcon(order.chain)}
              alt={order.chain}
              width={16}
              height={16}
              className="opacity-90"
            />
            <span className="text-sm text-gray-300">
              {order.chain === 'Binance Chain' ? 'Binance' : order.chain}
            </span>
          </div>
        </div>

        {/* Trade Button - Full width on mobile */}
        <div className="flex justify-center md:justify-end mt-4 md:mt-0">
          <button 
            className="w-full md:w-32 py-3 md:py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            onClick={() => onBuyClick(order)}
          >
            Buy {order.currency}
          </button>
        </div>
      </div>
    </div>
  );
}
