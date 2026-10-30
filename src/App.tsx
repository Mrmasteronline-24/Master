import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Layers, 
  Users, 
  Send, 
  Settings, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { Header } from './components/Header';
import { ScannerTab } from './components/ScannerTab';
import { PositionsTab } from './components/PositionsTab';
import { UsersTab } from './components/UsersTab';
import { TelegramSimulatorTab } from './components/TelegramSimulatorTab';
import { SettingsTab } from './components/SettingsTab';
import { NewSignalModal } from './components/NewSignalModal';
import { BotConfig, CoinMarket, User, UserPosition, TelegramMessage } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'positions' | 'scanner' | 'users' | 'telegram' | 'settings'>('positions');
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [metrics, setMetrics] = useState<{
    openTrades: number;
    openBuys: number;
    openSells: number;
    totalUsers: number;
    approvedUsers: number;
    whitelistedCount: number;
    blacklistedCount: number;
    totalLossPool: number;
    totalLossRecovered: number;
  } | null>(null);

  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Fetch all live data from server
  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [statusRes, coinsRes, posRes, usersRes, tgRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/coins'),
        fetch('/api/positions'),
        fetch('/api/users'),
        fetch('/api/telegram/messages'),
      ]);

      if (statusRes.ok) {
        const s = await statusRes.json();
        setConfig(s.config);
        setMetrics(s.metrics);
      }
      if (coinsRes.ok) {
        setCoins(await coinsRes.json());
      }
      if (posRes.ok) {
        setPositions(await posRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      if (tgRes.ok) {
        setTelegramMessages(await tgRes.json());
      }
    } catch (e) {
      console.warn('Error fetching bot data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto polling every 4 seconds to reflect live market ticks and positions
    const timer = setInterval(loadData, 4000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Master Bot Run/Pause toggle
  const handleToggleBot = async () => {
    if (!config) return;
    try {
      const newPaused = !config.is_paused;
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paused: newPaused }),
      });
      if (res.ok) {
        showToast(newPaused ? 'Bot Paused (Signal generation stopped)' : 'Bot Resumed (Active scanning)');
        loadData();
      }
    } catch {
      showToast('Failed to update bot status');
    }
  };

  // Paper / Live Binance Trading toggle
  const handleTogglePaper = async () => {
    if (!config) return;
    try {
      const newPaper = !config.paper_trading;
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_trading: newPaper }),
      });
      if (res.ok) {
        showToast(newPaper ? 'Switched to Paper Trading Mode' : 'Switched to Live Binance Futures Mode');
        loadData();
      }
    } catch {
      showToast('Failed to toggle paper trading');
    }
  };

  // Close Position (Hit TP, Hit SL, Market Close)
  const handleClosePosition = async (id: number, reason: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'SKIPPED_REFUND') => {
    try {
      const res = await fetch(`/api/positions/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        if (reason === 'TP_HIT') {
          showToast('🎯 Take Profit Reached! Loss recovery completed and profit recorded.');
        } else if (reason === 'SL_HIT') {
          showToast('🛑 Stop Loss Hit! Deficit added to User Loss Pool.');
        } else {
          showToast('Position closed at market price');
        }
        loadData();
      }
    } catch {
      showToast('Failed to close position');
    }
  };

  // Skip position and refund attached loss
  const handleSkipPosition = async (id: number) => {
    try {
      const res = await fetch(`/api/positions/${id}/skip`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Trade cancelled and attached loss refunded to Member Pool.');
        loadData();
      }
    } catch {
      showToast('Failed to skip trade');
    }
  };

  // Whitelist operations
  const handleAddToWhitelist = async (symbol: string) => {
    try {
      const res = await fetch('/api/coins/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, action: 'add' }),
      });
      if (res.ok) {
        showToast(`Added ${symbol.toUpperCase()} to Whitelist (FWL)`);
        loadData();
      }
    } catch {
      showToast('Failed to update whitelist');
    }
  };

  const handleRemoveFromWhitelist = async (symbol: string) => {
    try {
      const res = await fetch('/api/coins/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, action: 'remove' }),
      });
      if (res.ok) {
        showToast(`Removed ${symbol} from Whitelist`);
        loadData();
      }
    } catch {
      showToast('Failed to update whitelist');
    }
  };

  const handleResetWhitelist = async () => {
    try {
      const res = await fetch('/api/coins/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'DEFAULT', action: 'reset_default' }),
      });
      if (res.ok) {
        showToast('Reset First Win List (FWL) to original 50 coins');
        loadData();
      }
    } catch {
      showToast('Failed to reset whitelist');
    }
  };

  // Blacklist operations
  const handleAddToBlacklist = async (symbol: string, reason: string) => {
    try {
      const res = await fetch('/api/coins/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, reason, action: 'add' }),
      });
      if (res.ok) {
        showToast(`Added ${symbol} to Blacklist`);
        loadData();
      }
    } catch {
      showToast('Failed to update blacklist');
    }
  };

  const handleRemoveFromBlacklist = async (symbol: string) => {
    try {
      const res = await fetch('/api/coins/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, action: 'remove' }),
      });
      if (res.ok) {
        showToast(`Removed ${symbol} from Blacklist`);
        loadData();
      }
    } catch {
      showToast('Failed to remove from blacklist');
    }
  };

  // Dispatch trade signal (Supports 01 Normal and 02 Loss Recovery with 04 Duration)
  const handleDispatchSignal = async (
    symbol: string, 
    side: 'BUY' | 'SELL', 
    price: number,
    durationMins?: number,
    isLossTrade?: boolean
  ) => {
    try {
      const res = await fetch('/api/signals/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, side, price, durationMins, isLossTrade }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🚀 Dispatched Signal for ${symbol} (${side}) to ${data.dispatchedCount} members!`);
      } else {
        showToast(`⚠️ ${data.message}`);
      }
      loadData();
    } catch {
      showToast('Failed to dispatch signal');
    }
  };

  // 03. Stop Loss එක Entry Point එකට ගැනීමේ Breakeven Alert
  const handleBreakevenAlert = async (id: number) => {
    try {
      const res = await fetch(`/api/positions/${id}/breakeven-alert`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('🛡️ "Stop Loss එක ඉහත අගයට වෙනස් කරන්න" Breakeven Alert එක යවන ලදී!');
        loadData();
      }
    } catch {
      showToast('Failed to trigger Breakeven alert');
    }
  };

  // 04. ලබාදී ඇති කාලය අවසන් වූ විට Close කිරීමේ Timeout Alert
  const handleTimeoutAlert = async (id: number) => {
    try {
      const res = await fetch(`/api/positions/${id}/timeout-alert`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('⏰ "කාසියට ලබාදී ඇති කාලය අවසන් close කරන්න." Alert එක යවන ලදී!');
        loadData();
      }
    } catch {
      showToast('Failed to trigger Timeout alert');
    }
  };

  // User actions
  const handleUpdateUser = async (userData: Partial<User> & { chat_id: string }) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        showToast(`Updated risk parameters for ${userData.chat_id}`);
        loadData();
      }
    } catch {
      showToast('Failed to update user');
    }
  };

  const handleUserAction = async (chatId: string, action: string, value?: number) => {
    try {
      const res = await fetch(`/api/users/${chatId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      if (res.ok) {
        showToast(`User action (${action}) completed`);
        loadData();
      }
    } catch {
      showToast('Failed to execute user action');
    }
  };

  // Telegram simulator
  const handleSendTelegramMessage = async (chatId: string, text: string, username: string, fullName: string) => {
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text, username, fullName }),
      });
      if (res.ok) {
        loadData();
      }
    } catch {
      showToast('Failed to send Telegram message');
    }
  };

  const handleSendTelegramCallback = async (chatId: string, callbackData: string) => {
    try {
      const res = await fetch('/api/telegram/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, callbackData }),
      });
      if (res.ok) {
        showToast('Action processed');
        loadData();
      }
    } catch {
      showToast('Failed to process callback');
    }
  };

  // Update Config
  const handleUpdateConfig = async (newConfig: Partial<BotConfig>) => {
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        loadData();
      }
    } catch {
      showToast('Failed to update config');
    }
  };

  const activePositionsCount = positions.filter((p) => p.is_open === 1).length;
  const pendingUsersCount = users.filter((u) => u.is_approved === 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        config={config}
        metrics={metrics}
        onToggleBot={handleToggleBot}
        onTogglePaper={handleTogglePaper}
        onRefresh={loadData}
        onOpenSignalModal={() => setIsSignalModalOpen(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'positions'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Active Positions ({activePositionsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Market Scanner & FWL ({metrics?.whitelistedCount || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Multi-User Risk Engine ({users.length})</span>
            {pendingUsersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'telegram'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Telegram Bot Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Bot Configurations</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'positions' && (
          <PositionsTab
            positions={positions}
            onClosePosition={handleClosePosition}
            onSkipPosition={handleSkipPosition}
            onBreakevenAlert={handleBreakevenAlert}
            onTimeoutAlert={handleTimeoutAlert}
          />
        )}

        {activeTab === 'scanner' && (
          <ScannerTab
            coins={coins}
            config={config}
            metrics={metrics}
            onAddToWhitelist={handleAddToWhitelist}
            onRemoveFromWhitelist={handleRemoveFromWhitelist}
            onResetWhitelist={handleResetWhitelist}
            onAddToBlacklist={handleAddToBlacklist}
            onRemoveFromBlacklist={handleRemoveFromBlacklist}
            onTriggerSignal={handleDispatchSignal}
            onUpdatePreset={(preset) => handleUpdateConfig({ ichimoku_preset: preset })}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onUpdateUser={handleUpdateUser}
            onUserAction={handleUserAction}
          />
        )}

        {activeTab === 'telegram' && (
          <TelegramSimulatorTab
            messages={telegramMessages}
            users={users}
            onSendMessage={handleSendTelegramMessage}
            onSendCallback={handleSendTelegramCallback}
            appUrl={window.location.origin}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

      </main>

      {/* Manual Signal Modal */}
      <NewSignalModal
        coins={coins}
        isOpen={isSignalModalOpen}
        onClose={() => setIsSignalModalOpen(false)}
        onDispatch={handleDispatchSignal}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        RedBull Loss Recovery Master Bot • Multi-User Binance Futures Algorithmic Engine
      </footer>

    </div>
  );
}
