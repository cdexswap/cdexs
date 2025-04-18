'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import ReactCountryFlag from 'react-country-flag';
import { SUPPORTED_COUNTRIES, CountryCode, MobileButtonType } from '@/lib/models/settings';

const BANKS_BY_COUNTRY: Record<CountryCode, string[]> = {
  TH: ['Kasikorn Bank', 'Bangkok Bank', 'Siam Commercial Bank', 'Krungthai Bank'],
  LA: ['BCEL', 'Lao Development Bank', 'Phongsavanh Bank'],
  MY: ['Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank'],
  VN: ['Vietcombank', 'VietinBank', 'BIDV', 'Agribank'],
  CN: ['Bank of China', 'ICBC', 'China Construction Bank', 'Agricultural Bank of China']
};

const countryToPhonePrefix: Record<CountryCode, string> = {
  TH: '+66',
  LA: '+856',
  MY: '+60',
  VN: '+84',
  CN: '+86'
};

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
  mobileButton: MobileButtonType;
}

// @ts-expect-error - Component uses complex state management with dynamic country codes
export default function SettingsModal(): JSX.Element {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [showAllSelected, setShowAllSelected] = useState(false);
  const [settings, setSettings] = useState<UserSettings & { isDefault?: boolean }>({
    name: '',
    supportedCountries: [],
    paymentMethods: {},
    shopOpened: false,
    mobileButton: 'notifications'
  });
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeCountry, setActiveCountry] = useState<CountryCode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = Object.entries(SUPPORTED_COUNTRIES).filter(([, name]: [string, string]) => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  ) as [CountryCode, string][];

  const toggleCountry = (countryCode: CountryCode): void => {
    setSettings((prev: UserSettings) => {
      const isCurrentlySupported = prev.supportedCountries.includes(countryCode);
      const newSupportedCountries = isCurrentlySupported
        ? prev.supportedCountries.filter((code: CountryCode) => code !== countryCode)
        : [...prev.supportedCountries, countryCode];
      
      const newPaymentMethods = { ...prev.paymentMethods };
      if (!isCurrentlySupported) {
        newPaymentMethods[countryCode] = {
          phone: countryToPhonePrefix[countryCode],
          bankName: '',
          bankAccount: '',
          bankAccountName: ''
        };
        setActiveCountry(countryCode);
      } else {
        delete newPaymentMethods[countryCode];
        setActiveCountry(prev.supportedCountries[0] === countryCode ? prev.supportedCountries[1] || null : prev.supportedCountries[0] || null);
      }

      return {
        ...prev,
        supportedCountries: newSupportedCountries,
        paymentMethods: newPaymentMethods
      };
    });
  };

  const updatePaymentMethod = (country: CountryCode, field: keyof PaymentMethod, value: string): void => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [country]: {
          ...prev.paymentMethods[country],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      const dataToSend = {
        wallet: address,
        ...settings
      };
      console.log('Submitting settings data:', dataToSend);
      
      const response = await fetch(`/api/settings?wallet=${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (response.ok) {
        alert('Settings saved successfully');
        setIsOpen(false);
      } else {
        alert(`Error saving settings: ${responseData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleDeleteShop = async (): Promise<void> => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      const response = await fetch(`/api/settings?wallet=${address}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();
      console.log('Delete response:', responseData);

      if (response.ok) {
        alert('Shop data deleted successfully');
        setIsOpen(false);
        // Reset settings to default
        setSettings({
          name: '',
          supportedCountries: [],
          paymentMethods: {},
          shopOpened: false,
          mobileButton: 'notifications',
          isDefault: true
        });
      } else {
        alert(`Error deleting shop data: ${responseData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error deleting shop data:', error);
      alert('Error deleting shop data. Please try again.');
    }
    
    setIsDeleteConfirmOpen(false);
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (address) {
        try {
          const response = await fetch(`/api/settings?wallet=${address}`);
          if (response.ok) {
            const data = await response.json();
            setSettings(data);
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }
      }
    };
    
    fetchUserSettings();
  }, [address]);

  // Check for openSettings query parameter
  useEffect(() => {
    if (address && searchParams.get('openSettings') === 'true') {
      setIsOpen(true);
    }
  }, [address, searchParams]);

  const handleOpen = async (): Promise<void> => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    setIsOpen(true);
    setShowAllSelected(false);
  };

  const handleCountrySelect = (code: CountryCode): void => {
    setActiveCountry(code);
    setShowAllSelected(false);
  };

  return (
    <>
      {/* Settings Button */}
      <div className="fixed bottom-6 right-0 z-[150]">
        {(!address || (address && settings.isDefault)) && (
          <div className="absolute -top-12 right-0 bg-blue-600 text-white text-sm py-2 px-4 rounded-lg shadow-lg whitespace-nowrap">
            <div className="absolute -bottom-2 right-5 w-3 h-3 bg-blue-600 rotate-45"></div>
            Open your shop here
          </div>
        )}
        <button
          data-tutorial="settings"
          onClick={handleOpen}
        className={`relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${
            !address || (address && settings.isDefault) ? 'animate-pulse' : ''
          } right-2`}
        >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
          />
        </svg>
        {(!address || (address && settings.isDefault)) && (
          <span className="absolute -top-1 -right-1 w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        </button>
      </div>

      {/* Settings Modal */}
      {isOpen && address && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-800 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-100">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

{settings.isDefault && (
  <div className="absolute inset-0 flex items-center justify-center z-10">
    <div className="bg-gray-900 p-8 rounded-lg shadow-xl border border-gray-700 w-[90%] max-w-sm relative">
      <button
        onClick={() => setSettings({...settings, isDefault: false})}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <h3 className="text-xl font-semibold text-gray-100 mb-4 text-center">Welcome to P2P!</h3>
                  <p className="text-gray-300 mb-6 text-center">Before you can start using the platform, please accept our terms and policies.</p>
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5">
                        <input
                          id="policy"
                          type="checkbox"
                          checked={acceptedPolicy}
                          onChange={(e) => setAcceptedPolicy(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                      </div>
                      <div className="text-sm">
                        <label htmlFor="policy" className="text-gray-300">
                          Cdexs connects buyers and sellers for crypto and fiat exchange. Users must ensure their funds are legal, transparent, and accept all risks.
                          <button
                            type="button"
                            onClick={() => setIsPolicyDialogOpen(true)}
                            className="ml-1 text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Read more...
                          </button>
                        </label>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (acceptedPolicy) {
                        try {
                          const response = await fetch(`/api/settings?wallet=${address}`);
                          if (response.ok) {
                            const data = await response.json();
                            setSettings({
                              ...data,
                              isDefault: false
                            });
                          }
                        } catch (error) {
                          console.error('Error opening shop:', error);
                          alert('Failed to open shop. Please try again.');
                        }
                      }
                    }}
                    disabled={!acceptedPolicy}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      acceptedPolicy
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Open Shop
                  </button>
                </div>
              </div>
            )}

            {/* Policy Dialog */}
            {isPolicyDialogOpen && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[160]">
                <div className="bg-gray-900 rounded-xl w-full max-w-2xl mx-4 shadow-2xl border border-gray-700">
                  <div className="px-6 pt-4">
                    <h2 className="text-2xl font-bold text-gray-100">
                      Verification and Transaction Responsibility Policy
                    </h2>
                  </div>

                  <div className="p-6 space-y-4 text-gray-300">
                    <p>
                      Cdexs serves solely as a platform to connect buyers and sellers for cryptocurrency and fiat currency exchange. The platform is not responsible for the accuracy, legality, or integrity of any transactions conducted through it.
                    </p>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-100">User Requirements:</h3>
                      
                      <div>
                        <h4 className="font-medium text-gray-100">Transparency and Legality:</h4>
                        <p>Users must certify that their funds or assets used for transactions are transparent, legal, and free from any involvement in unlawful activities.</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-100">Buyer and Seller Responsibility:</h4>
                        <p>Users are solely responsible for all transactions they undertake and accept all associated risks. Cdexs is not liable for any losses or damages arising from these transactions.</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-100">Compliance with Laws:</h4>
                        <p>Users must comply with all applicable laws and regulations, including tax reporting and obligations in their respective jurisdictions.</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-100">Identity Verification:</h4>
                        <p>Users are required to complete identity verification processes to ensure compliance with the platform&apos;s terms and conditions.</p>
                      </div>
                    </div>

                    <p>
                      By using the Cdexs platform, you agree to this policy and confirm adherence to all specified terms. Cdexs reserves the right to suspend or terminate access in the event of policy violations.
                    </p>
                  </div>

                  <div className="px-6 py-4 bg-gray-800 rounded-b-xl flex justify-end">
                    <button
                      type="button"
                      className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                      onClick={() => setIsPolicyDialogOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, name: e.target.value})}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Selected Countries Display */}
              {settings.supportedCountries.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <label className="text-sm font-medium text-gray-300">
                    Selected:
                  </label>
                  <div className="flex items-center gap-2">
                    {settings.supportedCountries.slice(0, 3).map((code: CountryCode) => (
                      <div
                        key={code}
                        onClick={() => handleCountrySelect(code)}
                        className={`flex items-center bg-gray-800 rounded-full pl-1 pr-2 py-0.5 cursor-pointer ${
                          activeCountry === code ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <ReactCountryFlag
                          countryCode={code}
                          svg
                          style={{
                            width: '16px',
                            height: '16px'
                          }}
                          className="rounded-sm"
                          title={SUPPORTED_COUNTRIES[code]}
                        />
                        <span className="text-xs text-gray-300 ml-1">{code}</span>
                        <button
                          type="button"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            toggleCountry(code);
                          }}
                          className="ml-1 text-gray-400 hover:text-gray-300"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {settings.supportedCountries.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllSelected(true)}
                        className="bg-gray-800 text-xs text-gray-300 rounded-full px-2 py-1 hover:bg-gray-700"
                      >
                        +{settings.supportedCountries.length - 3}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* All Selected Countries Modal */}
              {showAllSelected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg p-4 w-full max-w-sm mx-4 border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-100">Selected Countries</h3>
                      <button
                        onClick={() => setShowAllSelected(false)}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {settings.supportedCountries.map((code: CountryCode) => (
                        <div
                          key={code}
                          onClick={() => {
                            handleCountrySelect(code);
                            setShowAllSelected(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                            activeCountry === code
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                          }`}
                        >
                          <ReactCountryFlag
                            countryCode={code}
                            svg
                            style={{
                              width: '20px',
                              height: '20px'
                            }}
                            className="rounded-sm"
                            title={SUPPORTED_COUNTRIES[code]}
                          />
                          <span className="text-sm text-gray-300">{SUPPORTED_COUNTRIES[code]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Country Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Select Countries
                  </label>
                  <div className="relative w-48">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      placeholder="Search countries..."
                      className="w-full p-1.5 pl-7 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg 
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6">
                  {filteredCountries.map(([code, name]) => {
                    const isSelected = settings.supportedCountries.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleCountry(code)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/20 hover:bg-blue-500/30'
                            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                        }`}
                      >
                        <ReactCountryFlag
                          countryCode={code}
                          svg
                          style={{
                            width: '24px',
                            height: '24px'
                          }}
                          className="rounded-sm"
                          title={name}
                        />
                        <span className="text-sm text-gray-300">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Details */}
              {activeCountry && settings.paymentMethods[activeCountry] && (
                <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ReactCountryFlag
                      countryCode={activeCountry}
                      svg
                      style={{
                        width: '24px',
                        height: '24px'
                      }}
                      className="rounded-sm"
                      title={SUPPORTED_COUNTRIES[activeCountry]}
                    />
                    <h3 className="text-lg font-medium text-gray-200">
                      {SUPPORTED_COUNTRIES[activeCountry]} Payment Details
                    </h3>
                  </div>
                  
                  {/* Phone Input */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {countryToPhonePrefix[activeCountry]}
                        </span>
                        <input
                          type="tel"
                          value={settings.paymentMethods[activeCountry]?.phone?.replace(countryToPhonePrefix[activeCountry], '') || ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            // Remove all non-digits
                            let value = e.target.value.replace(/\D/g, '');
                            
                            // Get max length based on country
                            const maxLength = {
                              TH: 9, // Thailand: 9 digits after prefix
                              LA: 8, // Laos: 8 digits after prefix
                              MY: 9, // Malaysia: 9 digits after prefix
                              VN: 9, // Vietnam: 9 digits after prefix
                              CN: 11 // China: 11 digits after prefix
                            }[activeCountry];
                            
                            // Limit to country-specific length
                            value = value.slice(0, maxLength);
                            
                            // Format based on country
                            if (value.length > 0) {
                              let formatted = value;
                              if (activeCountry === 'TH') {
                                // Thailand: XX-XXXX-XXXX
                                if (value.length > 2) {
                                  formatted = value.slice(0, 2) + '-' + value.slice(2);
                                }
                                if (value.length > 6) {
                                  formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
                                }
                              } else if (activeCountry === 'CN') {
                                // China: XXX-XXXX-XXXX
                                if (value.length > 3) {
                                  formatted = value.slice(0, 3) + '-' + value.slice(3);
                                }
                                if (value.length > 7) {
                                  formatted = formatted.slice(0, 8) + '-' + formatted.slice(8);
                                }
                              } else {
                                // Other countries: XXX-XXX-XXX(X)
                                if (value.length > 3) {
                                  formatted = value.slice(0, 3) + '-' + value.slice(3);
                                }
                                if (value.length > 6) {
                                  formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
                                }
                              }
                              value = formatted;
                            }

                            updatePaymentMethod(
                              activeCountry,
                              'phone',
                              `${countryToPhonePrefix[activeCountry]}${value}`
                            );
                          }}
                          maxLength={14} // Max 11 digits + 2 hyphens
                          className="w-full p-2 pl-16 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    {/* Bank Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bank Name
                      </label>
                      <select
                        value={settings.paymentMethods[activeCountry]?.bankName || ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => updatePaymentMethod(activeCountry, 'bankName', e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Bank</option>
                        {BANKS_BY_COUNTRY[activeCountry].map((bank: string) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                        <option value="Other">Other (Custom)</option>
                      </select>
                      
                      {settings.paymentMethods[activeCountry]?.bankName === 'Other' && (
                        <input
                          type="text"
                          value={settings.paymentMethods[activeCountry]?.customBankName || ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updatePaymentMethod(activeCountry, 'customBankName', e.target.value)}
                          className="w-full p-2 mt-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter custom bank name"
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Bank Account Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bank Account Name
                      </label>
                      <input
                        type="text"
                        value={settings.paymentMethods[activeCountry]?.bankAccountName || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updatePaymentMethod(activeCountry, 'bankAccountName', e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Account holder name"
                        required
                      />
                    </div>

                    {/* Account Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={settings.paymentMethods[activeCountry]?.bankAccount || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updatePaymentMethod(activeCountry, 'bankAccount', e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Account number"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium"
                >
                  Save Settings
                </button>
                
                {!settings.isDefault && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300 font-medium"
                  >
                    Delete Shop Data
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[160]">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-100">Confirm Deletion</h3>
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete your shop data? This action cannot be undone.
              </p>
              <p className="text-gray-300 mb-4">
                All your shop settings including payment methods and country preferences will be permanently removed from our database.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteShop}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
