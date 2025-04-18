import { ChangeEvent } from "react";
import { evmChains, chainMetadata } from "@/lib/config/chains";
import TokenPrice from "@/components/TokenPrice";

interface Token {
  symbol: string;
  name: string;
}

interface CreateSellOrderFormProps {
  selectedChain: number;
  setSelectedChain: (chain: number) => void;
  amount: string;
  setAmount: (amount: string) => void;
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  numBuyers: string;
  setNumBuyers: (numBuyers: string) => void;
}

export default function CreateSellOrderForm({
  selectedChain,
  setSelectedChain,
  amount,
  setAmount,
  selectedToken,
  setSelectedToken,
  numBuyers,
  setNumBuyers,
}: CreateSellOrderFormProps) {
  // Get available tokens for selected chain
  const chainData = chainMetadata[selectedChain];

  // Create available tokens array including chain's native token, USDT, and BUSD
  const availableTokens: Token[] = [
    { symbol: chainData.symbol, name: chainData.name },
    { symbol: "USDT", name: "Tether USD" },
    { symbol: "BUSD", name: "Binance USD" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="chain" className="block text-sm font-bold text-white">
          Chain
        </label>
        <select
          id="chain"
          value={selectedChain}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setSelectedChain(Number(e.target.value))
          }
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white bg-gray-800"
        >
          {evmChains.map((chain) => (
            <option 
              key={chain.id} 
              value={chain.id}
              disabled={chain.id !== evmChains[1].id && chain.id !== evmChains[5].id} // Enable Binance Chain (bsc) and Sepolia
              className={chain.id !== evmChains[1].id && chain.id !== evmChains[5].id ? "text-gray-500" : ""}
            >
              {chainMetadata[chain.id].name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="crypto-amount"
          className="block text-sm font-bold text-white"
        >
          Amount to Sell
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            id="crypto-amount"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
            className="focus:ring-blue-500 focus:border-blue-500 block w-full h-8 pl-2 pr-20 sm:text-base border-gray-300 rounded-md text-white bg-gray-800"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 flex items-center h-8">
            <select
              id="crypto-currency"
              value={selectedToken}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedToken(e.target.value)
              }
              className="h-full py-0 pl-2  border-transparent bg-gray-800 text-white sm:text-sm rounded-r-md focus:outline-none"
            >
              {availableTokens.map((token) => (
                <option 
                  key={token.symbol} 
                  value={token.symbol}
                  disabled={token.symbol !== "USDT"}
                  className={token.symbol !== "USDT" ? "text-gray-500" : ""}
                >
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <TokenPrice
            token={selectedToken}
            chain={chainMetadata[selectedChain].name}
            amount={amount}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="num-buyers"
          className="block text-sm font-bold text-white"
        >
          Number of Buyers
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            id="num-buyers"
            value={numBuyers}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNumBuyers(e.target.value)
            }
            min="1"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full h-8 pl-2 pr-2 sm:text-base border-gray-300 rounded-md text-white bg-gray-800"
            placeholder="1"
          />
          <div className="text-xs text-gray-400 mt-1">
            Fee increases by 0.4% per buyer
          </div>
        </div>
      </div>
    </div>
  );
}
