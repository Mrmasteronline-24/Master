import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  KeyRound, 
  Sliders, 
  Save, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';
import { BotConfig } from '../types';

interface SettingsTabProps {
  config: BotConfig | null;
  onUpdateConfig: (newConfig: Partial<BotConfig>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [maxBuys, setMaxBuys] = useState(config?.max_buys ?? 4);
  const [maxSells, setMaxSells] = useState(config?.max_sells ?? 4);
  const [maxSignalsGlobal, setMaxSignalsGlobal] = useState(config?.max_signals_global ?? 10);
  const [btcDumpFilter, setBtcDumpFilter] = useState(config?.btc_dump_filter ?? true);
  
  // Ichimoku Itto configurations
  const [ichimokuPreset, setIchimokuPreset] = useState<'Crypto' | 'Classic' | '5-Day Week'>(
    config?.ichimoku_preset ?? 'Crypto'
  );
  const [strongCutThreshold, setStrongCutThreshold] = useState(
    config?.strong_cut_threshold ?? 4
  );
  const [chopScoreBand, setChopScoreBand] = useState(
    config?.chop_score_band ?? 1
  );
  const [kijunSlopeLen, setKijunSlopeLen] = useState(
    config?.kijun_slope_len ?? 5
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      max_buys: Number(maxBuys),
      max_sells: Number(maxSells),
      max_signals_global: Number(maxSignalsGlobal),
      btc_dump_filter: Boolean(btcDumpFilter),
      ichimoku_preset: ichimokuPreset,
      strong_cut_threshold: Number(strongCutThreshold),
      chop_score_band: Number(chopScoreBand),
      kijun_slope_len: Number(kijunSlopeLen),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-rose-500" />
          <span>Global Engine Configurations & Ichimoku Itto Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tune algorithmic market scanning thresholds, Ichimoku Itto by [Itto-Ryu] parameters, and directional caps.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl p-4 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuration parameters updated and applied to live workers successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Ichimoku Itto Engine Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>Ichimoku Itto [Itto-Ryu] Engine Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Preset:
              </label>
              <select
                value={ichimokuPreset}
                onChange={(e) => setIchimokuPreset(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="Crypto">Crypto (20 / 60 / 120 / 30)</option>
                <option value="Classic">Classic (9 / 26 / 52 / 26)</option>
                <option value="5-Day Week">5-Day Week (7 / 22 / 44 / 22)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Tenkan / Kijun / Span B / Displacement
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Strong Cut Threshold:
              </label>
              <input
                type="number"
                min="2"
                max="5"
                value={strongCutThreshold}
                onChange={(e) => setStrongCutThreshold(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Score &ge; +4 triggers Strong Up, &le; -4 Strong Down
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Chop Score Band:
              </label>
              <input
                type="number"
                min="0"
                max="3"
                value={chopScoreBand}
                onChange={(e) => setChopScoreBand(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Chop zone if in Kumo or |score| &le; {chopScoreBand}
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Kijun Slope Lookback:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={kijunSlopeLen}
                onChange={(e) => setKijunSlopeLen(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Compares Kijun (the blade) slope over N bars
              </span>
            </div>
          </div>
        </div>

        {/* Directional Exposure & Concurrency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span>Directional Exposure & Concurrency Limits</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Max Concurrent BUYs (Longs):
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxBuys}
                onChange={(e) => setMaxBuys(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Prevents over-exposure to market rallies
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Max Concurrent SELLs (Shorts):
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxSells}
                onChange={(e) => setMaxSells(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Prevents over-exposure to market dumps
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Global Active Trades Limit:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxSignalsGlobal}
                onChange={(e) => setMaxSignalsGlobal(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Maximum open trades across all users
              </span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={btcDumpFilter}
                onChange={(e) => setBtcDumpFilter(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0"
              />
              <span className="text-xs font-medium text-slate-200">
                Enable BTC Crash / Dump Filter (Blocks Long signals if BTC 15m/1h drops sharply)
              </span>
            </label>
          </div>
        </div>

        {/* Binance Futures Configuration Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Binance Futures API Connection</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[11px]">CURRENT TRADING MODE</span>
                <span className="font-bold text-white text-sm">
                  {config?.paper_trading ? 'Paper Trading (Simulation Mode)' : 'Live Binance Futures (Real Orders)'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                config?.binance_connected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {config?.binance_connected ? 'API Key Detected' : 'Safety Paper Mode Active'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">API Credentials Setup:</div>
              <p>
                To enable live order placement on Binance Futures, set <code>BINANCE_API_KEY</code> and <code>BINANCE_API_SECRET</code> in the project's environment variables.
              </p>
              <p>
                In Paper Trading mode, all market prices, technical indicators, and loss recovery mathematics run with live real-time Binance prices with zero financial risk.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-rose-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
};
