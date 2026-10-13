import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Shield, BarChart2 } from 'lucide-react';
import { PaperTradeAsset } from '../types/index.ts';

const SAMPLE_ASSETS: PaperTradeAsset[] = [
  { symbol: 'EMAAR', name: 'Emaar Properties PJSC', market: 'DFM', price: 8.85, changePercent: 1.45, volume: '14.2M' },
  { symbol: 'SALIK', name: 'Salik Company PJSC (Toll Tech)', market: 'DFM', price: 3.42, changePercent: 0.88, volume: '9.8M' },
  { symbol: 'EMIRATESNBD', name: 'Emirates NBD Bank', market: 'DFM', price: 19.65, changePercent: -0.51, volume: '3.4M' },
  { symbol: 'DEWA', name: 'Dubai Electricity & Water Auth', market: 'DFM', price: 2.58, changePercent: 0.39, volume: '8.1M' },
  { symbol: 'TECOM', name: 'TECOM Group (Tech Districts)', market: 'DFM', price: 2.94, changePercent: 1.73, volume: '2.9M' },
  { symbol: 'DUBAIAI', name: 'Dubai Sovereign AI Index (Virtual)', market: 'Nasdaq Dubai', price: 142.30, changePercent: 2.84, volume: '5.6M' },
];

export const TradingView: React.FC = () => {
  const [balance, setBalance] = useState<number>(100000);
  const [holdings, setHoldings] = useState<{ [symbol: string]: number }>({ EMAAR: 2500, SALIK: 5000 });
  const [selectedAsset, setSelectedAsset] = useState<PaperTradeAsset>(SAMPLE_ASSETS[0]);
  const [tradeShares, setTradeShares] = useState<number>(100);
  const [feedback, setFeedback] = useState<string>('');

  const handleBuy = () => {
    const cost = selectedAsset.price * tradeShares;
    if (balance < cost) {
      setFeedback('Insufficient virtual AED balance.');
      return;
    }
    setBalance(balance - cost);
    setHoldings({
      ...holdings,
      [selectedAsset.symbol]: (holdings[selectedAsset.symbol] || 0) + tradeShares,
    });
    setFeedback(`Bought ${tradeShares} shares of ${selectedAsset.symbol} for ${cost.toFixed(2)} AED.`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSell = () => {
    const currentQty = holdings[selectedAsset.symbol] || 0;
    if (currentQty < tradeShares) {
      setFeedback(`Insufficient shares of ${selectedAsset.symbol}.`);
      return;
    }
    const proceeds = selectedAsset.price * tradeShares;
    setBalance(balance + proceeds);
    setHoldings({
      ...holdings,
      [selectedAsset.symbol]: currentQty - tradeShares,
    });
    setFeedback(`Sold ${tradeShares} shares of ${selectedAsset.symbol} for ${proceeds.toFixed(2)} AED.`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const portfolioValue =
    balance +
    Object.entries(holdings).reduce((acc, [sym, qty]) => {
      const asset = SAMPLE_ASSETS.find((a) => a.symbol === sym);
      return acc + (asset ? asset.price * qty : 0);
    }, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notice */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-slate-600" />
          <span>
            Optional Paper Trading Simulation. Kept separate from your core LIFEOS living intelligence.
          </span>
        </div>
        <span className="text-slate-700 font-medium">Virtual Sandbox</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Virtual Portfolio Value</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
          </div>
          <span className="text-xs text-emerald-600 font-medium flex items-center space-x-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+2.4% simulated performance</span>
          </span>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Available Cash</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
          </div>
          <span className="text-xs text-slate-400">Unallocated balance</span>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">DFM General Index</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            4,482.10 <span className="text-emerald-600 text-sm font-semibold">+0.82%</span>
          </div>
          <span className="text-xs text-slate-400">Trading hours 10:00 to 15:00 GST</span>
        </div>
      </div>

      {/* Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-slate-700" />
              <span>Dubai Equities Watchlist</span>
            </h3>
            <span className="text-xs text-slate-400">DFM / Nasdaq Dubai</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 pb-2">
                  <th className="py-2.5 font-medium">Symbol</th>
                  <th className="py-2.5 font-medium">Price (AED)</th>
                  <th className="py-2.5 font-medium">Change</th>
                  <th className="py-2.5 font-medium">Position</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SAMPLE_ASSETS.map((asset) => {
                  const isUp = asset.changePercent >= 0;
                  const isSelected = selectedAsset.symbol === asset.symbol;
                  const myQty = holdings[asset.symbol] || 0;
                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${
                        isSelected ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{asset.symbol}</div>
                        <div className="text-[11px] text-slate-400">{asset.name}</div>
                      </td>
                      <td className="py-3 font-mono font-medium text-slate-900">
                        {asset.price.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`font-medium flex items-center space-x-0.5 ${
                            isUp ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{asset.changePercent > 0 ? `+${asset.changePercent}` : asset.changePercent}%</span>
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-700">
                        {myQty > 0 ? `${myQty} shares` : 'None'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Ticket */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Simulated Order</span>
              <h4 className="text-base font-bold text-slate-900">{selectedAsset.symbol}</h4>
            </div>
            <span className="font-mono text-base font-bold text-slate-900">
              {selectedAsset.price.toFixed(2)} AED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Quantity</label>
              <input
                type="number"
                min="10"
                step="10"
                value={tradeShares}
                onChange={(e) => setTradeShares(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-slate-700">
              <span>Estimated Cost:</span>
              <span className="font-mono font-bold text-slate-900">
                {(selectedAsset.price * tradeShares).toFixed(2)} AED
              </span>
            </div>

            {feedback && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs">
                {feedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleBuy}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition shadow-sm"
              >
                Buy
              </button>
              <button
                onClick={handleSell}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium transition shadow-sm"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
