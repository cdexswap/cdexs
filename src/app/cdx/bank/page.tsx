"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import ReactCountryFlag from 'react-country-flag';
import { SUPPORTED_COUNTRIES, CountryCode } from '@/lib/models/settings';

interface PaymentMethod {
  phone: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  customBankName?: string;
}

interface UserSettings {
  name: string;
  supportedCountries: CountryCode[];
  paymentMethods: {
    [key in CountryCode]?: PaymentMethod;
  };
  shopOpened: boolean;
  isDefault?: boolean;
}

export default function BankPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/settings?wallet=${address}`);
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          setError('Failed to load bank accounts');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Error loading bank accounts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [address]);

  // Get all bank accounts from all countries
  const bankAccounts = settings && !settings.isDefault
    ? Object.entries(settings.paymentMethods)
        .filter(([_, paymentMethod]) => 
          paymentMethod.bankName && paymentMethod.bankAccount && paymentMethod.bankAccountName
        )
        .map(([countryCode, paymentMethod]) => ({
          country: countryCode as CountryCode,
          bankName: paymentMethod.bankName === 'Other' 
            ? paymentMethod.customBankName || 'Other Bank'
            : paymentMethod.bankName,
          bankAccount: paymentMethod.bankAccount,
          bankAccountName: paymentMethod.bankAccountName
        }))
    : [];

  const handleAddBankAccount = () => {
    // Open settings modal by redirecting to home page
    router.push('/?openSettings=true');
  };

  if (!address) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-100 mb-6">Bank Accounts</h1>
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6 text-center">
          <p className="text-gray-300 mb-4">Please connect your wallet to view your bank accounts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-100 mb-6">Bank Accounts</h1>
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6 text-center">
          <p className="text-gray-300">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-100 mb-6">Bank Accounts</h1>
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">Bank Accounts</h1>
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow p-6">
        <div className="space-y-4">
          {bankAccounts.length > 0 ? (
            bankAccounts.map((account, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ReactCountryFlag
                        countryCode={account.country}
                        svg
                        style={{
                          width: '20px',
                          height: '20px'
                        }}
                        className="rounded-sm"
                        title={SUPPORTED_COUNTRIES[account.country]}
                      />
                      <h3 className="text-lg font-medium text-gray-300">{account.bankName}</h3>
                    </div>
                    <p className="text-gray-400">{account.bankAccount}</p>
                    <p className="text-sm text-gray-500">Account Name: {account.bankAccountName}</p>
                  </div>
                  <span className="px-3 py-1 text-sm text-green-400 bg-green-400/10 rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">You don't have any bank accounts set up yet.</p>
            </div>
          )}

          {/* Add new bank account button */}
          <button 
            onClick={handleAddBankAccount}
            className="w-full py-3 px-4 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          >
            + Add Bank Account
          </button>
        </div>
      </div>
    </div>
  );
}
