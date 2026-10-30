import React, { useState } from 'react';
import { 
  Send, 
  Terminal, 
  Bot, 
  User as UserIcon, 
  Check, 
  Copy, 
  Globe, 
  Sparkles,
  Shield,
  HelpCircle
} from 'lucide-react';
import { TelegramMessage, User } from '../types';

interface TelegramSimulatorTabProps {
  messages: TelegramMessage[];
  users: User[];
  onSendMessage: (chatId: string, text: string, username: string, fullName: string) => void;
  onSendCallback: (chatId: string, callbackData: string) => void;
  appUrl: string;
}

export const TelegramSimulatorTab: React.FC<TelegramSimulatorTabProps> = ({
  messages,
  users,
  onSendMessage,
  onSendCallback,
  appUrl,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string>(
    users[0]?.chat_id || '1088492011'
  );
  const [inputCommand, setInputCommand] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentUser = users.find((u) => u.chat_id === selectedChatId) || users[0];
  const webhookUrl = `${window.location.origin}/webhook`;

  const quickCommands = [
    { label: '/status', cmd: '/status', desc: 'Current trades & loss pool' },
    { label: '/menu', cmd: '/menu', desc: 'Command guide' },
    { label: '/start', cmd: '/start', desc: 'User registration' },
    { label: '/my_off', cmd: '/my_off', desc: 'Pause personal signals' },
    { label: '/my_on', cmd: '/my_on', desc: 'Resume personal signals' },
    { label: '/bot_on', cmd: '/bot_on', desc: 'Admin: Start bot' },
    { label: '/bot_off', cmd: '/bot_off', desc: 'Admin: Pause bot' },
    { label: '/users', cmd: '/users', desc: 'Admin: Member list' },
    { label: '/toggle_paper', cmd: '/toggle_paper', desc: 'Admin: Switch live/paper' },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCommand.trim() || !currentUser) return;
    onSendMessage(
      currentUser.chat_id,
      inputCommand.trim(),
      currentUser.username,
      currentUser.full_name
    );
    setInputCommand('');
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left 2 Cols: Telegram Chat Terminal */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[750px]">
        
        {/* Terminal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">RedBull Master Bot Simulator</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                  WEBHOOK ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive Telegram bot simulation with Sinhala & English responses and inline buttons.
              </p>
            </div>
          </div>

          {/* User Persona Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Active Persona:</span>
            <select
              value={selectedChatId}
              onChange={(e) => setSelectedChatId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-rose-500"
            >
              {users.map((u) => (
                <option key={u.chat_id} value={u.chat_id}>
                  {u.full_name} {u.is_admin ? '(Admin)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 font-sans">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No messages yet. Send a command like <code className="text-rose-400">/status</code> or <code className="text-rose-400">/start</code> below.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.is_from_bot ? 'items-start' : 'items-end'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                  <span>{msg.sender_name}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.is_from_bot
                      ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-sm'
                      : 'bg-rose-600 text-white rounded-tr-sm'
                  }`}
                >
                  {/* HTML formatted message output */}
                  <div
                    dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                    className="whitespace-pre-wrap font-sans space-y-1"
                  />

                  {/* Inline Buttons (Interactive callbacks) */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/80 space-y-1.5">
                      {msg.buttons.map((row, rIdx) => (
                        <div key={rIdx} className="flex flex-wrap gap-1.5">
                          {row.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => onSendCallback(msg.chat_id, btn.callback_data)}
                              className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg text-[11px] font-semibold transition-colors border border-slate-600/70 shadow-sm flex items-center gap-1"
                            >
                              <span>{btn.text}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Command Chips */}
        <div className="p-2 bg-slate-900 border-t border-slate-800 overflow-x-auto flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 uppercase font-semibold pl-2 shrink-0">
            Quick:
          </span>
          {quickCommands.map((q) => (
            <button
              key={q.cmd}
              onClick={() => {
                setInputCommand(q.cmd);
                if (currentUser) {
                  onSendMessage(
                    currentUser.chat_id,
                    q.cmd,
                    currentUser.username,
                    currentUser.full_name
                  );
                }
              }}
              className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md whitespace-nowrap transition-colors"
              title={q.desc}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Type Telegram command as ${currentUser?.full_name || 'Member'} (e.g. /status, /skip 139)...`}
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

      </div>

      {/* Right Col: Webhook & Integration Information */}
      <div className="space-y-6">
        
        {/* Real Webhook URL Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-rose-500" />
            <span>Real Telegram Webhook Setup</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            This application provides a live Telegram Webhook endpoint compliant with Telegram Bot API specifications.
          </p>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-300">Live Webhook Endpoint:</span>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300 overflow-hidden">
              <span className="truncate flex-1">{webhookUrl}</span>
              <button
                onClick={handleCopyWebhook}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Copy Webhook URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">Set Webhook via Telegram API:</div>
            <code className="block bg-slate-900 p-2 rounded text-[10px] text-emerald-400 overflow-x-auto whitespace-pre font-mono">
              curl -F "url={webhookUrl}" https://api.telegram.org/bot&lt;YOUR_TELEGRAM_TOKEN&gt;/setWebhook
            </code>
          </div>
        </div>

        {/* Telegram Inline Button Architecture Explained */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Loss Recovery Telegram Mechanics</span>
          </h3>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-400">1.</span>
              <p>
                <b>Skip Trade & Refund:</b> If a user cannot take a trade on Binance or misses the signal, clicking <i>[🚫 Skip Trade]</i> releases the trade slot and instantly refunds the attached loss portion back into their Global Loss Pool.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-400">2.</span>
              <p>
                <b>Take Profit (TP):</b> When a trade reaches TP, the attached loss is marked as recovered, incrementing the user's recovery step counter.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-rose-400">3.</span>
              <p>
                <b>Stop Loss (SL):</b> If SL is hit, the margin risk deficit is accumulated into the loss pool and recovered incrementally across subsequent signals.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
