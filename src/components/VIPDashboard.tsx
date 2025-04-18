import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { StakeForm } from './StakeForm';
import InteractiveTeamTree from './InteractiveTeamTree';
import { UserIcon, Loader2 } from 'lucide-react';

interface VIPDashboardProps {
    walletAddress: string;
    isVIP: boolean;
    hasTeam: boolean;
    teamData?: any;
    onStakeSuccess?: () => void;
}

export function VIPDashboard({
    walletAddress,
    isVIP,
    hasTeam,
    teamData,
    onStakeSuccess
}: VIPDashboardProps) {
    const [showStakeForm, setShowStakeForm] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch(`/api/balance?walletAddress=${walletAddress}`);
                const data = await response.json();
                setBalance(data.balance || 0);
            } catch (error) {
                console.error('Error fetching balance:', error);
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) {
            fetchBalance();
        }
    }, [walletAddress]);

    if (!isVIP) {
        return (
            <Card className="p-8 bg-[#1a237e] text-white text-center">
                <h2 className="text-2xl font-bold mb-4">VIP Membership Required</h2>
                <p className="mb-6">
                    To view your team structure and access VIP features, you need to become a VIP member.
                </p>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Requirements to become VIP:</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center justify-center gap-2">
                            • Deposit or purchase at least 100,000 tokens
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <span className={balance >= 100000 ? "text-green-400" : "text-red-400"}>
                                    (Current: {balance.toLocaleString()} CDX)
                                </span>
                            )}
                        </li>
                        <li className="flex items-center justify-center">
                            • Complete KYC verification
                        </li>
                        <li className="flex items-center justify-center">
                            • Maintain minimum token balance
                        </li>
                    </ul>
                </div>

                {balance >= 100000 ? (
                    <Button
                        onClick={() => setShowStakeForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <UserIcon size={20} />
                        Become VIP Member
                    </Button>
                ) : (
                    <div className="text-yellow-300 text-sm mt-4">
                        Please ensure you have at least 100,000 CDX tokens before becoming a VIP member.
                        <br />
                        <a
                            href="https://cdex.finance"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
                        >
                            Purchase CDX tokens →
                        </a>
                    </div>
                )}

                {showStakeForm && (
                    <StakeForm
                        walletAddress={walletAddress}
                        onSuccess={() => {
                            setShowStakeForm(false);
                            onStakeSuccess?.();
                        }}
                        onCancel={() => setShowStakeForm(false)}
                    />
                )}
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-gray-900/50 backdrop-blur-lg border border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Badge variant="vip" className="mr-2">VIP</Badge>
                    <h2 className="text-2xl font-bold">Your Team Network</h2>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Staked: 100,000 CDX</p>
                    <p className="text-sm text-green-400">Active</p>
                </div>
            </div>

            {teamData && (
                <div className="mt-4">
                    <InteractiveTeamTree data={teamData} />
                </div>
            )}
        </Card>
    );
} 