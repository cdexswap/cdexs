// Helper function to format wallet address
export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// Helper function to format countdown time
export const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to get chain icon
export const getChainIcon = (chainName: string): string => {
  const normalizedName = chainName.toLowerCase();
  const chainMap: Record<string, string> = {
    'ethereum': '/chains/eth.svg',
    'binance chain': '/chains/bsc.svg',
    'bsc': '/chains/bsc.svg',
    'arbitrum': '/chains/arbitrum.svg',
    'base': '/chains/base.svg',
    'polygon': '/chains/polygon.svg',
    'solana': '/chains/solana.svg'
  };
  return chainMap[normalizedName] || '/chains/eth.svg';
};

export const getCurrencyIcon = (currency: string, chain: string): string => {
  const normalizedCurrency = currency.toLowerCase();
  const normalizedChain = chain.toLowerCase();

  if (normalizedCurrency === 'bnb' || 
      (normalizedChain === 'binance smart chain' && normalizedCurrency === chain)) {
    return '/chains/bsc.svg';
  }
  if (normalizedCurrency === 'eth' || 
      (normalizedChain === 'ethereum' && normalizedCurrency === chain)) {
    return '/chains/eth.svg';
  }

  return `/${normalizedCurrency}.svg`;
};
