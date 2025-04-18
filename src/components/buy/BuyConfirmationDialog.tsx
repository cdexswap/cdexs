import { Dialog } from "@headlessui/react";
import Image from "next/image";
import ReactCountryFlag from "react-country-flag";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types/order";
import { getChainIcon, getCurrencyIcon, getCurrency, currencySymbols } from "@/utils/currency";
import { getCountryCodes, calculateCryptoFee, calculateNetCryptoAmount } from "@/utils/order";

interface BuyConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: Order | null;
  buyAmount: string;
  setBuyAmount: (amount: string) => void;
  confirmCurrency: string;
  setConfirmCurrency: (currency: string) => void;
  confirmPayment: string;
  setConfirmPayment: (payment: string) => void;
  isLoading: boolean;
  onConfirm: () => Promise<void>;
  getMaxAmount: (order: Order) => number;
  validateAmount: (amount: string, minAmount: number, maxAmount: number) => boolean;
}

// Function to send notification to seller
const sendNotification = async (orderId: string, sellerId: string, message: string) => {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: sellerId,
        type: 'payment_confirmation',
        message,
        order_id: orderId,
      }),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

const formatNumber = (value: number, decimals: number = 2) => {
  const parts = value.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export default function BuyConfirmationDialog({
  isOpen,
  onClose,
  selectedOrder,
  buyAmount,
  setBuyAmount,
  confirmCurrency,
  setConfirmCurrency,
  setConfirmPayment,
  isLoading,
  onConfirm,
  validateAmount
}: BuyConfirmationDialogProps) {
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [showKycSkipConfirm, setShowKycSkipConfirm] = useState(false);
  const router = useRouter();

  if (!selectedOrder) return null;

  const minAmount = selectedOrder.minBuyAmount || 0;
  const maxAmount = typeof selectedOrder.remainingBalance !== 'undefined' 
    ? selectedOrder.remainingBalance 
    : selectedOrder.amount;
  const cryptoFee = calculateCryptoFee(Number(buyAmount));
  const netCryptoAmount = calculateNetCryptoAmount(Number(buyAmount));

  const getFormattedPrice = (order: Order, currency: string): string => {
    const countryCodes = getCountryCodes(order);
    const matchingCountry = countryCodes.find(code => getCurrency(code) === currency);
    if (matchingCountry && order.rates?.[matchingCountry]) {
      return `${currencySymbols[currency]}${formatNumber(order.rates[matchingCountry])}`;
    }
    // Fallback to first available rate
    const firstCountry = countryCodes[0];
    const firstCurrency = getCurrency(firstCountry);
    if (firstCurrency && order.rates?.[firstCountry]) {
      return `${currencySymbols[firstCurrency]}${formatNumber(order.rates[firstCountry])}`;
    }
    return `฿${formatNumber(order.price || 0)}`;
  };

  const getFormattedTotalPayment = (order: Order, currency: string, amount: string): string => {
    const countryCodes = getCountryCodes(order);
    const matchingCountry = countryCodes.find(code => getCurrency(code) === currency);
    if (matchingCountry && order.rates?.[matchingCountry]) {
      return `${currencySymbols[currency]}${formatNumber(Number(amount) * order.rates[matchingCountry])}`;
    }
    // Fallback to first available rate
    const firstCountry = countryCodes[0];
    const firstCurrency = getCurrency(firstCountry);
    if (firstCurrency && order.rates?.[firstCountry]) {
      return `${currencySymbols[firstCurrency]}${formatNumber(Number(amount) * order.rates[firstCountry])}`;
    }
    return `฿${formatNumber(Number(amount) * (order.price || 0))}`;
  };

  const renderCountryButton = (countryCode: string) => {
    const currency = getCurrency(countryCode);
    return (
      <button
        key={countryCode}
        type="button"
        onClick={() => {
          setConfirmCurrency(currency || 'THB');
          const updatedCountryCodes = getCountryCodes(selectedOrder);
          // Set default payment method based on country
          if (countryCode === 'TH') {
            setConfirmPayment('promptpay');
          } else if (countryCode === 'CN') {
            setConfirmPayment('alipay');
          } else {
            setConfirmPayment('bank');
          }
          // Update the selected order with the new country codes
          selectedOrder.countryCodes = updatedCountryCodes.join(',');
        }}
        className={`flex flex-col items-center p-2 border rounded-lg transition-colors ${
          currency === confirmCurrency 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{
            width: '28px',
            height: '28px'
          }}
          className="rounded-sm mb-1"
        />
        <span className="text-sm font-medium text-gray-900">
          {currency}
        </span>
      </button>
    );
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="px-4 sm:px-6 pt-4">
              <Dialog.Title className="text-2xl font-bold text-gray-900 text-center">
                Confirm Purchase
              </Dialog.Title>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Chain Information */}
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Image
                  src={getChainIcon(selectedOrder.chain)}
                  alt={selectedOrder.chain}
                  width={32}
                  height={32}
                />
                <span className="text-lg">{selectedOrder.chain}</span>
              </div>
              
              {/* Amount Input Section */}
              <div className="bg-white rounded-lg">
                <div className="mb-3">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Amount to Buy
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Image
                        src={getCurrencyIcon(selectedOrder.currency, selectedOrder.chain)}
                        alt={selectedOrder.currency}
                        width={24}
                        height={24}
                      />
                    </div>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = Number(value);
                        
                        if (numericValue < minAmount) {
                          setBuyAmount(minAmount.toFixed(4));
                        } else if (numericValue > maxAmount) {
                          setBuyAmount(maxAmount.toFixed(4));
                        } else {
                          setBuyAmount(value);
                        }
                      }}
                      step="0.0001"
                      min={minAmount}
                      max={maxAmount}
                      className="block w-full pl-12 pr-16 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-gray-900"
                      placeholder="0.0000"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-900 font-medium">
                        {selectedOrder.currency}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Minimum:</span>
                      <span className="text-gray-900 font-medium ml-1">
                        {formatNumber(minAmount, 4)} {selectedOrder.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Maximum:</span>
                      <span className="text-gray-900 font-medium ml-1">
                        {formatNumber(maxAmount, 4)} {selectedOrder.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crypto Fee Details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Network Fee (3%)</span>
                    <span className="text-gray-700">
                      -{formatNumber(cryptoFee, 4)} {selectedOrder.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-700 font-medium">You Receive</span>
                    <span className="text-green-600 font-semibold">
                      {formatNumber(netCryptoAmount, 4)} {selectedOrder.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Country Selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Country
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {getCountryCodes(selectedOrder).map(renderCountryButton)}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price per {selectedOrder.currency}</span>
                  <span className="text-gray-900 font-semibold text-lg">
                    {getFormattedPrice(selectedOrder, confirmCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Payment</span>
                  <span className="text-blue-600 font-bold text-2xl">
                    {getFormattedTotalPayment(selectedOrder, confirmCurrency, buyAmount)}
                  </span>
                </div>
              </div>

              {/* Policy Agreement */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5">
                    <input
                      id="policy"
                      type="checkbox"
                      checked={isPolicyAccepted}
                      onChange={(e) => setIsPolicyAccepted(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="policy" className="text-gray-700">
                      Cdexs connects buyers and sellers for crypto and fiat exchange. Users must ensure their funds are legal, transparent, and accept all risks.<button
                        type="button"
                        onClick={() => setIsPolicyDialogOpen(true)}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Read more...
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-xl flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors order-2 sm:order-1"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors order-1 sm:order-2"
                onClick={() => setShowKycDialog(true)}
                disabled={isLoading || !buyAmount || !validateAmount(buyAmount, minAmount, maxAmount) || !isPolicyAccepted || Number(buyAmount) === 0}
              >
                {isLoading ? "Processing..." : "Confirm Purchase"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* KYC Dialog */}
      <Dialog
        open={showKycDialog}
        onClose={() => setShowKycDialog(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="px-6 pt-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Complete KYC Verification
              </Dialog.Title>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Would you like to complete KYC verification? This helps ensure secure and compliant transactions.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    setShowKycDialog(false);
                    router.push('/cdx/kyc');
                  }}
                >
                  Complete KYC
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowKycSkipConfirm(true);
                  }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog
        open={isPolicyDialogOpen}
        onClose={() => setIsPolicyDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="px-4 sm:px-6 pt-4">
              <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-900">
                Verification and Transaction Responsibility Policy
              </Dialog.Title>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-gray-700 text-sm sm:text-base">
              <p>
                Cdexs serves solely as a platform to connect buyers and sellers for cryptocurrency and fiat currency exchange. The platform is not responsible for the accuracy, legality, or integrity of any transactions conducted through it.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">User Requirements:</h3>
                
                <div>
                  <h4 className="font-medium text-gray-900">Transparency and Legality:</h4>
                  <p>Users must certify that their funds or assets used for transactions are transparent, legal, and free from any involvement in unlawful activities.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Buyer and Seller Responsibility:</h4>
                  <p>Users are solely responsible for all transactions they undertake and accept all associated risks. Cdexs is not liable for any losses or damages arising from these transactions.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Compliance with Laws:</h4>
                  <p>Users must comply with all applicable laws and regulations, including tax reporting and obligations in their respective jurisdictions.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Identity Verification:</h4>
                  <p>Users are required to complete identity verification processes to ensure compliance with the platform&apos;s terms and conditions.</p>
                </div>
              </div>

              <p>
                By using the Cdexs platform, you agree to this policy and confirm adherence to all specified terms. Cdexs reserves the right to suspend or terminate access in the event of policy violations.
              </p>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => setIsPolicyDialogOpen(false)}
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* KYC Skip Confirmation Dialog */}
      <Dialog
        open={showKycSkipConfirm}
        onClose={() => setShowKycSkipConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="px-6 pt-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Confirm Skip KYC
              </Dialog.Title>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Are you sure you want to proceed with the purchase without KYC verification?
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  onClick={async () => {
                    setShowKycSkipConfirm(false);
                    setShowKycDialog(false);
                    if (selectedOrder) {
                      await sendNotification(
                        selectedOrder.order_id,
                        selectedOrder.user_id,
                        `Buyer has confirmed payment of ${getFormattedTotalPayment(selectedOrder, confirmCurrency, buyAmount)} for order #${selectedOrder.order_id}`
                      );
                    }
                    await onConfirm();
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  onClick={() => setShowKycSkipConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
