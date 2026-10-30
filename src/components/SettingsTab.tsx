import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  KeyRound, 
  Sliders, 
  Save, 
  CheckCircle2, 
  Activity,
  Layers,
  Send,
  Bot,
  Radio
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

  // Telegram Bot configurations
  const [telegramBotToken, setTelegramBotToken] = useState(config?.telegram_bot_token ?? '');
  const [adminChatId, setAdminChatId] = useState(config?.admin_chat_id ?? '1088492011');
  const [autoApproveUsers, setAutoApproveUsers] = useState(config?.auto_approve_users ?? true);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

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
      telegram_bot_token: telegramBotToken.trim(),
      admin_chat_id: adminChatId.trim(),
      auto_approve_users: Boolean(autoApproveUsers),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendTestMessage = async () => {
    setTestingTelegram(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: adminChatId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`✅ ${data.message || 'Test alert dispatched successfully!'}`);
      } else {
        setTestResult(`❌ Failed to send: ${data.error || 'Check bot token & chat ID'}`);
      }
    } catch (e: any) {
      setTestResult(`❌ Network Error: ${e.message}`);
    } finally {
      setTestingTelegram(false);
    }
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

        {/* Telegram Bot Live Connection & Polling Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Telegram Bot Live Integration & Long Polling Engine</span>
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              config?.telegram_connected
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              <Radio className={`w-3 h-3 ${config?.telegram_connected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
              <span>
                {config?.telegram_connected 
                  ? `Connected (@${config.telegram_bot_username || 'Bot'})` 
                  : 'Polling Ready / Enter Token'}
              </span>
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Telegram Bot Token:
                </label>
                <input
                  type="password"
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  From @BotFather. Can also be set as <code>TELEGRAM_BOT_TOKEN</code> in Railway.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Admin Chat ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1088492011"
                  value={adminChatId}
                  onChange={(e) => setAdminChatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Your personal Telegram numeric chat ID. Or type <code>/set_admin</code> in Telegram.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveUsers}
                  onChange={(e) => setAutoApproveUsers(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    Auto-Approve New Telegram Members (Recommended)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    When enabled, any member who starts the bot with <code>/start</code> is automatically approved and active to immediately receive trading signals without waiting for manual authorization.
                  </p>
                </div>
              </label>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                testResult.startsWith('✅') 
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' 
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}>
                {testResult}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-400">
                ⚡ <b>Zero-Config Long Polling:</b> Commands like <code>/start</code>, <code>/status</code>, <code>/test_signal</code> work directly in Telegram without needing public webhooks.
              </p>
              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={testingTelegram}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingTelegram ? 'Sending Test...' : 'Send Test Alert to Telegram'}</span>
              </button>
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
