import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';

interface StakeFormProps {
    walletAddress: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function StakeForm({ walletAddress, onSuccess, onCancel }: StakeFormProps) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStake = async () => {
        try {
            setLoading(true);
            setError('');

            const stakeAmount = parseFloat(amount);
            if (isNaN(stakeAmount) || stakeAmount < 100000) {
                setError('Minimum stake amount is 100,000 CDX');
                return;
            }

            // Call API to stake tokens
            const response = await fetch('/api/vip/stake', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress,
                    amount: stakeAmount,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to stake tokens');
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 bg-[#1a237e] text-white">
                <h3 className="text-xl font-bold mb-6 text-center">Stake CDX Tokens</h3>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Amount (Minimum 100,000 CDX)
                    </label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        disabled={loading}
                    />
                    {error && (
                        <p className="mt-2 text-red-400 text-sm">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className="border-white/20 text-white hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStake}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Staking...</span>
                            </div>
                        ) : (
                            'Stake Now'
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
} 