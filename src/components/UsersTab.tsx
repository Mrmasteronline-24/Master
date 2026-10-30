import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Sliders, 
  Plus, 
  Minus, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  TrendingDown,
  Percent,
  Play,
  Pause
} from 'lucide-react';
import { User } from '../types';

interface UsersTabProps {
  users: User[];
  onUpdateUser: (userData: Partial<User> & { chat_id: string }) => void;
  onUserAction: (chatId: string, action: string, value?: number) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onUpdateUser,
  onUserAction,
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [adjustLossUser, setAdjustLossUser] = useState<User | null>(null);
  const [adjustLossDelta, setAdjustLossDelta] = useState<string>('0.50');

  const approvedUsers = users.filter((u) => u.is_approved === 1);
  const pendingUsers = users.filter((u) => u.is_approved === 0);
  const totalLossPool = users.reduce((sum, u) => sum + u.global_loss_pool, 0);
  const totalRecovered = users.reduce((sum, u) => sum + u.global_loss_completed, 0);

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
  };

  const handleApplyLossAdjustment = (isAdd: boolean) => {
    if (!adjustLossUser) return;
    const delta = parseFloat(adjustLossDelta) || 0;
    const finalDelta = isAdd ? delta : -delta;
    onUserAction(adjustLossUser.chat_id, 'adjust_loss', finalDelta);
    setAdjustLossUser(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approved Members */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Approved Members</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {approvedUsers.length}
            </span>
            <span className="text-xs text-slate-500">
              / {users.length} Total Registered
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {pendingUsers.length > 0 ? (
              <span className="text-amber-400 font-semibold">
                ⚠️ {pendingUsers.length} Pending Approval
              </span>
            ) : (
              'All members approved'
            )}
          </div>
        </div>

        {/* Global Loss Pool Aggregate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Loss Pool</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">
              ${totalLossPool.toFixed(4)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Deficits queued for multi-trade recovery
          </div>
        </div>

        {/* Total Recovered Losses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Completed Recoveries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              ${totalRecovered.toFixed(4)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Systematically reclaimed through disciplined TP
          </div>
        </div>

        {/* Risk Formula Standards */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Default Risk Baseline</span>
            <Sliders className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xs font-mono text-slate-200">
            <div>Margin: $0.80 | 10x Lev</div>
            <div className="text-slate-400">SL: 27% | TP: 30% | RTP: 15%</div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Max Recovery Cap: $0.20 / trade
          </div>
        </div>

      </div>

      {/* Pending Approvals Notice */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  {pendingUsers.length} New Member(s) Waiting for Approval
                </h3>
                <p className="text-xs text-amber-300/80">
                  Users registered via Telegram /start command must be approved by Admin before receiving trading signals.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map((u) => {
          const isPending = u.is_approved === 0;
          const isActive = u.is_active === 1;

          return (
            <div
              key={u.chat_id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 transition-all ${
                isPending
                  ? 'border-amber-800/70 bg-amber-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Member Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">
                      {u.full_name || 'Member'}
                    </span>
                    <span className="text-xs text-slate-400">
                      @{u.username || 'user'}
                    </span>
                    {u.is_admin === 1 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>Chat ID: {u.chat_id}</span>
                    <span>•</span>
                    <span>{u.active_trades_count || 0}/{u.max_user_trades} Open Trades</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isPending
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      : isActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPending ? 'PENDING' : isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>

              {/* Loss Recovery Pool Box */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                    <span>Personal Loss Recovery Pool</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAdjustLossUser(u)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/60 rounded border border-rose-800/60 transition-colors"
                    >
                      Adjust Loss Pool
                    </button>
                    {u.global_loss_pool > 0 && (
                      <button
                        onClick={() => onUserAction(u.chat_id, 'reset_loss')}
                        className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
                        title="Clear loss pool to $0.00"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Current Loss</div>
                    <div className="text-sm font-bold text-rose-400">
                      ${u.global_loss_pool.toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Recovered</div>
                    <div className="text-sm font-bold text-emerald-400">
                      ${u.global_loss_completed.toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Step Counter</div>
                    <div className="text-sm font-bold text-amber-300">
                      Step #{u.loss_recovery_step}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Settings Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-800/40 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">BASE MARGIN</span>
                  <span className="font-bold text-slate-200">${u.base_margin.toFixed(2)}</span>
                </div>
                <div className="bg-slate-800/40 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">LEVERAGE</span>
                  <span className="font-bold text-slate-200">{u.leverage}x</span>
                </div>
                <div className="bg-slate-800/40 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">STOP LOSS</span>
                  <span className="font-bold text-rose-400">{u.margin_sl_pct}%</span>
                </div>
                <div className="bg-slate-800/40 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-500 block text-[10px]">FAST TP</span>
                  <span className="font-bold text-emerald-400">{u.fast_tp_pct}%</span>
                </div>
              </div>

              {/* Trading Window */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Trading Window:{' '}
                    {u.user_custom_time_enabled === 1
                      ? `${String(u.user_start_hour).padStart(2, '0')}:${String(u.user_start_minute).padStart(2, '0')} - ${String(u.user_end_hour).padStart(2, '0')}:${String(u.user_end_minute).padStart(2, '0')}`
                      : '24/7 Unlimited'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  RTP Rate: {u.rtp_pct}%
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setEditingUser({ ...u })}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Risk Parameters</span>
                </button>

                <div className="flex items-center gap-2">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => onUserAction(u.chat_id, 'approve')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => onUserAction(u.chat_id, 'reject')}
                        className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onUserAction(u.chat_id, 'toggle_active')}
                        className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                          isActive
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
                            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                        }`}
                        title={isActive ? 'Pause User Signals' : 'Resume User Signals'}
                      >
                        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Edit Parameters Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-rose-500" />
              <span>Edit Risk Parameters: {editingUser.full_name}</span>
            </h3>

            <form onSubmit={handleSaveParams} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Margin ($):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={editingUser.base_margin}
                    onChange={(e) => setEditingUser({ ...editingUser, base_margin: parseFloat(e.target.value) || 0.8 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Leverage (x):</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingUser.leverage}
                    onChange={(e) => setEditingUser({ ...editingUser, leverage: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Margin SL (%):</label>
                  <input
                    type="number"
                    step="1"
                    value={editingUser.margin_sl_pct}
                    onChange={(e) => setEditingUser({ ...editingUser, margin_sl_pct: parseFloat(e.target.value) || 27 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fast TP (%):</label>
                  <input
                    type="number"
                    step="1"
                    value={editingUser.fast_tp_pct}
                    onChange={(e) => setEditingUser({ ...editingUser, fast_tp_pct: parseFloat(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Recovery RTP Rate (%):</label>
                  <input
                    type="number"
                    step="1"
                    value={editingUser.rtp_pct}
                    onChange={(e) => setEditingUser({ ...editingUser, rtp_pct: parseFloat(e.target.value) || 15 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Concurrent Trades:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editingUser.max_user_trades}
                    onChange={(e) => setEditingUser({ ...editingUser, max_user_trades: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Trading Window Hours */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableCustomTime"
                    checked={editingUser.user_custom_time_enabled === 1}
                    onChange={(e) => setEditingUser({ ...editingUser, user_custom_time_enabled: e.target.checked ? 1 : 0 })}
                    className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <label htmlFor="enableCustomTime" className="text-slate-300 font-medium">
                    Enable Personal Trading Time Window
                  </label>
                </div>

                {editingUser.user_custom_time_enabled === 1 && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Start Hour:</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={editingUser.user_start_hour}
                        onChange={(e) => setEditingUser({ ...editingUser, user_start_hour: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">End Hour:</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={editingUser.user_end_hour}
                        onChange={(e) => setEditingUser({ ...editingUser, user_end_hour: parseInt(e.target.value, 10) || 23 })}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm"
                >
                  Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Loss Modal */}
      {adjustLossUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-500" />
              <span>Adjust Loss Pool: {adjustLossUser.full_name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Current pool: <b>${adjustLossUser.global_loss_pool.toFixed(4)}</b>. Adding loss attaches partial recovery to upcoming trades.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Amount in USD ($):
              </label>
              <input
                type="number"
                step="0.10"
                min="0.01"
                value={adjustLossDelta}
                onChange={(e) => setAdjustLossDelta(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleApplyLossAdjustment(true)}
                className="px-3 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Loss (+${adjustLossDelta})</span>
              </button>
              <button
                onClick={() => handleApplyLossAdjustment(false)}
                className="px-3 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-1 shadow-sm"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Reduce (-${adjustLossDelta})</span>
              </button>
            </div>
            <div className="text-center pt-1">
              <button
                onClick={() => setAdjustLossUser(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
