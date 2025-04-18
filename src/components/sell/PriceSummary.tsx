import ReactCountryFlag from 'react-country-flag';
import TokenPrice from '@/components/TokenPrice';

interface PaymentMethod {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

interface UserSettings {
  supportedCountries?: string[];
  paymentMethods?: Record<string, PaymentMethod>;
}

interface PriceSummaryProps {
  amount: string;
  selectedCountries: string[];
  bankRates: Record<string, string>;
  selectedToken: string;
  userSettings: UserSettings | null;
  numBuyers: string;
}

const BASE_FEE_PERCENTAGE = 3;
const ADDITIONAL_FEE_PER_BUYER = 0.4;
const BASE_GAS_FEE_USDT = 0.4; // Base gas fee (0.4 USDT)
const ADDITIONAL_GAS_FEE_PER_BUYER = 0.4; // Additional gas fee per buyer (0.4 USDT)

const getCurrency = (countryCode: string) => {
  switch(countryCode) {
    case 'TH': return 'THB';
    case 'MY': return 'MYR';
    case 'SG': return 'SGD';
    case 'LA': return 'LAK';
    case 'CN': return 'CNY';
    default: return '';
  }
};

export default function PriceSummary({
  amount,
  selectedCountries,
  bankRates,
  selectedToken,
  userSettings,
  numBuyers,
}: PriceSummaryProps) {
  if (!amount || selectedCountries.length === 0) return null;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-3">Price Summary</h3>
      <div className="space-y-4">
        {selectedCountries.map((countryCode) => {
          const bankRate = Number(bankRates[countryCode] || 0);
          const totalPrice = Number(amount) * bankRate;
          
          // Calculate fees based on number of buyers
          const numBuyersValue = Number(numBuyers) || 1;
          const totalFeePercentage = BASE_FEE_PERCENTAGE + (ADDITIONAL_FEE_PER_BUYER * (numBuyersValue - 1));
          const feeAmount = (totalPrice * totalFeePercentage) / 100;
          
          // Calculate gas fee based on number of buyers
          const totalGasFee = BASE_GAS_FEE_USDT + (ADDITIONAL_GAS_FEE_PER_BUYER * (numBuyersValue - 1));
          const finalAmount = totalPrice - feeAmount;
          const currency = getCurrency(countryCode);
          const paymentMethod = userSettings?.paymentMethods?.[countryCode];

          return (
            <div key={countryCode} className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ReactCountryFlag
                  countryCode={countryCode}
                  svg
                  style={{
                    width: '20px',
                    height: '20px'
                  }}
                  className="rounded-sm"
                />
                <span className="text-white font-medium">{paymentMethod?.bankName}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Amount:</span>
                  <span className="font-medium text-white">{amount} {selectedToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    Gas Fee ({BASE_GAS_FEE_USDT} + {(ADDITIONAL_GAS_FEE_PER_BUYER * (numBuyersValue - 1)).toFixed(1)} for {numBuyersValue} buyer{numBuyersValue > 1 ? 's' : ''}):
                  </span>
                  <span className="font-medium text-white">{totalGasFee.toFixed(2)} {selectedToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Total Amount:</span>
                  <span className="font-medium text-white">{(Number(amount) + totalGasFee).toFixed(2)} {selectedToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Rate:</span>
                  <span className="font-medium text-white">{currency} {bankRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Total Price:</span>
                  <span className="font-medium text-white">{currency} {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    Fee ({BASE_FEE_PERCENTAGE}% + {(ADDITIONAL_FEE_PER_BUYER * (numBuyersValue - 1)).toFixed(1)}% for {numBuyersValue} buyer{numBuyersValue > 1 ? 's' : ''}):
                  </span>
                  <span className="font-medium text-white">{currency} {feeAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-600">
                  <span className="text-white">You will receive:</span>
                  <span className="text-white">{currency} {finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
