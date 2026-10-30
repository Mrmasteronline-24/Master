export interface User {
  chat_id: string;
  full_name: string;
  username: string;
  is_approved: number;
  is_active: number;
  is_admin: number;
  base_margin: number;
  leverage: number;
  margin_sl_pct: number;
  fast_tp_pct: number;
  rtp_pct: number;
  blacklist_balance_set: number;
  max_user_trades: number;
  user_start_hour: number;
  user_start_minute: number;
  user_end_hour: number;
  user_end_minute: number;
  user_custom_time_enabled: number;
  is_muted: number;
  global_loss_pool: number;
  global_loss_completed: number;
  loss_recovery_step: number;
  last_interaction: string;
  active_trades_count?: number;
}

export interface UserPosition {
  id: number;
  chat_id: string;
  user_name?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry_price: number;
  current_price: number;
  tp_price: number; // Final target (base TP + recovery TP)
  base_tp_price: number; // Base TP of the coin (before loss recovery addition)
  recovery_tp_price: number; // Final TP with attached loss recovery
  sl_price: number;
  margin: number;
  leverage: number;
  attached_loss: number;
  signal_num: number;
  opened_at: number;
  is_open: number;
  reminders_sent: number;
  be_alert_sent?: boolean; // True once Breakeven message sent when base TP is reached
  duration_mins?: number; // Allocated trade time in minutes (e.g. 60m)
  timeout_alert_sent?: boolean; // True once time expired message is sent
  reminders_auto_stopped?: boolean; // True once 10 min reminder auto-stopped alert is sent
  pnl?: number;
  pnl_pct?: number;
  closed_at?: number;
  close_reason?: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'SKIPPED_REFUND';
}

export interface BotConfig {
  is_paused: boolean;
  paper_trading: boolean;
  is_retuned: boolean;
  max_buys: number;
  max_sells: number;
  max_signals_global: number;
  signal_count: number;
  signal_cooldown_mins: number;
  btc_dump_filter: boolean;
  stale_timeout_hours: number;
  default_trade_duration_mins?: number;
  timezone: string;
  admin_chat_id: string;
  binance_connected: boolean;
  binance_key_preview: string;
  // Telegram Bot integration
  telegram_bot_token?: string;
  telegram_connected?: boolean;
  telegram_bot_username?: string;
  auto_approve_users?: boolean;
  // Ichimoku Itto configurations
  ichimoku_preset: 'Crypto' | 'Classic' | '5-Day Week';
  strong_cut_threshold: number; // default 4
  chop_score_band: number; // default 1
  kijun_slope_len: number; // default 5
}

export interface CoinMarket {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  // Ichimoku Itto calculations
  tenkan: number;
  kijun: number;
  ssaRaw: number;
  ssbRaw: number;
  kumoA: number;
  kumoB: number;
  chikou: number; // +1, -1, 0
  score: number; // -5 to +5
  scorePct: number; // e.g. +80%, -100%
  sanyaku: number; // +1 = 3/3 Aligned Up, -1 = 3/3 Aligned Down, 0 = neither
  inKumo: boolean; // price inside cloud
  noCut: boolean; // in chop zone or |score| <= chop band
  trendText: string; // STRONG UP, UP, CHOP ZONE · NO ACTION, etc.
  signalType: 'STRONG_UP' | 'STRONG_DOWN' | 'ALIGNED_UP' | 'ALIGNED_DOWN' | 'NONE';
  inWhitelist: boolean;
  inBlacklist: boolean;
  blacklistReason?: string;
  magnetKijun?: number;
  magnetSpanB?: number;
  hasActiveTrade?: boolean;
  activeTradeSide?: 'BUY' | 'SELL';
  minNotional?: number;
  isEligible?: boolean;
  feedType?: '5m Klines' | '24h Ticker';
}

export interface TelegramButton {
  text: string;
  callback_data: string;
}

export interface TelegramMessage {
  id: string;
  timestamp: string;
  chat_id: string;
  sender_name: string;
  is_from_bot: boolean;
  text: string;
  buttons?: TelegramButton[][];
}

export interface TradeSignal {
  symbol: string;
  side: 'BUY' | 'SELL';
  current_p: number;
}
