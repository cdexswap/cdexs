import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Transaction {
    id: string;
    amount: number;
    fee: number;
    buyer_commission: number;
    seller_commission: number;
    vip_bonus: number;
    created_at: string;
}

interface CommissionStatsProps {
    walletAddress: string;
}

export default function CommissionStats({ walletAddress }: CommissionStatsProps) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarned: 0,
        pendingCommissions: 0,
        transactions: [] as Transaction[]
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`/api/users/${walletAddress}/commission-stats`);
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching commission stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) {
            fetchStats();
        }
    }, [walletAddress]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    <h3 className="text-lg font-semibold">Total Earned</h3>
                    <p className="text-2xl font-bold">{stats.totalEarned.toFixed(2)} CDX</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                    <h3 className="text-lg font-semibold">Pending Commissions</h3>
                    <p className="text-2xl font-bold">{stats.pendingCommissions.toFixed(2)} CDX</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-600 to-green-800 text-white">
                    <h3 className="text-lg font-semibold">Total Transactions</h3>
                    <p className="text-2xl font-bold">{stats.transactions.length}</p>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-4">
                    {stats.transactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {new Date(tx.created_at).toLocaleDateString()}
                                </p>
                                <p className="font-medium">Transaction Amount: {tx.amount.toFixed(2)} CDX</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-green-600">
                                    +{(tx.buyer_commission + tx.seller_commission + tx.vip_bonus).toFixed(2)} CDX
                                </p>
                                <p className="text-xs text-gray-500">Fee: {tx.fee.toFixed(2)} CDX</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
} 