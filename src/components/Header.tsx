import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  Flame,
  Clock,
  KeyRound
} from 'lucide-react';
import { BotConfig } from '../types';

interface HeaderProps {
  config: BotConfig | null;
  metrics: {
    openTrades: number;
    openBuys: number;
    openSells: number;
    totalUsers: number;
    approvedUsers: number;
    whitelistedCount: number;
    totalLossPool: number;
    totalLossRecovered: number;
  } | null;
  onToggleBot: () => void;
  onTogglePaper: () => void;
  onRefresh: () => void;
  onOpenSignalModal: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  metrics,
  onToggleBot,
  onTogglePaper,
  onRefresh,
  onOpenSignalModal,
  isRefreshing,
}) => {
  const [colomboTime, setColomboTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setColomboTime(timeStr);
      } catch {
        setColomboTime(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isPaused = config?.is_paused ?? false;
  const isPaper = config?.paper_trading ?? true;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-md shadow-red-500/20">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  RedBull Master
                </h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60">
                  Loss Recovery Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-User Binance Futures Algorithmic Bot & Risk Management
              </p>
            </div>
          </div>

          {/* Live System Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Master Engine State */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
              isPaused 
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' 
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
              <span className="font-medium">
                {isPaused ? 'Engine: PAUSED' : 'Engine: RUNNING'}
              </span>
            </div>

            {/* Trading Mode */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
              isPaper
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                : 'bg-purple-950/40 border-purple-800/60 text-purple-300'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-medium">
                {isPaper ? 'Paper Mode (Safe)' : 'Live Binance Futures'}
              </span>
            </div>

            {/* Directional Exposure Gauge */}
            {metrics && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/50 text-slate-300">
                <span className="text-emerald-400 font-semibold">{metrics.openBuys} BUY</span>
                <span className="text-slate-500">/</span>
                <span className="text-rose-400 font-semibold">{metrics.openSells} SELL</span>
                <span className="text-slate-400">({metrics.openTrades}/10 Global)</span>
              </div>
            )}

            {/* Timezone (Asia/Colombo) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/40 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Colombo: {colomboTime}</span>
            </div>

            {/* Binance Key Preview */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-800/40 text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{config?.binance_key_preview || 'No Key'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBot}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-700/20'
              }`}
              title={isPaused ? 'Resume Bot' : 'Pause Bot'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{isPaused ? 'Start Bot' : 'Pause Bot'}</span>
            </button>

            <button
              onClick={onOpenSignalModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm shadow-rose-600/20"
            >
              <Zap className="w-4 h-4" />
              <span>Dispatch Signal</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
