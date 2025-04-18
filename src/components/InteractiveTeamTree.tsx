import type React from 'react';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, Calendar, UserPlus } from 'lucide-react';
import { useAccount } from 'wagmi';

interface TreeProps {
  isVip?: boolean;
  type: 'buy' | 'sell';
}

interface ReferralUser {
  user: string;
  transactions: number;
  earnings: number;
  joinDate: string;
}

interface Transaction {
  buyer_id: string;
  seller_id: string;
  amount: number;
  fees?: {
    buyer_referrer_commission?: number;
    seller_referrer_commission?: number;
  };
}

interface ApiUser {
  username: string;
  wallet_address: string;
  created_at: string;
}

interface ReferralSummary {
  referredBuyers: number;
  buyTransactions: number;
  earningsBuyers: number;
  referredSellers: number;
  sellTransactions: number;
  earningsSellers: number;
}

const InteractiveTeamTree: React.FC<TreeProps> = ({ type }) => {
  const { address } = useAccount();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyerData, setBuyerData] = useState<ReferralUser[]>([]);
  const [sellerData, setSellerData] = useState<ReferralUser[]>([]);
  const [summary, setSummary] = useState<ReferralSummary>({
    referredBuyers: 0,
    buyTransactions: 0,
    earningsBuyers: 0,
    referredSellers: 0,
    sellTransactions: 0,
    earningsSellers: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasReferralData, setHasReferralData] = useState(false);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const registerUser = async () => {
    if (!address) return;

    try {
      setIsRegistering(true);
      setError(null);

      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      const username = `user_${shortAddress}`;

      const checkResponse = await fetch('/api/users/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          wallet_type: 'evm'
        }),
      });

      if (!checkResponse.ok) {
        const registerResponse = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: address,
            username,
            wallet_type: 'evm'
          }),
        });

        if (!registerResponse.ok) {
          throw new Error('Failed to register user');
        }
      }

      await fetchReferralData();

    } catch (error) {
      console.error('Error registering user:', error);
      setError('Failed to register. Please try again later.');
    } finally {
      setIsRegistering(false);
    }
  };

  const fetchReferralData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching referral data for:', address);

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`/api/referral?walletAddress=${address}`);

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          setBuyerData([]);
          setSellerData([]);
          setSummary({
            referredBuyers: 0,
            buyTransactions: 0,
            earningsBuyers: 0,
            referredSellers: 0,
            sellTransactions: 0,
            earningsSellers: 0,
          });
          setHasReferralData(false);
          setLoading(false);
          return;
        }

        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Referral data received:', data);

      if (!data.referral || !data.user.referral_code) {
        console.warn('No referral code found:', data);
        setHasReferralData(false);
        setBuyerData([]);
        setSellerData([]);
        return;
      }

      setHasReferralData(true);

      const buyReferrals = data.referral.buyReferrals || [];
      const buyTransactions = data.referral.buyTransactions || [];

      const buyers = buyReferrals.map((user: ApiUser) => ({
        user: user.username,
        transactions: buyTransactions
          .filter((tx: Transaction) => tx.buyer_id === user.wallet_address)
          .reduce((sum: number, tx: Transaction) => sum + 1, 0),
        earnings: buyTransactions
          .filter((tx: Transaction) => tx.buyer_id === user.wallet_address)
          .reduce((sum: number, tx: Transaction) => sum + (tx.fees?.buyer_referrer_commission || 0), 0),
        joinDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'Unknown'
      }));

      const sellReferrals = data.referral.sellReferrals || [];
      const sellTransactions = data.referral.sellTransactions || [];

      const sellers = sellReferrals.map((user: ApiUser) => ({
        user: user.username,
        transactions: sellTransactions
          .filter((tx: Transaction) => tx.seller_id === user.wallet_address)
          .reduce((sum: number, tx: Transaction) => sum + 1, 0),
        earnings: sellTransactions
          .filter((tx: Transaction) => tx.seller_id === user.wallet_address)
          .reduce((sum: number, tx: Transaction) => sum + (tx.fees?.seller_referrer_commission || 0), 0),
        joinDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'Unknown'
      }));

      setBuyerData(buyers);
      setSellerData(sellers);

      setSummary({
        referredBuyers: buyers.length,
        buyTransactions: data.referral.buyerSummary?.buyTransactions || 0,
        earningsBuyers: data.referral.buyerSummary?.earningsBuyers || 0,
        referredSellers: sellers.length,
        sellTransactions: data.referral.sellerSummary?.sellTransactions || 0,
        earningsSellers: data.referral.sellerSummary?.earningsSellers || 0,
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');

      setBuyerData([]);
      setSellerData([]);
      setHasReferralData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    fetchReferralData();
  }, [address]);

  const filteredBuyers = buyerData.filter((b) => {
    const matchUser = b.user.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchDate = dateFilter ? b.joinDate === formatDate(dateFilter) : true;
    return matchUser && matchDate;
  });

  const filteredSellers = sellerData.filter((s) => {
    const matchUser = s.user.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchDate = dateFilter ? s.joinDate === formatDate(dateFilter) : true;
    return matchUser && matchDate;
  });


  if (!loading && !hasReferralData && !error) {
    return (
      <div className="p-4">
        <div className="bg-blue-900/60 backdrop-blur-lg border border-blue-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Join the Referral Program</h2>
          <p className="mb-6">Generate your referral code to start earning commissions when your friends trade.</p>
          <button
            onClick={registerUser}
            disabled={isRegistering}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            {isRegistering ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                Registering...
              </>
            ) : (
              <>
                <UserPlus size={20} className="mr-2" />
                Create Referral Code
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/60 backdrop-blur-lg border border-red-800 rounded-lg p-6 text-center">
          <p className="text-white mb-4">Error loading referral data:</p>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchReferralData}
            className="mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      ) : type === 'buy' ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Buyer Referral Dashboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Referred Buyers</p>
              <h3 className="text-2xl font-bold text-white">
                {summary.referredBuyers} Buyers
              </h3>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">SF Buy Transactions</p>
              <h3 className="text-2xl font-bold text-white">
                {summary.buyTransactions.toLocaleString()}
              </h3>
            </div>
            <div className="bg-purple-600 rounded-lg p-4 flex flex-col justify-center">
              <p className="text-white text-sm">Earnings from Buyers</p>
              <h3 className="text-2xl font-bold text-white">
                ฿{summary.earningsBuyers.toLocaleString()}
              </h3>
            </div>
          </div>

          {/* Search & Date Picker */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative w-full sm:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search user..."
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-1/2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <DatePicker
                selected={dateFilter}
                onChange={(date: Date | null) => setDateFilter(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">User</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Transactions</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Earnings</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredBuyers.map((buyer) => (
                  <tr key={buyer.user}>
                    <td className="px-6 py-4">{buyer.user}</td>
                    <td className="px-6 py-4 text-right">{buyer.transactions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">฿{buyer.earnings.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{buyer.joinDate}</td>
                  </tr>
                ))}
                {filteredBuyers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No buyers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Seller Referral Dashboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Referred Sellers</p>
              <h3 className="text-2xl font-bold text-white">
                {summary.referredSellers} Sellers
              </h3>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Sell Transactions</p>
              <h3 className="text-2xl font-bold text-white">
                {summary.sellTransactions.toLocaleString()}
              </h3>
            </div>
            <div className="bg-purple-600 rounded-lg p-4 flex flex-col justify-center">
              <p className="text-white text-sm">Earnings from Sellers</p>
              <h3 className="text-2xl font-bold text-white">
                ฿{summary.earningsSellers.toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative w-full sm:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search user..."
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-1/2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <DatePicker
                selected={dateFilter}
                onChange={(date: Date | null) => setDateFilter(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">User</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Transactions</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Earnings</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSellers.map((seller) => (
                  <tr key={seller.user}>
                    <td className="px-6 py-4">{seller.user}</td>
                    <td className="px-6 py-4 text-right">{seller.transactions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">฿{seller.earnings.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{seller.joinDate}</td>
                  </tr>
                ))}
                {filteredSellers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No sellers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTeamTree;
