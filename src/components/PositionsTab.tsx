import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Ban, 
  Clock, 
  DollarSign, 
  Percent, 
  Activity,
  History,
  ShieldCheck,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { UserPosition } from '../types';

interface PositionsTabProps {
  positions: UserPosition[];
  onClosePosition: (id: number, reason: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'SKIPPED_REFUND') => void;
  onSkipPosition: (id: number) => void;
  onBreakevenAlert?: (id: number) => void;
  onTimeoutAlert?: (id: number) => void;
}

export const PositionsTab: React.FC<PositionsTabProps> = ({
  positions,
  onClosePosition,
  onSkipPosition,
  onBreakevenAlert,
  onTimeoutAlert,
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (pos: UserPosition) => {
    const text = `${pos.symbol} TP: ${pos.tp_price.toFixed(4)} SL: ${pos.sl_price.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(pos.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activePositions = positions.filter((p) => p.is_open === 1);
  const closedPositions = positions.filter((p) => p.is_open === 0);

  const totalOpenMargin = activePositions.reduce((sum, p) => sum + p.margin, 0);
  const totalAttachedLoss = activePositions.reduce((sum, p) => sum + p.attached_loss, 0);
  const totalUnrealizedPnl = activePositions.reduce((sum, p) => sum + (p.pnl || 0), 0);

  const closedWins = closedPositions.filter((p) => (p.pnl || 0) > 0 || p.close_reason === 'TP_HIT').length;
  const winRate = closedPositions.length > 0 ? (closedWins / closedPositions.length) * 100 : 100;

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Positions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Open Member Trades</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {activePositions.length}
            </span>
            <span className="text-xs text-slate-500">
              Active Positions
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Total Allocated Margin: ${totalOpenMargin.toFixed(2)}
          </div>
        </div>

        {/* Live Unrealized PnL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Live Unrealized PnL</span>
            {totalUnrealizedPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(4)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Dynamic Real-time Mark Price Tracking
          </div>
        </div>

        {/* In-Flight Loss Recovery */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>In-Flight Loss Recovery</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300">
              ${totalAttachedLoss.toFixed(4)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Attached to ongoing trades (Recovered upon TP)
          </div>
        </div>

        {/* Historical Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Historical Win Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {winRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">
              ({closedWins}/{closedPositions.length} closed)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Disciplined SL & Fast TP formula
          </div>
        </div>

      </div>

      {/* Tabs Switcher: Active vs History */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              viewMode === 'active'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Active Positions ({activePositions.length})</span>
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              viewMode === 'history'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Closed History ({closedPositions.length})</span>
          </button>
        </div>
      </div>

      {/* Active Positions Table */}
      {viewMode === 'active' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Signal & Coin</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Side / Lev</th>
                  <th className="py-3 px-4">Entry / Current Price</th>
                  <th className="py-3 px-4">Take Profit / Stop Loss</th>
                  <th className="py-3 px-4">Margin & Attached Loss</th>
                  <th className="py-3 px-4">Live PnL</th>
                  <th className="py-3 px-4 text-right">Actions & Simulation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activePositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      No open positions at this moment. Market scanner is searching for pivot bounce opportunities.
                    </td>
                  </tr>
                ) : (
                  activePositions.map((pos) => {
                    const isLong = pos.side === 'BUY';
                    const pnlPositive = (pos.pnl || 0) >= 0;

                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                        
                        {/* Signal & Symbol */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 text-[11px]">
                              #{pos.signal_num}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {pos.symbol}
                            </span>
                          </div>
                          {/* Duration Tracker (04) */}
                          {(() => {
                            const elapsedMins = Math.round((Date.now() - pos.opened_at) / 60000);
                            const totalLimit = pos.duration_mins || 60;
                            const isExpired = elapsedMins >= totalLimit;
                            return (
                              <div className="mt-1 flex items-center gap-1 text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded font-mono ${
                                  isExpired 
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  ⏱️ {elapsedMins}m / {totalLimit}m {isExpired ? '(කාලය අවසන්)' : ''}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Member */}
                        <td className="py-3.5 px-4 font-medium text-slate-300">
                          {pos.user_name || pos.chat_id}
                        </td>

                        {/* Side & Leverage */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isLong 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                                : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                            }`}>
                              {pos.side}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {pos.leverage}x
                            </span>
                          </div>
                        </td>

                        {/* Entry / Current */}
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="text-slate-300">Entry: ${pos.entry_price.toFixed(4)}</div>
                          <div className="text-white font-semibold">Mark: ${pos.current_price.toFixed(4)}</div>
                        </td>

                        {/* TP / SL & Breakeven Status */}
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-emerald-400 font-semibold">Target TP: ${pos.tp_price.toFixed(4)}</span>
                            {pos.attached_loss > 0 && (
                              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/50">
                                Full Recovery
                              </span>
                            )}
                          </div>
                          {pos.base_tp_price && pos.attached_loss > 0 && (
                            <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5">
                              <span>Base TP: ${pos.base_tp_price.toFixed(4)}</span>
                              {pos.be_alert_sent ? (
                                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 py-0.2 rounded font-bold">
                                  BE Locked 🛡️
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1 py-0.2 rounded">
                                  BE Pending
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-rose-400 font-medium mt-0.5">SL: ${pos.sl_price.toFixed(4)}</div>
                          
                          {/* 05. Quick Copy Button */}
                          <button
                            onClick={() => handleCopy(pos)}
                            className="mt-1.5 px-2 py-0.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded text-[10px] flex items-center gap-1 transition-colors"
                            title="05. Copy Coin, TP and SL"
                          >
                            {copiedId === pos.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-indigo-400" />
                                <span>Copy (Coin+TP+SL)</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Margin & Attached Loss */}
                        <td className="py-3.5 px-4 text-xs font-mono">
                          <div className="text-slate-200">${pos.margin.toFixed(2)} Margin</div>
                          {pos.attached_loss > 0 ? (
                            <div className="text-amber-400 text-[11px] font-medium flex items-center gap-1">
                              <span>+${pos.attached_loss.toFixed(4)} loss recovery</span>
                            </div>
                          ) : (
                            <div className="text-slate-500 text-[11px]">No loss attached</div>
                          )}
                        </td>

                        {/* Live PnL */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className={`font-bold text-sm ${pnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pnlPositive ? '+' : ''}${pos.pnl?.toFixed(4) || '0.0000'}
                          </div>
                          <div className={`text-[11px] ${pnlPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {pnlPositive ? '+' : ''}{pos.pnl_pct?.toFixed(2) || '0.00'}%
                          </div>
                        </td>

                        {/* Actions & Simulation */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 03. Move SL to Entry Button */}
                            <button
                              onClick={() => onBreakevenAlert?.(pos.id)}
                              className="px-2 py-1 bg-amber-600/90 hover:bg-amber-500 text-white rounded text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1"
                              title="03. Stop Loss එක Entry Point එකට ගැනීමේ පණිවිඩය යවන්න"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>SL to Entry</span>
                            </button>

                            {/* 04. Time Expired Alert Button */}
                            <button
                              onClick={() => onTimeoutAlert?.(pos.id)}
                              className="px-2 py-1 bg-orange-600/90 hover:bg-orange-500 text-white rounded text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1"
                              title="04. කාසියට ලබාදී ඇති කාලය අවසන් close කරන්න පණිවිඩය යවන්න"
                            >
                              <Clock className="w-3 h-3" />
                              <span>කාලය අවසන්</span>
                            </button>

                            <button
                              onClick={() => onClosePosition(pos.id, 'TP_HIT')}
                              className="px-2 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold transition-colors shadow-sm"
                              title="Simulate Take Profit Hit"
                            >
                              Hit TP
                            </button>
                            <button
                              onClick={() => onClosePosition(pos.id, 'SL_HIT')}
                              className="px-2 py-1 bg-rose-700/80 hover:bg-rose-600 text-white rounded text-[11px] font-semibold transition-colors shadow-sm"
                              title="Simulate Stop Loss Hit"
                            >
                              Hit SL
                            </button>
                            <button
                              onClick={() => onSkipPosition(pos.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-[11px] font-semibold transition-colors shadow-sm"
                              title="Skip trade & refund attached loss to member pool"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => onClosePosition(pos.id, 'MANUAL_CLOSE')}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                              title="Close at market price"
                            >
                              Close
                            </button>
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
      ) : (
        /* Closed Positions History */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Signal & Coin</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Side / Margin</th>
                  <th className="py-3 px-4">Entry / TP / SL</th>
                  <th className="py-3 px-4">Final PnL</th>
                  <th className="py-3 px-4">Recovery Status</th>
                  <th className="py-3 px-4">Closed Reason</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {closedPositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No closed trades history yet.
                    </td>
                  </tr>
                ) : (
                  closedPositions.map((pos) => {
                    const isWin = (pos.pnl || 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">
                          #{pos.signal_num} {pos.symbol}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {pos.user_name || pos.chat_id}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {pos.side}
                          </span>
                          <span className="ml-1.5 text-slate-400 font-mono">${pos.margin} ({pos.leverage}x)</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          Entry: ${pos.entry_price.toFixed(4)} | TP: ${pos.tp_price.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                            {isWin ? '+' : ''}${pos.pnl?.toFixed(4) || '0.0000'} ({pos.pnl_pct?.toFixed(2) || '0.00'}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {pos.attached_loss > 0 ? (
                            <span className="text-amber-400">
                              +${pos.attached_loss.toFixed(4)} recovered
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            pos.close_reason === 'TP_HIT'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : pos.close_reason === 'SL_HIT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : pos.close_reason === 'SKIPPED_REFUND'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {pos.close_reason || 'CLOSED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {pos.closed_at ? new Date(pos.closed_at).toLocaleTimeString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
