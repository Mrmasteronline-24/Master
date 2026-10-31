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
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const quickCommands = [
    { label: '01. Normal Trade', cmd: '/test_signal SOL normal', desc: '01. Loss නැති Trade Signal' },
    { label: '02. Loss Trade', cmd: '/test_signal SOL loss', desc: '02. Loss Trade Signal' },
    { label: '03. SL to Entry', cmd: '/be', desc: '03. Stop Loss එක Entry Point එකට ගන්න' },
    { label: '04. Time Expired', cmd: '/timeout', desc: '04. කාසියට ලබාදී ඇති කාලය අවසන් close කරන්න' },
    { label: '05. Final Report', cmd: '/report', desc: '05. දවස අවසානයේ එන Final Report එක' },
    { label: '08. /ok (Mute)', cmd: '/ok', desc: '08. Reminder alerts mute කරන ලදී' },
    { label: '/status', cmd: '/status', desc: 'Current trades & loss pool' },
    { label: '/wait_on', cmd: '/wait_on', desc: 'Wait Mode On (Losses counted separately & reminders muted)' },
    { label: '/wait_off', cmd: '/wait_off', desc: 'Wait Mode Off (Resume normal)' },
    { label: '/positions', cmd: '/positions', desc: 'Active trades list' },
    { label: '/whitelist', cmd: '/whitelist', desc: 'Whitelisted coins' },
    { label: '/help', cmd: '/help', desc: 'Full command guide' },
  ];

  const handleCopyFromMessage = (msgId: string, text: string) => {
    // Extract code block or full text
    const match = text.match(/<code>(.*?)<\/code>/);
    const toCopy = match ? match[1].replace(/<[^>]*>?/gm, '') : text.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(toCopy);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

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

  const triggerTestCommand = (cmd: string) => {
    if (!currentUser) return;
    onSendMessage(
      currentUser.chat_id,
      cmd,
      currentUser.username,
      currentUser.full_name
    );
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
                Interactive Telegram bot simulation with Sinhala & English trade signals per requirements.
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
              No messages yet. Click one of the test buttons below or send <code className="text-rose-400">/test_signal</code>.
            </div>
          ) : (
            messages.map((msg) => {
              const hasTradeInfo = msg.text.includes('Coin:') || msg.text.includes('Target Tp') || msg.text.includes('Stop Loss');
              return (
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
                    className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm relative group ${
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

                    {/* 05. Quick Copy Button on Bot Trade Messages */}
                    {msg.is_from_bot && hasTradeInfo && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">05. One-Click Copy</span>
                        <button
                          onClick={() => handleCopyFromMessage(msg.id, msg.text)}
                          className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy (Coin + TP + SL)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

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
              );
            })
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
            placeholder={`Type Telegram command as ${currentUser?.full_name || 'Member'} (e.g. /status, /be, /timeout, /copy)...`}
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

      {/* Right Col: 5 Requirements Verification & Webhook Setup */}
      <div className="space-y-6">
        
        {/* 🎯 Interactive Verification Panel for the 10 Specific Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Alerts 1 - 10 Verification</h3>
              <p className="text-[11px] text-slate-400">මම ඉල්ලූ Alerts 10 නිශ්චිත අච්චුව අනුව පරීක්ෂා කරන්න</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {[
              { id: 1, title: '01. Loss නැති Trade', desc: 'Coin, Deraction, Targert Tp, Stop Loss, Margin, Recovery Loss, Pool, Duration' },
              { id: 2, title: '02. Loss Trade (Recovery)', desc: 'Coin, Deraction, Targert Tp, Stop Loss, Margin, Recovery Loss, Pool, Duration' },
              { id: 3, title: '03. Stop Loss to Entry Point', desc: 'Coin, Entry Price, "Stop Loss එක ඉහත අගයට වෙනස් කරන්න"' },
              { id: 4, title: '04. Time Expired Alert', desc: 'Coin, "කාසියට ලබාදී ඇති කාලය අවසන් close කරන්න."' },
              { id: 5, title: '05. Final Performance Report', desc: '📊 FINAL PERFORMANCE REPORT (Wins, Losses, Blacklisted, Top Coins)' },
              { id: 6, title: '06. Take Profit (Win)! 🟢', desc: '🎯 TAKE PROFIT (WIN)! 🟢 (Coin, Profit, Exit Price)' },
              { id: 7, title: '07. Stop Loss (Loss)! 🔴', desc: '🛑 STOP LOSS (LOSS)! 🔴 (Coin, Loss Amount, Exit Price)' },
              { id: 8, title: '08. Reminder /Ok (Mute)', desc: '✅ Reminder alerts mute කරන ලදී!' },
              { id: 9, title: '09. විනාඩි 10ක් Reminder වැදුනු පසු', desc: 'ℹ️ Reminder Auto-Stopped: (#110) INTCUSDT සඳහා විනාඩි 10 ක් සම්පූර්ණ වූ බැවින්...' },
              { id: 10, title: '10. 3 වරකට වඩා Loss වූ විට', desc: '🚫 MAX LOSS REACHED (BLACKLISTED)! 🔴 (Auto Replacement)' },
            ].map((al) => (
              <button
                key={al.id}
                onClick={async () => {
                  try {
                    await fetch(`/api/test/alerts/${al.id}?chatId=${selectedChatId}`);
                    if (currentUser) {
                      triggerTestCommand(`/status`);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-all flex items-start gap-2.5 group"
              >
                <span className="px-1.5 py-0.5 bg-slate-800 text-white font-mono text-[10px] font-bold rounded mt-0.5 shrink-0">
                  {al.id < 10 ? `0${al.id}` : al.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                    {al.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {al.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

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

      </div>

    </div>
  );
};
