import React, { useState } from 'react';
import { Zap, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { CoinMarket } from '../types';

interface NewSignalModalProps {
  coins: CoinMarket[];
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (symbol: string, side: 'BUY' | 'SELL', price: number) => void;
}

export const NewSignalModal: React.FC<NewSignalModalProps> = ({
  coins,
  isOpen,
  onClose,
  onDispatch,
}) => {
  const [symbol, setSymbol] = useState('SOLUSDT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [customPrice, setCustomPrice] = useState<string>('');

  if (!isOpen) return null;

  const selectedCoin = coins.find((c) => c.symbol === symbol);
  const currentMarketPrice = selectedCoin?.price || 100.0;
  const executionPrice = customPrice ? parseFloat(customPrice) || currentMarketPrice : currentMarketPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch(symbol, side, executionPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dispatch New Trade Signal</h3>
              <p className="text-xs text-slate-400">Dispatches risk-calculated orders to all approved members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Symbol Select */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Target Coin Symbol:</label>
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                const c = coins.find((item) => item.symbol === e.target.value);
                if (c) setCustomPrice(c.price.toString());
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
            >
              {coins.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} (${c.price.toFixed(c.price > 1 ? 4 : 6)}) {c.inWhitelist ? '★ FWL' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Direction (BUY vs SELL) */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Trade Direction:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all ${
                  side === 'BUY'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-700/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>BUY / LONG</span>
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all ${
                  side === 'SELL'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-700/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>SELL / SHORT</span>
              </button>
            </div>
          </div>

          {/* Execution Entry Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">Execution Entry Price ($):</label>
              <button
                type="button"
                onClick={() => setCustomPrice(currentMarketPrice.toString())}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Use Live Mark (${currentMarketPrice.toFixed(4)})
              </button>
            </div>
            <input
              type="number"
              step="any"
              value={customPrice || currentMarketPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Math Preview & Active Trade Lock Notice */}
          {selectedCoin?.hasActiveTrade ? (
            <div className="p-3 bg-amber-950/70 border border-amber-800/80 rounded-lg text-amber-300 space-y-1 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-200">
                <span>🔒 කාසියේ ට්‍රේඩ් සීමාව (Trade Lock)</span>
              </div>
              <p>
                <b>{symbol}</b> කාසිය සඳහා දැනටමත් Open Position එකක් පවතී ({selectedCoin.activeTradeSide}). මෙම ට්‍රේඩ් එක Close වන තුරු මෙම කාසියෙන් නව සිග්නල් සෙවීම හෝ නිකුත් කිරීම සම්පූර්ණයෙන්ම අත්හිටුවා ඇත.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Algorithmic Risk Engine Rules:</div>
              <p>
                • Personalized TP & SL calculated automatically based on each member's base margin & leverage.
              </p>
              <p>
                • If member has an active loss pool, a partial recovery slice (up to $0.20 cap) is attached to the TP goal.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(selectedCoin?.hasActiveTrade)}
              className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>{selectedCoin?.hasActiveTrade ? 'Locked (Trade In Progress)' : 'Broadcast Signal'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
