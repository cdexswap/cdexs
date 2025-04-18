export const exchangeRates: Record<string, number> = {
  'THB': 35.5,
  'LAK': 19500,
  'MYR': 4.75,
  'VND': 24700,
  'CNY': 7.25,
  'USD': 1,
  'SGD': 1.35,
  'EUR': 0.92
};

export const currencySymbols: Record<string, string> = {
  'THB': '฿',
  'LAK': '₭',
  'MYR': 'RM',
  'VND': '₫',
  'CNY': '¥',
  'USD': '$',
  'SGD': 'S$',
  'EUR': '€'
};

export const getCurrency = (countryCode: string): string | undefined => {
  switch(countryCode) {
    case 'TH': return 'THB';
    case 'MY': return 'MYR';
    case 'LA': return 'LAK';
    case 'VN': return 'VND';
    case 'CN': return 'CNY';
    case 'US': return 'USD';
    case 'SG': return 'SGD';
    case 'EU': return 'EUR';
    default: return undefined;
  }
};

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
