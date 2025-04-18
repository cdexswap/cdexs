'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import InteractiveTeamTree from '../../components/InteractiveTeamTree';
import { Tooltip } from 'react-tooltip';
import { Clipboard, Check, UserPlus } from 'lucide-react';
import { VIPDashboard } from '../../components/VIPDashboard';
import { Card } from '../../components/ui/card';

export default function ReferralPage() {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [teamType, setTeamType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [userStats, setUserStats] = useState({
    totalEarnings: 0,
    totalFriends: 0
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [commissionStats, setCommissionStats] = useState({
    totalEarnings: 0,
    buyerCommission: 0,
    sellerCommission: 0,
    vipBonus: 0
  });

  const registerUser = async () => {
    if (!address) return;

    try {
      setIsRegistering(true);

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

        const data = await registerResponse.json();
        console.log('Registration successful:', data);

        if (data.referral) {
          setReferralLink(data.referral.referralLink || '');
          setQrCode(data.referral.qrCode || '');
        }
      }

      await fetchReferralData();

    } catch (error) {
      console.error('Error registering user:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const fetchReferralData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log('Fetching referral data for:', address);

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`/api/referral?walletAddress=${address}`);

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('User not found, showing empty data');
          setReferralLink('');
          setQrCode('');
          setUserStats({
            totalEarnings: 0,
            totalFriends: 0
          });
          setLoading(false);
          return;
        }

        throw new Error('Failed to fetch referral data');
      }

      const data = await response.json();
      console.log('Referral data received:', data);

      if (data.referral) {
        setReferralLink(data.referral.referralLink || '');
        setQrCode(data.referral.qrCode || '');

        const buyReferrals = data.referral.buyReferrals || [];
        const sellReferrals = data.referral.sellReferrals || [];

        const allWalletAddresses = new Set();
        buyReferrals.forEach((user: { wallet_address: string }) => allWalletAddresses.add(user.wallet_address));
        sellReferrals.forEach((user: { wallet_address: string }) => allWalletAddresses.add(user.wallet_address));

        const totalFriends = allWalletAddresses.size;

        const totalEarnings =
          (data.referral.buyerSummary?.earningsBuyers || 0) +
          (data.referral.sellerSummary?.earningsSellers || 0);

        setUserStats({
          totalEarnings,
          totalFriends
        });

        console.log('Buyer referrals:', buyReferrals.length);
        console.log('Seller referrals:', sellReferrals.length);
        console.log('Unique friends count:', totalFriends);
      } else {
        console.warn('Unexpected data structure:', data);
        setReferralLink('');
        setQrCode('');
        setUserStats({
          totalEarnings: 0,
          totalFriends: 0
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVIPData = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/vip/status?walletAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setIsVIP(data.isVIP);
        setHasTeam(data.hasTeam);
        setTeamData(data.teamData);
        setCommissionStats({
          totalEarnings: data.totalEarnings || 0,
          buyerCommission: data.buyerCommission || 0,
          sellerCommission: data.sellerCommission || 0,
          vipBonus: data.vipBonus || 0
        });
      }
    } catch (error) {
      console.error('Error fetching VIP data:', error);
    }
  };

  useEffect(() => {
    if (address) {
      fetchReferralData();
      fetchVIPData();
    }
  }, [address]);

  const copyToClipboard = () => {
    if (!referralLink) return;

    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    if (!referralLink) return;

    const text = encodeURIComponent(`Join me on P2P Exchange and earn rewards! Use my referral link: ${referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnFacebook = () => {
    if (!referralLink) return;

    const url = encodeURIComponent(referralLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnLine = () => {
    if (!referralLink) return;

    const text = encodeURIComponent(`Join me on P2P Exchange and earn rewards! Use my referral link: ${referralLink}`);
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white">Please connect wallet to view your referral stats.</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Banner */}
        <div className="bg-blue-800 text-white p-8 rounded-lg text-center mb-8">
          <h1 className="text-3xl font-bold mb-12">
            Get Cashback on Digital Token Trading by Referring Friends
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <img src="http://localhost:3000/referral-step1-blue.svg" alt="Step 1" width={60} height={60} />
              </div>
              <h3 className="font-bold mb-3 text-lg">1. Share Your Referral Link</h3>
              <p className="text-sm opacity-90">Share your link or QR code with friends via Facebook, Line, and other channels</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <img src="http://localhost:3000/referral-step2-blue.svg" alt="Step 2" width={60} height={60} />
              </div>
              <h3 className="font-bold mb-3 text-lg">2. Friends Sign Up</h3>
              <p className="text-sm opacity-90">Invite your friends using your referral link and QR code</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <img src="http://localhost:3000/referral-step3-blue.svg" alt="Step 3" width={60} height={60} />
              </div>
              <h3 className="font-bold mb-3 text-lg">3. Earn Cashback on Digital Token Trading</h3>
              <p className="text-sm opacity-90">Earn up to 0.8% from buyer referrals and 0.2% from seller referrals</p>
            </div>
          </div>
        </div>

        {/* VIP Dashboard */}
        <div className="mb-8">
          <VIPDashboard
            walletAddress={address}
            isVIP={isVIP}
            hasTeam={hasTeam}
            teamData={teamData}
            onStakeSuccess={fetchVIPData}
          />
        </div>

        {/* Commission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gray-900/50 backdrop-blur-lg border border-gray-800">
            <h3 className="text-sm text-gray-400">Total Earnings</h3>
            <p className="text-2xl font-bold text-blue-600">
              ฿{commissionStats.totalEarnings.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-gray-900/50 backdrop-blur-lg border border-gray-800">
            <h3 className="text-sm text-gray-400">Buyer Commission (0.8%)</h3>
            <p className="text-2xl font-bold text-green-600">
              ฿{commissionStats.buyerCommission.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-gray-900/50 backdrop-blur-lg border border-gray-800">
            <h3 className="text-sm text-gray-400">Seller Commission (0.1%)</h3>
            <p className="text-2xl font-bold text-green-600">
              ฿{commissionStats.sellerCommission.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-gray-900/50 backdrop-blur-lg border border-gray-800">
            <h3 className="text-sm text-gray-400">VIP Bonus (0.1%)</h3>
            <p className="text-2xl font-bold text-purple-600">
              ฿{commissionStats.vipBonus.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="http://localhost:3000/money-bag.svg" alt="Earnings" width={48} height={48} />
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : `฿${userStats.totalEarnings.toLocaleString()}`}
                </h2>
                <p className="text-gray-400">Total Earnings</p>
              </div>
            </div>
            <div className="flex items-center">
              <img src="http://localhost:3000/users.svg" alt="Friends" width={48} height={48} />
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : userStats.totalFriends}
                </h2>
                <p className="text-gray-400">Friends Referred</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold mb-4">Share Your Referral Link</h2>
              {!referralLink && !loading ? (
                <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-800 mb-4">
                  <p className="mb-3">You need a referral code to start earning commissions.</p>
                  <button
                    onClick={registerUser}
                    disabled={isRegistering}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="mr-2" />
                        Create Referral Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-6">
                    <input
                      type="text"
                      value={loading ? 'Loading...' : referralLink || 'No referral link available'}
                      readOnly
                      className="flex-1 p-3 bg-gray-800/50 border border-gray-700 rounded text-gray-300"
                    />
                    <button
                      onClick={copyToClipboard}
                      disabled={!referralLink}
                      className={`${!referralLink ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded transition-colors flex items-center`}
                    >
                      {copied ? <Check size={20} /> : <Clipboard size={20} />}
                      <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-400">Invite Friends</span>
                    <div className="flex gap-4">
                      <button
                        onClick={shareOnTwitter}
                        disabled={!referralLink}
                        className={`p-2 transition-opacity ${!referralLink ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        <img src="http://localhost:3000/twitter.svg" alt="Twitter" width={24} height={24} />
                      </button>
                      <button
                        onClick={shareOnLine}
                        disabled={!referralLink}
                        className={`p-2 transition-opacity ${!referralLink ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        <img src="http://localhost:3000/line.svg" alt="Line" width={24} height={24} />
                      </button>
                      <button
                        onClick={shareOnFacebook}
                        disabled={!referralLink}
                        className={`p-2 transition-opacity ${!referralLink ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        <img src="http://localhost:3000/facebook.svg" alt="Facebook" width={24} height={24} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-center items-center">
              {loading ? (
                <div className="animate-pulse bg-gray-700 rounded-lg h-48 w-48" />
              ) : qrCode ? (
                <div className="bg-white p-3 rounded-lg">
                  <img src={qrCode} alt="Referral QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="text-gray-400 p-6 text-center bg-gray-800/50 rounded-lg">
                  <p>QR Code not available</p>
                  <p className="text-xs mt-2">Please register to get your referral code</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Structure Visualization */}
        <div className="mt-12 bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6">
          <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setTeamType('buy')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${teamType === 'buy'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-transparent text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                data-tooltip-id="team-type"
                data-tooltip-content="View buy-side team structure and trading volume"
              >
                Buy Side
              </button>
              <button
                type="button"
                onClick={() => setTeamType('sell')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${teamType === 'sell'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-transparent text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                data-tooltip-id="team-type"
                data-tooltip-content="View sell-side team structure and trading volume"
              >
                Sell Side
              </button>
            </div>
          </div>
          <InteractiveTeamTree isVip={true} type={teamType} />
          <Tooltip id="team-type" place="top" />
        </div>
      </div>
    </div>
  );
}
