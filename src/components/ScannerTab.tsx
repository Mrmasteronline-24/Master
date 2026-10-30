import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Activity,
  Layers,
  Cloud,
  Crosshair,
  Sliders
} from 'lucide-react';
import { CoinMarket, BotConfig } from '../types';

interface ScannerTabProps {
  coins: CoinMarket[];
  config: BotConfig | null;
  metrics: {
    openTrades: number;
    openBuys: number;
    openSells: number;
    whitelistedCount: number;
    blacklistedCount: number;
  } | null;
  onAddToWhitelist: (symbol: string) => void;
  onRemoveFromWhitelist: (symbol: string) => void;
  onResetWhitelist: () => void;
  onAddToBlacklist: (symbol: string, reason: string) => void;
  onRemoveFromBlacklist: (symbol: string) => void;
  onTriggerSignal: (symbol: string, side: 'BUY' | 'SELL', price: number) => void;
  onUpdatePreset?: (preset: 'Crypto' | 'Classic' | '5-Day Week') => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  coins,
  config,
  metrics,
  onAddToWhitelist,
  onRemoveFromWhitelist,
  onResetWhitelist,
  onAddToBlacklist,
  onRemoveFromBlacklist,
  onTriggerSignal,
  onUpdatePreset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'whitelist' | 'blacklist' | 'strong_up' | 'strong_down' | 'aligned' | 'chop' | 'locked'>('whitelist');
  const [newCoinSymbol, setNewCoinSymbol] = useState('');
  const [blacklistModalSymbol, setBlacklistModalSymbol] = useState<string | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('High volatility or erratic candle wicks');
  const [showIndicatorGuide, setShowIndicatorGuide] = useState(false);

  const btcCoin = coins.find((c) => c.symbol === 'BTCUSDT');
  const isBtcDumping = btcCoin ? btcCoin.change24h < -4.0 : false;

