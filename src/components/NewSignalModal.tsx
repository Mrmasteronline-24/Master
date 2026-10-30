import React, { useState } from 'react';
import { Zap, X, TrendingUp, TrendingDown, DollarSign, Clock, Copy, Check, ShieldAlert } from 'lucide-react';
import { CoinMarket } from '../types';

interface NewSignalModalProps {
  coins: CoinMarket[];
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (symbol: string, side: 'BUY' | 'SELL', price: number, durationMins?: number, isLossTrade?: boolean) => void;
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
  const [durationMins, setDurationMins] = useState<number>(60);
  const [isLossTrade, setIsLossTrade] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedCoin = coins.find((c) => c.symbol === symbol);
  const currentMarketPrice = selectedCoin?.price || 100.0;
  const executionPrice = customPrice ? parseFloat(customPrice) || currentMarketPrice : currentMarketPrice;

  // Approximate math for preview
  const previewMargin = 1.0;
  const previewLev = 10;
  const baseMovePct = 0.03; // 30% on margin @ 10x = 3%
  const recoveryMovePct = isLossTrade ? 0.045 : 0.03;
  const slMovePct = 0.027; // 27% on margin @ 10x = 2.7%

  const previewTp = side === 'BUY' 
    ? executionPrice * (1 + recoveryMovePct) 
    : executionPrice * (1 - recoveryMovePct);
  const previewSl = side === 'BUY'
    ? executionPrice * (1 - slMovePct)
    : executionPrice * (1 + slMovePct);

  const previewCopyStr = `${symbol} TP: ${previewTp.toFixed(4)} SL: ${previewSl.toFixed(4)}`;

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewCopyStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch(symbol, side, executionPrice, durationMins, isLossTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dispatch Trade Signal</h3>
              <p className="text-xs text-slate-400">Formatted per Trade Requirements (01, 02, 04, 05)</p>
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
          
          {/* Trade Mode Toggle (01 vs 02) */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <label className="block text-slate-300 font-semibold mb-1.5">Trade Mode:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsLossTrade(false)}
                className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                  !isLossTrade
                    ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                01. Loss නැති Trade (Normal) 🟢
              </button>
              <button
                type="button"
                onClick={() => setIsLossTrade(true)}
                className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                  isLossTrade
                    ? 'bg-amber-600/90 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                02. Loss Trade (Recovery) 🩹
              </button>
            </div>
          </div>

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

          {/* 04. Trade Duration Limit Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>04. Trade Duration (කාල සීමාව):</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 30, 45, 60, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMins(mins)}
                  className={`py-1.5 rounded-md font-mono text-[11px] font-bold border transition-colors ${
                    durationMins === mins
                      ? 'bg-orange-600 border-orange-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              කාලය අවසන් වූ විට ස්වයංක්‍රීයව "කාසියට ලබාදී ඇති කාලය අවසන් close කරන්න." Alert එක යවනු ඇත.
            </p>
          </div>

          {/* 05. Signal Output Preview & 1-Click Copy */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Signal Message Preview:</span>
              <button
                type="button"
                onClick={handleCopyPreview}
                className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/60 rounded text-[10px] flex items-center gap-1 transition-colors"
                title="05. Copy Coin, TP, and SL"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy (Coin+TP+SL)</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded font-mono text-[11px] text-slate-300 space-y-0.5 border border-slate-800">
              <div>💎 <b>Coin:</b> {symbol}</div>
              <div>📈 <b>Direction:</b> {side === 'BUY' ? 'BUY / LONG 🟢' : 'SELL / SHORT 🔴'}</div>
              <div>🎯 <b>Target Tp (full):</b> ${previewTp.toFixed(4)}</div>
              <div>🛑 <b>Stop Loss:</b> ${previewSl.toFixed(4)}</div>
              <div>⚙️ <b>Margin:</b> ${previewMargin.toFixed(2)} ({previewLev}x Lev)</div>
              <div>⏱️ <b>Duration:</b> {durationMins} mins</div>
            </div>
          </div>

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
