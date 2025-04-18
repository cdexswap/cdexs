import ReactCountryFlag from 'react-country-flag';
import TokenPrice from '@/components/TokenPrice';
import { ChainMetadata } from '@/lib/config/chains';

interface PaymentMethod {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

interface UserSettings {
  supportedCountries?: string[];
  paymentMethods?: Record<string, PaymentMethod>;
}

interface BankAccountSelectionProps {
  userSettings: UserSettings | null;
  selectedCountries: string[];
  setSelectedCountries: (countries: string[] | ((prev: string[]) => string[])) => void;
  bankRates: Record<string, string>;
  setBankRates: (rates: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  minBuyAmount: Record<string, string>;
  setMinBuyAmount: (amounts: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  selectedToken: string;
  chainMetadata: ChainMetadata;
}

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

export default function BankAccountSelection({
  userSettings,
  selectedCountries,
  setSelectedCountries,
  bankRates,
  setBankRates,
  minBuyAmount,
  setMinBuyAmount,
  selectedToken,
  chainMetadata,
}: BankAccountSelectionProps) {
  return (
    <div className="p-4 sm:p-6">
      <label className="block text-base sm:text-lg font-bold text-white mb-2">
        Bank Accounts and Rates
      </label>
      <div className="space-y-4 sm:space-y-6">
        {userSettings?.supportedCountries?.map((countryCode: string) => {
          const paymentMethod = userSettings?.paymentMethods?.[countryCode];
          if (!paymentMethod?.bankName) return null;
          
          return (
            <div 
              key={countryCode}
              className={`p-3 sm:p-4 rounded-lg border transition-all ${
                selectedCountries.includes(countryCode)
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(countryCode)}
                    onChange={() => {
                      setSelectedCountries((prev: string[]) => 
                        prev.includes(countryCode)
                          ? prev.filter((c: string) => c !== countryCode)
                          : [...prev, countryCode]
                      );
                    }}
                    className="h-5 w-5 sm:h-4 sm:w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <ReactCountryFlag
                    countryCode={countryCode}
                    svg
                    style={{ width: '20px', height: '20px' }}
                    className="rounded-sm"
                  />
                  <span className="text-white text-sm sm:text-base font-medium">{paymentMethod.bankName}</span>
                </div>
                {selectedCountries.includes(countryCode) && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <TokenPrice 
                        token={selectedToken}
                        chain={chainMetadata.name}
                        amount=""
                        countryCode={countryCode}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Rate"
                          className="w-full sm:w-24 px-2 py-1 text-sm rounded-md border-gray-300 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                          value={bankRates[countryCode] || ''}
                          onChange={(e) => {
                            setBankRates((prev: Record<string, string>) => ({
                              ...prev,
                              [countryCode]: e.target.value
                            }));
                          }}
                        />
                        <span className="text-white text-sm">{getCurrency(countryCode)} per {selectedToken}</span>
                      </div>
                    </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="number"
                        placeholder="Min Buy"
                          className="w-full sm:w-24 px-2 py-1 text-sm rounded-md border-gray-300 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                        value={minBuyAmount[countryCode] || ''}
                        onChange={(e) => {
                          setMinBuyAmount((prev: Record<string, string>) => ({
                            ...prev,
                            [countryCode]: e.target.value
                          }));
                        }}
                      />
                      <span className="text-white text-sm">{selectedToken}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400 ml-8 sm:ml-11">
                <div>Account Name: {paymentMethod.bankAccountName}</div>
                <div>Account Number: {paymentMethod.bankAccount}</div>
                <div>Bank: {paymentMethod.bankName}</div>
              </div>
            </div>
          );
        })}
        {(!userSettings?.supportedCountries?.length || !userSettings?.supportedCountries?.some((code: string) => userSettings?.paymentMethods?.[code]?.bankName)) && (
          <div className="text-gray-400 text-sm">
            Please add your bank account details in Settings first
          </div>
        )}
      </div>
    </div>
  );
}