  const filteredCoins = coins.filter((coin) => {
    const matchesSearch = coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'whitelist') return coin.inWhitelist;
    if (activeFilter === 'blacklist') return coin.inBlacklist;
    if (activeFilter === 'strong_up') return coin.signalType === 'STRONG_UP' || coin.score >= 4;
    if (activeFilter === 'strong_down') return coin.signalType === 'STRONG_DOWN' || coin.score <= -4;
    if (activeFilter === 'aligned') return coin.sanyaku !== 0;
    if (activeFilter === 'chop') return coin.noCut || coin.inKumo;
    if (activeFilter === 'locked') return Boolean(coin.hasActiveTrade);
    return true;
  });

  const handleAddCustomCoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoinSymbol.trim()) return;
    onAddToWhitelist(newCoinSymbol.trim());
    setNewCoinSymbol('');
  };

  const handleConfirmBlacklist = () => {
    if (!blacklistModalSymbol) return;
    onAddToBlacklist(blacklistModalSymbol, blacklistReason);
    setBlacklistModalSymbol(null);
    setBlacklistReason('High volatility or erratic candle wicks');
  };

  const currentPreset = config?.ichimoku_preset || 'Crypto';

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Directional Exposure & BTC Crash Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* BUY Exposure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>BUY Exposure Limit</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {metrics?.openBuys ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                / {config?.max_buys ?? 4} Max Longs
              </span>
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all" 
              style={{ width: `${Math.min(100, ((metrics?.openBuys ?? 0) / (config?.max_buys || 4)) * 100)}%` }}
            />
          </div>
        </div>

        {/* SELL Exposure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>SELL Exposure Limit</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {metrics?.openSells ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                / {config?.max_sells ?? 4} Max Shorts
              </span>
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all" 
              style={{ width: `${Math.min(100, ((metrics?.openSells ?? 0) / (config?.max_sells || 4)) * 100)}%` }}
            />
          </div>
        </div>

        {/* BTC Crash Filter Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>BTC Crash Filter</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-sm font-semibold ${isBtcDumping ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isBtcDumping ? 'CRASH DETECTED (Longs Blocked)' : 'NORMAL (All signals permitted)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              BTC: ${btcCoin?.price?.toLocaleString() || '68,450'} ({btcCoin ? `${btcCoin.change24h > 0 ? '+' : ''}${btcCoin.change24h.toFixed(2)}%` : '+0.0%'})
            </span>
          </div>
          <div className={`p-2 rounded-lg ${isBtcDumping ? 'bg-rose-950/60 text-rose-400' : 'bg-emerald-950/60 text-emerald-400'}`}>
            {isBtcDumping ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>

      </div>

      {/* Whitelist (First Win List) Controls & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                <span>Ichimoku Itto [Itto-Ryu] Market Scanner</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                Preset: {currentPreset}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              5-Component Itto Score (-5 to +5), Sanyaku Koten (3/3 Aligned), Kumo Cloud & Kijun Blade.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Preset Selector */}
            {onUpdatePreset && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 uppercase px-1 font-semibold">Preset:</span>
                {(['Crypto', 'Classic', '5-Day Week'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => onUpdatePreset(p)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      currentPreset === p
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowIndicatorGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/60 rounded-lg border border-rose-800/60 transition-colors shadow-sm"
            >
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Indicator විස්තරය (Guide)</span>
            </button>

            <button
              onClick={onResetWhitelist}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Reset to default 50 coins"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset FWL</span>
            </button>

            {/* Quick Add Form */}
            <form onSubmit={handleAddCustomCoin} className="flex items-center gap-1">
              <input
                type="text"
                placeholder="e.g. SUI or XRP"
                value={newCoinSymbol}
                onChange={(e) => setNewCoinSymbol(e.target.value)}
                className="w-24 sm:w-28 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Filter Chips & Search input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('whitelist')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'whitelist'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Whitelist ({coins.filter((c) => c.inWhitelist).length})
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Tickers ({coins.length})
            </button>
            <button
              onClick={() => setActiveFilter('strong_up')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'strong_up'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
              }`}
            >
              Strong Up 🔺
            </button>
            <button
              onClick={() => setActiveFilter('strong_down')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'strong_down'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
              }`}
            >
              Strong Down 🔻
            </button>
            <button
              onClick={() => setActiveFilter('aligned')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'aligned'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-blue-400 hover:bg-slate-700'
              }`}
            >
              3/3 Aligned ⚡
            </button>
            <button
              onClick={() => setActiveFilter('chop')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'chop'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              }`}
            >
              Chop Zone ☁️
            </button>
            <button
              onClick={() => setActiveFilter('locked')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'locked'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              }`}
            >
              In Trade ({coins.filter((c) => c.hasActiveTrade).length}) 🔒
            </button>
            <button
              onClick={() => setActiveFilter('blacklist')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'blacklist'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Blacklist ({coins.filter((c) => c.inBlacklist).length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

        </div>

      </div>

      {/* Coins Market Table with Ichimoku Itto Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Coin Symbol</th>
                <th className="py-3 px-4">Live Price</th>
                <th className="py-3 px-4">Tenkan / Kijun (Blade)</th>
                <th className="py-3 px-4">Kumo Cloud (A / B)</th>
                <th className="py-3 px-4">Itto Score (±5)</th>
                <th className="py-3 px-4">3/3 Aligned</th>
                <th className="py-3 px-4">Trend / Signal</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No coins found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
                  const isUp = coin.change24h >= 0;
                  const scorePositive = coin.score > 0;
                  const isChop = coin.noCut || coin.inKumo;

                  return (
                    <tr key={coin.symbol} className="hover:bg-slate-800/40 transition-colors">
                      {/* Symbol */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm tracking-wide">
                            {coin.symbol}
                          </span>
                          {coin.hasActiveTrade && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1 shadow-sm">
                              🔒 In Trade ({coin.activeTradeSide})
                            </span>
                          )}
                          {coin.inWhitelist && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                              FWL
                            </span>
                          )}
                          {coin.feedType === '5m Klines' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-950 text-cyan-300 border border-cyan-800/50">
                              5m Klines ⚡
                            </span>
                          )}
                          {coin.isEligible === false ? (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80"
                              title={`Min Notional is $${coin.minNotional}. Not suitable for micro margin (Order Rejection risk).`}
                            >
                              Min Notional: High (${coin.minNotional})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                              $5 Min Notional OK
                            </span>
                          )}
                          {coin.inBlacklist && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800/60"
                              title={coin.blacklistReason}
                            >
                              BLACKLIST
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Live Price & 24h change */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        <div>${coin.price > 1 ? coin.price.toFixed(4) : coin.price.toFixed(6)}</div>
                        <span className={`inline-flex items-center text-[11px] font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </span>
                      </td>

                      {/* Tenkan & Kijun (The Blade) */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-blue-400">Tenkan: ${coin.tenkan.toFixed(3)}</div>
                        <div className="text-amber-400 font-semibold">Kijun: ${coin.kijun.toFixed(3)}</div>
                      </td>

                      {/* Kumo Cloud (A / B) */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-emerald-400/90">Span A: ${coin.kumoA.toFixed(3)}</div>
                        <div className="text-rose-400/90">Span B: ${coin.kumoB.toFixed(3)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {coin.inKumo ? (
                            <span className="text-amber-400 font-semibold">☁️ Inside Kumo (Chop)</span>
                          ) : coin.price > Math.max(coin.kumoA, coin.kumoB) ? (
                            <span className="text-emerald-400">Above Cloud ↑</span>
                          ) : (
                            <span className="text-rose-400">Below Cloud ↓</span>
                          )}
                        </div>
                      </td>

                      {/* Itto Score */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            coin.score >= 4
                              ? 'text-emerald-400'
                              : coin.score <= -4
                              ? 'text-rose-400'
                              : isChop
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}>
                            {coin.score > 0 ? '+' : ''}{coin.score} ({coin.scorePct > 0 ? '+' : ''}{coin.scorePct}%)
                          </span>
                        </div>
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full transition-all ${
                              coin.score > 0 ? 'bg-emerald-500' : coin.score < 0 ? 'bg-rose-500' : 'bg-slate-600'
                            }`}
                            style={{
                              width: `${Math.min(100, (Math.abs(coin.score) / 5) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* 3/3 Sanyaku Aligned */}
                      <td className="py-3 px-4 font-semibold text-xs">
                        {coin.sanyaku === 1 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-max">
                            <span>⚡ Aligned Up</span>
                          </span>
                        ) : coin.sanyaku === -1 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 w-max">
                            <span>⚡ Aligned Dn</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Trend / Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider block w-max ${
                          isChop
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : coin.score >= 4
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm shadow-emerald-900/30 font-extrabold'
                            : coin.score <= -4
                            ? 'bg-rose-950 text-rose-300 border border-rose-700 shadow-sm shadow-rose-900/30 font-extrabold'
                            : coin.score > 0
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900'
                            : 'bg-rose-950/50 text-rose-400 border border-rose-900'
                        }`}>
                          {coin.trendText}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Signal Dispatch Buttons */}
                          {coin.hasActiveTrade ? (
                            <div 
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/70 border border-amber-800 text-amber-300 text-[10px] font-bold"
                              title="මෙම කාසියේ Open Trade එකක් පවතින බැවින් නව සිග්නල් සෙවීම නතර කර ඇත (Locked)"
                            >
                              <span>🔒 Open Trade In Progress</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => onTriggerSignal(coin.symbol, 'BUY', coin.price)}
                                className="px-2 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors"
                                title="Dispatch Long Signal"
                              >
                                BUY
                              </button>
                              <button
                                onClick={() => onTriggerSignal(coin.symbol, 'SELL', coin.price)}
                                className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition-colors"
                                title="Dispatch Short Signal"
                              >
                                SELL
                              </button>
                            </>
                          )}

                          {/* Whitelist / Blacklist Toggles */}
                          {coin.inWhitelist ? (
                            <button
                              onClick={() => onRemoveFromWhitelist(coin.symbol)}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors"
                              title="Remove from Whitelist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onAddToWhitelist(coin.symbol)}
                              className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors"
                              title="Add to Whitelist"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!coin.inBlacklist ? (
                            <button
                              onClick={() => setBlacklistModalSymbol(coin.symbol)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                              title="Add to Blacklist"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onRemoveFromBlacklist(coin.symbol)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-colors"
                              title="Remove from Blacklist"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blacklist Modal */}
      {blacklistModalSymbol && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>Blacklist Coin: {blacklistModalSymbol}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Blacklisting will immediately exclude this coin from all automated signal scanning.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason for Blacklisting:
              </label>
              <input
                type="text"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBlacklistModalSymbol(null)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlacklist}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm"
              >
                Confirm Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ichimoku Itto Guide & Architecture Modal */}
      {showIndicatorGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ichimoku Itto [Itto-Ryu] Indicator ක්‍රියාකාරීත්වය</h3>
                  <p className="text-xs text-slate-400">One Glance, One Cut — Complete Mathematical Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowIndicatorGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              {/* 1. Presets */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span>1. Presets (කාල පරාසයන්)</span>
                </div>
                <p>
                  ඔබ ලබාදුන් Pine Script කේතය අනුව Presets 3ක් අඩංගු වන අතර, Crypto වෙළඳපල සඳහා වඩාත්ම සුදුසු <b>Crypto Preset (20/60/120/30)</b> පෙරනිමියෙන් සක්‍රිය කර ඇත:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li><b className="text-white">Crypto:</b> Tenkan: 20 | Kijun: 60 | Span B: 120 | Displacement: 30</li>
                  <li><b className="text-white">Classic:</b> Tenkan: 9 | Kijun: 26 | Span B: 52 | Displacement: 26</li>
                  <li><b className="text-white">5-Day Week:</b> Tenkan: 7 | Kijun: 22 | Span B: 44 | Displacement: 22</li>
                </ul>
              </div>

              {/* 2. The 5-Component Itto Score */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <span>2. Itto Score Formula (-5 සිට +5 දක්වා)</span>
                </div>
                <p>
                  වෙළඳපල ශක්තිය සාධක 5ක් (c1 සිට c5 දක්වා) එකතු කරමින් ලකුණු -5 සිට +5 දක්වා මනිනු ලැබේ:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li><b className="text-slate-200">c1 (Kumo Cloud Position):</b> මිල Kumo Cloud එකට ඉහළින් නම් +1, පහළින් නම් -1, Cloud තුළ නම් 0.</li>
                  <li><b className="text-slate-200">c2 (TK Cross):</b> Tenkan &gt; Kijun නම් +1, Tenkan &lt; Kijun නම් -1.</li>
                  <li><b className="text-slate-200">c3 (Chikou Span):</b> මිල මීට පෙර Displacement bars වල High එකට වඩා වැඩි නම් +1, Low එකට වඩා අඩු නම් -1.</li>
                  <li><b className="text-slate-200">c4 (Future Kumo):</b> Senkou Span A &gt; Senkou Span B (Green Future Cloud) නම් +1, අනෙක් පස නම් -1.</li>
                  <li><b className="text-slate-200">c5 (Kijun Slope - The Blade):</b> Kijun රේඛාව ඉහළට නැඹුරු නම් +1, පහළට නැඹුරු නම් -1.</li>
                </ul>
              </div>

              {/* 3. 三役 (Sanyaku 3/3 Aligned) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-400 text-sm">
                  <span>3. 三役 (Sanyaku Koten & Gyakuten - 3/3 Aligned)</span>
                </div>
                <p>
                  ජපන් සම්ප්‍රදායික ඉචිමොකු ක්‍රමයේ ප්‍රබලතම තහවුරු කිරීම:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><b className="text-emerald-300">Sanyaku Koten (+1 / Aligned Up):</b> මිල Cloud එකට ඉහළින් + Tenkan Kijun ට ඉහළින් + Chikou මිලට ඉහළින් එකවර පැවතීම. (Strong Bullish confirmation).</li>
                  <li><b className="text-rose-300">Sanyaku Gyakuten (-1 / Aligned Down):</b> මිල Cloud එකට පහළින් + Tenkan Kijun ට පහළින් + Chikou මිලට පහළින් පැවතීම. (Strong Bearish confirmation).</li>
                </ul>
              </div>

              {/* 4. Chop Zone & Strong Cut Marks */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <span>4. Chop Zone & Signal Execution (No-Cut Rules)</span>
                </div>
                <p>
                  අනවශ්‍ය සහ අවදානම් සහගත ට්‍රේඩ් වලට ඇතුළු වීම වැළැක්වීම සඳහා:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><b className="text-amber-300">Chop Zone (No-Cut):</b> මිල Cloud එක ඇතුළත ඇති විට හෝ |Score| &le; 1 (20%) වන විට කිසිදු ට්‍රේඩ් එකක් සක්‍රීය නොවේ (CHOP ZONE · NO ACTION).</li>
                  <li><b className="text-emerald-400">Strong Up Cut (BUY):</b> Chop Zone එකෙන් පිටත Score එක +4 හෝ +5 (+80% හෝ +100%) කරා ළඟා වන විට BUY / LONG සිග්නල් ස්වයංක්‍රීයව Dispatched වේ.</li>
                  <li><b className="text-rose-400">Strong Down Cut (SELL):</b> Chop Zone එකෙන් පිටත Score එක -4 හෝ -5 කරා ළඟා වන විට SELL / SHORT සිග්නල් නිකුත් වේ.</li>
                </ul>
              </div>

              {/* 5. Equilibrium Magnets */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-400 text-sm">
                  <span>5. Equilibrium Magnets (සමතුලිතතා ආකර්ෂණ මට්ටම්)</span>
                </div>
                <p>
                  Kijun (හෝ Senkou Span B) එක දිගට Candles 8ක් (Flat bars) තිරස්ව (flat) පැවතුනහොත්, එම මට්ටම මිල ආකර්ෂණය කරගන්නා Magnet level එකක් ලෙස සලකනු ලබයි.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowIndicatorGuide(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs"
              >
                තේරුම් ගත්තා (Close)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
