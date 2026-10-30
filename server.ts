import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import { User, UserPosition, BotConfig, CoinMarket, TelegramMessage } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- INITIAL DEFAULT DATABASE STATE ---

const initialBotConfig: BotConfig = {
  is_paused: false,
  paper_trading: true,
  is_retuned: false,
  max_buys: 4,
  max_sells: 4,
  max_signals_global: 10,
  signal_count: 142,
  signal_cooldown_mins: 10,
  btc_dump_filter: true,
  stale_timeout_hours: 6,
  timezone: 'Asia/Colombo',
  admin_chat_id: process.env.ADMIN_CHAT_ID || '1088492011',
  binance_connected: Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET),
  binance_key_preview: process.env.BINANCE_API_KEY 
    ? `...${process.env.BINANCE_API_KEY.slice(-4)}`
    : 'Paper Mode (No Key)',
  telegram_bot_token: process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || process.env.TG_TOKEN || process.env.TG_BOT_TOKEN || '',
  telegram_connected: false,
  telegram_bot_username: '',
  auto_approve_users: true,
  ichimoku_preset: 'Crypto',
  strong_cut_threshold: 4,
  chop_score_band: 1,
  kijun_slope_len: 5,
};

let botConfig: BotConfig = { ...initialBotConfig };

// Whitelist contains only coins that comply with Binance Futures $5 min notional on micro-margins ($0.50 - $1.00 @ 10x)
// High unit price coins (BTCUSDT, ETHUSDT, TAOUSDT, etc.) require $26-$70+ notional and are excluded to prevent order rejection!
const defaultCoinsList = [
  'DOGEUSDT', 'XRPUSDT', 'SUIUSDT', 'NEARUSDT', 'ADAUSDT',
  'PEPEUSDT', '1000BONKUSDT', 'FETUSDT', 'RENDERUSDT', 'ENAUSDT',
  'AVAXUSDT', 'LINKUSDT', 'FILUSDT', 'LTCUSDT', 'UNIUSDT',
  'BICOUSDT', 'WLDUSDT', 'C98USDT', 'HFTUSDT', 'APTUSDT'
];

// Binance Futures Min Notional & Lot-Size requirements
const SYMBOL_NOTIONAL_REQUIREMENTS: Record<string, { minNotional: number; minMargin10x: number; reason?: string }> = {
  BTCUSDT: { minNotional: 70.0, minMargin10x: 7.0, reason: 'Requires min 0.001 BTC lot size (~$68+ notional)' },
  ETHUSDT: { minNotional: 30.0, minMargin10x: 3.0, reason: 'Requires min 0.01 ETH lot size (~$26+ notional)' },
  TAOUSDT: { minNotional: 55.0, minMargin10x: 5.5, reason: 'High unit price & 0.1 lot step (~$52+ notional)' },
  PAXGUSDT: { minNotional: 25.0, minMargin10x: 2.5, reason: 'Gold pegged contract high min notional' },
  AAVEUSDT: { minNotional: 16.0, minMargin10x: 1.6, reason: 'High unit price & 0.1 lot step' },
};

function getSymbolMinNotional(symbol: string): number {
  return SYMBOL_NOTIONAL_REQUIREMENTS[symbol]?.minNotional || 5.0; // standard Binance Futures floor is $5.00
}

function isCoinNotionalEligible(symbol: string, userMargin: number, userLeverage: number): {
  eligible: boolean;
  requiredNotional: number;
  actualNotional: number;
  reason?: string;
} {
  const actualNotional = userMargin * userLeverage;
  const requiredNotional = getSymbolMinNotional(symbol);
  // Safety threshold: Binance rejects < 5.00 USD notional. We require at least 5.50 USD to avoid slippage rejection.
  const effectiveRequired = Math.max(requiredNotional, 5.50);

  if (actualNotional < effectiveRequired) {
    const specialReason = SYMBOL_NOTIONAL_REQUIREMENTS[symbol]?.reason;
    return {
      eligible: false,
      requiredNotional: effectiveRequired,
      actualNotional,
      reason: specialReason 
        ? `${specialReason} (Required: $${effectiveRequired.toFixed(2)}, User: $${actualNotional.toFixed(2)})`
        : `Binance Futures requires min $5.00 notional (User notional: $${actualNotional.toFixed(2)} with margin $${userMargin.toFixed(2)} at ${userLeverage}x)`,
    };
  }

  return { eligible: true, requiredNotional: effectiveRequired, actualNotional };
}

let whitelist: Set<string> = new Set(defaultCoinsList);
let blacklist: Map<string, { reason: string; added_at: string }> = new Map([
  ['LUNAUSDT', { reason: 'High volatility risk', added_at: new Date().toISOString() }],
  ['FTTUSDT', { reason: 'Exchange token risk', added_at: new Date().toISOString() }],
]);

let users: Map<string, User> = new Map([
  [
    '1088492011',
    {
      chat_id: '1088492011',
      full_name: 'Master Admin',
      username: 'master_admin',
      is_approved: 1,
      is_active: 1,
      is_admin: 1,
      base_margin: 1.0,
      leverage: 10,
      margin_sl_pct: 25.0,
      fast_tp_pct: 30.0,
      rtp_pct: 20.0,
      blacklist_balance_set: 0.10,
      max_user_trades: 5,
      user_start_hour: 0,
      user_start_minute: 0,
      user_end_hour: 23,
      user_end_minute: 59,
      user_custom_time_enabled: 0,
      is_muted: 0,
      global_loss_pool: 0.45,
      global_loss_completed: 4.80,
      loss_recovery_step: 3,
      last_interaction: new Date().toISOString(),
    },
  ],
  [
    '982734110',
    {
      chat_id: '982734110',
      full_name: 'Kasun Bandara',
      username: 'kasun_trade_pro',
      is_approved: 1,
      is_active: 1,
      is_admin: 0,
      base_margin: 0.8,
      leverage: 10,
      margin_sl_pct: 27.0,
      fast_tp_pct: 30.0,
      rtp_pct: 15.0,
      blacklist_balance_set: 0.10,
      max_user_trades: 4,
      user_start_hour: 8,
      user_start_minute: 0,
      user_end_hour: 22,
      user_end_minute: 0,
      user_custom_time_enabled: 1,
      is_muted: 0,
      global_loss_pool: 0.82,
      global_loss_completed: 2.45,
      loss_recovery_step: 2,
      last_interaction: new Date().toISOString(),
    },
  ],
  [
    '774819203',
    {
      chat_id: '774819203',
      full_name: 'Nuwan Perera',
      username: 'nuwan_lk',
      is_approved: 1,
      is_active: 1,
      is_admin: 0,
      base_margin: 0.6,
      leverage: 10,
      margin_sl_pct: 27.0,
      fast_tp_pct: 25.0,
      rtp_pct: 15.0,
      blacklist_balance_set: 0.10,
      max_user_trades: 3,
      user_start_hour: 0,
      user_start_minute: 0,
      user_end_hour: 23,
      user_end_minute: 59,
      user_custom_time_enabled: 0,
      is_muted: 0,
      global_loss_pool: 0.0,
      global_loss_completed: 1.20,
      loss_recovery_step: 0,
      last_interaction: new Date().toISOString(),
    },
  ],
  [
    '649201994',
    {
      chat_id: '649201994',
      full_name: 'Chaminda Rathnayake',
      username: 'chaminda_fx',
      is_approved: 0,
      is_active: 0,
      is_admin: 0,
      base_margin: 0.8,
      leverage: 10,
      margin_sl_pct: 27.0,
      fast_tp_pct: 30.0,
      rtp_pct: 15.0,
      blacklist_balance_set: 0.10,
      max_user_trades: 5,
      user_start_hour: 0,
      user_start_minute: 0,
      user_end_hour: 23,
      user_end_minute: 59,
      user_custom_time_enabled: 0,
      is_muted: 0,
      global_loss_pool: 0.0,
      global_loss_completed: 0.0,
      loss_recovery_step: 0,
      last_interaction: new Date().toISOString(),
    },
  ],
]);

let positions: UserPosition[] = [
  {
    id: 101,
    chat_id: '1088492011',
    user_name: 'Master Admin',
    symbol: 'SOLUSDT',
    side: 'BUY',
    entry_price: 182.40,
    current_price: 184.22,
    base_tp_price: 184.50,
    recovery_tp_price: 185.80,
    tp_price: 185.80,
    sl_price: 177.84,
    margin: 1.0,
    leverage: 10,
    attached_loss: 0.09,
    signal_num: 139,
    opened_at: Date.now() - 42 * 60 * 1000,
    is_open: 1,
    reminders_sent: 1,
    be_alert_sent: false,
  },
  {
    id: 102,
    chat_id: '982734110',
    user_name: 'Kasun Bandara',
    symbol: 'DOGEUSDT',
    side: 'BUY',
    entry_price: 0.1742,
    current_price: 0.1768,
    base_tp_price: 0.1770,
    recovery_tp_price: 0.1795,
    tp_price: 0.1795,
    sl_price: 0.1695,
    margin: 0.8,
    leverage: 10,
    attached_loss: 0.12,
    signal_num: 140,
    opened_at: Date.now() - 25 * 60 * 1000,
    is_open: 1,
    reminders_sent: 0,
    be_alert_sent: false,
  },
  {
    id: 103,
    chat_id: '774819203',
    user_name: 'Nuwan Perera',
    symbol: 'AVAXUSDT',
    side: 'SELL',
    entry_price: 28.50,
    current_price: 28.12,
    base_tp_price: 27.60,
    recovery_tp_price: 27.60,
    tp_price: 27.60,
    sl_price: 29.26,
    margin: 0.6,
    leverage: 10,
    attached_loss: 0.0,
    signal_num: 141,
    opened_at: Date.now() - 15 * 60 * 1000,
    is_open: 1,
    reminders_sent: 0,
    be_alert_sent: false,
  },
  {
    id: 99,
    chat_id: '1088492011',
    user_name: 'Master Admin',
    symbol: 'NEARUSDT',
    side: 'BUY',
    entry_price: 4.82,
    current_price: 4.96,
    base_tp_price: 4.90,
    recovery_tp_price: 4.95,
    tp_price: 4.95,
    sl_price: 4.69,
    margin: 1.0,
    leverage: 10,
    attached_loss: 0.18,
    signal_num: 138,
    opened_at: Date.now() - 3 * 3600 * 1000,
    is_open: 0,
    reminders_sent: 2,
    pnl: 0.29,
    pnl_pct: 29.04,
    closed_at: Date.now() - 2 * 3600 * 1000,
    close_reason: 'TP_HIT',
    be_alert_sent: true,
  },
];

let nextPositionId = 104;

// Cache of live coin market statistics
let marketCache: Map<string, CoinMarket> = new Map();
let lastMarketFetchTime = 0;
let signalCooldowns: Map<string, number> = new Map();

// Telegram messages history
let telegramMessages: TelegramMessage[] = [
  {
    id: 'msg-1',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toLocaleTimeString(),
    chat_id: '1088492011',
    sender_name: 'Admin',
    is_from_bot: false,
    text: '/status',
  },
  {
    id: 'msg-2',
    timestamp: new Date(Date.now() - 59 * 60 * 1000).toLocaleTimeString(),
    chat_id: '1088492011',
    sender_name: 'RedBull Master Bot',
    is_from_bot: true,
    text: `⚡ <b>REDBULL LOSS RECOVERY ENGINE STATUS</b> ⚡\n\n🟢 <b>Engine:</b> ACTIVE (Running)\n🛡️ <b>Trading Mode:</b> PAPER TRADING (Safety ON)\n📊 <b>Whitelisted Coins:</b> ${whitelist.size} Coins\n👥 <b>Active Members:</b> 3 Approved\n💼 <b>Open Global Positions:</b> 3 Trades\n\n💡 <i>All indicators and pivot scanner running normally.</i>`,
    buttons: [
      [
        { text: '📊 Refresh Status', callback_data: 'my_status' },
        { text: '🔕 Mute Alerts', callback_data: 'mute:all' },
      ],
    ],
  },
  {
    id: 'msg-3',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toLocaleTimeString(),
    chat_id: '1088492011',
    sender_name: 'RedBull Master Bot',
    is_from_bot: true,
    text: `🎯 <b>NEW SIGNAL #139: SOLUSDT (BUY / LONG)</b> 🚀\n\n` +
      `💵 <b>Entry Price:</b> $182.4000\n` +
      `🎯 <b>Target TP:</b> $185.8000\n` +
      `🛑 <b>Stop Loss:</b> $177.8400\n` +
      `⚙️ <b>Margin:</b> $1.00 (10x Lev)\n` +
      `🩹 <b>Attached Loss Recovery:</b> $0.0900\n\n` +
      `⚠️ <i>Risk Warning: Always follow disciplined risk parameters.</i>`,
    buttons: [
      [
        { text: '🚫 Skip Trade & Refund Loss', callback_data: 'skip_trade:139' },
        { text: '🔕 Mute Reminder', callback_data: 'mute:139' },
      ],
    ],
  },
];

// --- REAL 5M BINANCE FUTURES CANDLESTICK KLINES FEED ---

export interface KlineCandle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

const klinesCache = new Map<string, { timestamp: number; candles: KlineCandle[] }>();

async function fetchBinanceKlines(symbol: string, interval = '5m', limit = 150): Promise<KlineCandle[]> {
  const cached = klinesCache.get(symbol);
  const now = Date.now();
  // Cache for 20 seconds to prevent rate-limit while ensuring real-time responsiveness
  if (cached && now - cached.timestamp < 20000 && cached.candles.length >= 60) {
    return cached.candles;
  }

  return new Promise((resolve) => {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
    https.get(url, { timeout: 4500 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data) && data.length > 0) {
            const candles: KlineCandle[] = data.map((item: any) => ({
              openTime: Number(item[0]),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
              closeTime: Number(item[6]),
            }));
            klinesCache.set(symbol, { timestamp: now, candles });
            return resolve(candles);
          }
        } catch (e) {
          // ignore error and fallback
        }
        resolve(cached?.candles || []);
      });
    }).on('error', () => {
      resolve(cached?.candles || []);
    });
  });
}

// Preset lookups [tenkan, kijun, spanB, displacement]
function ktPreset(name: 'Classic' | '5-Day Week' | 'Crypto'): [number, number, number, number] {
  if (name === '5-Day Week') return [7, 22, 44, 22];
  if (name === 'Crypto') return [20, 60, 120, 30];
  return [9, 26, 52, 26]; // Classic
}

// Exact Pine Script "Ichimoku Itto by [Itto-Ryu]" Engine powered by real Candlestick Klines
function calculateIchimokuFromKlines(
  candles: KlineCandle[],
  preset: 'Classic' | '5-Day Week' | 'Crypto' = 'Crypto',
  strongCutThreshold: number = 4,
  chopScoreBand: number = 1,
  slopeLen: number = 5
) {
  if (!candles || candles.length < 30) {
    return null;
  }

  const [tLen, kLen, bLen, disp] = ktPreset(preset);
  const curIdx = candles.length - 1;
  const currentPrice = candles[curIdx].close;

  // Donchian midpoint helper: (highest high of len bars + lowest low of len bars) / 2 up to endIdx
  const getDonchian = (endIdx: number, len: number): number => {
    const startIdx = Math.max(0, endIdx - len + 1);
    let maxH = -Infinity;
    let minL = Infinity;
    for (let i = startIdx; i <= endIdx; i++) {
      if (candles[i].high > maxH) maxH = candles[i].high;
      if (candles[i].low < minL) minL = candles[i].low;
    }
    return (maxH + minL) / 2;
  };

  // 1. Tenkan & Kijun (The Blade) for the current candle bar
  const tenkan = Number(getDonchian(curIdx, tLen).toFixed(4));
  const kijun = Number(getDonchian(curIdx, kLen).toFixed(4));

  // 2. Senkou Span A (raw) & Senkou Span B (raw)
  const ssaRaw = Number(((tenkan + kijun) / 2).toFixed(4));
  const ssbRaw = Number(getDonchian(curIdx, bLen).toFixed(4));

  // 3. Kumo under current bar (projected displacement disp - 1 bars ago: 29 bars ago in Crypto)
  const dispOffset = disp - 1;
  const pastIdx = Math.max(0, curIdx - dispOffset);

  const pastTenkan = getDonchian(pastIdx, tLen);
  const pastKijun = getDonchian(pastIdx, kLen);
  const kumoA = Number(((pastTenkan + pastKijun) / 2).toFixed(4));
  const kumoB = Number(getDonchian(pastIdx, bLen).toFixed(4));

  // 4. Chikou vs the price it is plotted against:
  // Pine script: kt_chikou(disp) => close > high[disp - 1] ? 1 : close < low[disp - 1] ? -1 : 0
  const pastBar = candles[pastIdx];
  const chikou = currentPrice > pastBar.high ? 1 : currentPrice < pastBar.low ? -1 : 0;

  // 5. inKumo: close inside the cloud
  const kTop = Math.max(kumoA, kumoB);
  const kBot = Math.min(kumoA, kumoB);
  const inKumo = currentPrice <= kTop && currentPrice >= kBot;

  // 6. Five Itto Score Components:
  // c1: Cloud position (+1 above, -1 below, 0 inside)
  const c1 = currentPrice > kTop ? 1 : currentPrice < kBot ? -1 : 0;
  // c2: Tenkan / Kijun cross (+1 Tenkan > Kijun, -1 Tenkan < Kijun)
  const c2 = tenkan > kijun ? 1 : tenkan < kijun ? -1 : 0;
  // c3: Chikou position (+1 above, -1 below, 0 inside)
  const c3 = chikou;
  // c4: Future Kumo direction (+1 SSA > SSB, -1 SSA < SSB)
  const c4 = ssaRaw > ssbRaw ? 1 : ssaRaw < ssbRaw ? -1 : 0;
  // c5: Kijun slope (compare current Kijun with Kijun slopeLen bars ago)
  const slopeIdx = Math.max(0, curIdx - slopeLen);
  const kijunSlopePast = getDonchian(slopeIdx, kLen);
  const c5 = kijun > kijunSlopePast ? 1 : kijun < kijunSlopePast ? -1 : 0;

  const score = c1 + c2 + c3 + c4 + c5; // -5 to +5
  const scorePct = score * 20; // -100% to +100%

  // Sanyaku 3/3 Aligned (Sanyaku Koten / Gyakuten)
  const sanyaku = (c1 === 1 && c2 === 1 && c3 === 1) ? 1 : (c1 === -1 && c2 === -1 && c3 === -1) ? -1 : 0;

  // Chop zone: in Kumo OR |score| <= chopScoreBand
  const noCut = inKumo || Math.abs(score) <= chopScoreBand;

  // Signals
  let signalType: 'STRONG_UP' | 'STRONG_DOWN' | 'ALIGNED_UP' | 'ALIGNED_DOWN' | 'NONE' = 'NONE';
  if (!noCut && score >= strongCutThreshold) {
    signalType = 'STRONG_UP';
  } else if (!noCut && score <= -strongCutThreshold) {
    signalType = 'STRONG_DOWN';
  } else if (sanyaku === 1) {
    signalType = 'ALIGNED_UP';
  } else if (sanyaku === -1) {
    signalType = 'ALIGNED_DOWN';
  }

  // Trend status text matching Pine Script
  let trendText = 'SIDEWAYS';
  if (noCut) {
    trendText = 'CHOP ZONE · NO ACTION';
  } else if (score >= strongCutThreshold) {
    trendText = 'STRONG UP';
  } else if (score >= 3) {
    trendText = 'UP';
  } else if (score > 0) {
    trendText = 'SIDEWAYS UP';
  } else if (score <= -strongCutThreshold) {
    trendText = 'STRONG DOWN';
  } else if (score <= -3) {
    trendText = 'DOWN';
  } else if (score < 0) {
    trendText = 'SIDEWAYS DOWN';
  }

  return {
    tenkan,
    kijun,
    ssaRaw,
    ssbRaw,
    kumoA,
    kumoB,
    chikou,
    score,
    scorePct,
    sanyaku,
    inKumo,
    noCut,
    trendText,
    signalType,
    magnetKijun: kijun,
    magnetSpanB: ssbRaw,
  };
}

// Fallback Ichimoku calculator for 24h ticker baseline
function calculateIchimokuItto(
  currentPrice: number,
  high24h: number,
  low24h: number,
  change24h: number,
  preset: 'Classic' | '5-Day Week' | 'Crypto' = 'Crypto',
  strongCutThreshold: number = 4,
  chopScoreBand: number = 1,
  slopeLen: number = 5
) {
  const [tLen, kLen, bLen, disp] = ktPreset(preset);

  const tenkan = Number(((high24h * 0.995 + low24h * 1.005) / 2).toFixed(4));
  const kijun = Number(((high24h + low24h) / 2).toFixed(4));
  const ssaRaw = Number(((tenkan + kijun) / 2).toFixed(4));
  const ssbRaw = Number(((high24h * 1.01 + low24h * 0.99) / 2).toFixed(4));

  const trendMomentum = change24h / 100.0;
  const kumoA = Number((ssaRaw * (1 - trendMomentum * 0.015)).toFixed(4));
  const kumoB = Number((ssbRaw * (1 - trendMomentum * 0.025)).toFixed(4));

  const prevHigh = high24h * (1 - Math.abs(trendMomentum) * 0.05);
  const prevLow = low24h * (1 + Math.abs(trendMomentum) * 0.05);
  const chikou = currentPrice > prevHigh ? 1 : currentPrice < prevLow ? -1 : 0;

  const kTop = Math.max(kumoA, kumoB);
  const kBot = Math.min(kumoA, kumoB);
  const inKumo = currentPrice <= kTop && currentPrice >= kBot;

  const c1 = currentPrice > kTop ? 1 : currentPrice < kBot ? -1 : 0;
  const c2 = tenkan > kijun ? 1 : tenkan < kijun ? -1 : 0;
  const c3 = chikou;
  const c4 = ssaRaw > ssbRaw ? 1 : ssaRaw < ssbRaw ? -1 : 0;
  const prevKijun = kijun * (1 - trendMomentum * 0.01);
  const c5 = kijun > prevKijun ? 1 : kijun < prevKijun ? -1 : 0;

  const score = c1 + c2 + c3 + c4 + c5;
  const scorePct = score * 20;

  const sanyaku = (c1 === 1 && c2 === 1 && c3 === 1) ? 1 : (c1 === -1 && c2 === -1 && c3 === -1) ? -1 : 0;
  const noCut = inKumo || Math.abs(score) <= chopScoreBand;

  let signalType: 'STRONG_UP' | 'STRONG_DOWN' | 'ALIGNED_UP' | 'ALIGNED_DOWN' | 'NONE' = 'NONE';
  if (!noCut && score >= strongCutThreshold) {
    signalType = 'STRONG_UP';
  } else if (!noCut && score <= -strongCutThreshold) {
    signalType = 'STRONG_DOWN';
  } else if (sanyaku === 1) {
    signalType = 'ALIGNED_UP';
  } else if (sanyaku === -1) {
    signalType = 'ALIGNED_DOWN';
  }

  let trendText = 'SIDEWAYS';
  if (noCut) {
    trendText = 'CHOP ZONE · NO ACTION';
  } else if (score >= strongCutThreshold) {
    trendText = 'STRONG UP';
  } else if (score >= 3) {
    trendText = 'UP';
  } else if (score > 0) {
    trendText = 'SIDEWAYS UP';
  } else if (score <= -strongCutThreshold) {
    trendText = 'STRONG DOWN';
  } else if (score <= -3) {
    trendText = 'DOWN';
  } else if (score < 0) {
    trendText = 'SIDEWAYS DOWN';
  }

  return {
    tenkan,
    kijun,
    ssaRaw,
    ssbRaw,
    kumoA,
    kumoB,
    chikou,
    score,
    scorePct,
    sanyaku,
    inKumo,
    noCut,
    trendText,
    signalType,
    magnetKijun: kijun,
    magnetSpanB: ssbRaw,
  };
}

// Background Live 5m Klines Worker to feed Pine Script calculations
async function syncWhitelist5mKlines(): Promise<void> {
  const symbols = Array.from(whitelist);
  for (const sym of symbols) {
    if (blacklist.has(sym)) continue;
    try {
      const candles = await fetchBinanceKlines(sym, '5m', 150);
      if (candles && candles.length >= 30) {
        const curCandle = candles[candles.length - 1];
        const price = curCandle.close;
        const high24h = Math.max(...candles.slice(-24).map((c) => c.high));
        const low24h = Math.min(...candles.slice(-24).map((c) => c.low));
        const change24h = Number((((price - candles[0].open) / candles[0].open) * 100).toFixed(2));
        const vol = candles.reduce((s, c) => s + c.volume, 0);

        const ichi = calculateIchimokuFromKlines(
          candles,
          botConfig.ichimoku_preset,
          botConfig.strong_cut_threshold,
          botConfig.chop_score_band,
          botConfig.kijun_slope_len
        );

        if (ichi) {
          const minNotional = getSymbolMinNotional(sym);
          const notionalCheck = isCoinNotionalEligible(sym, 0.8, 10);

          marketCache.set(sym, {
            symbol: sym,
            price,
            change24h,
            high24h,
            low24h,
            volume24h: vol,
            tenkan: ichi.tenkan,
            kijun: ichi.kijun,
            ssaRaw: ichi.ssaRaw,
            ssbRaw: ichi.ssbRaw,
            kumoA: ichi.kumoA,
            kumoB: ichi.kumoB,
            chikou: ichi.chikou,
            score: ichi.score,
            scorePct: ichi.scorePct,
            sanyaku: ichi.sanyaku,
            inKumo: ichi.inKumo,
            noCut: ichi.noCut,
            trendText: ichi.trendText,
            signalType: ichi.signalType,
            magnetKijun: ichi.magnetKijun,
            magnetSpanB: ichi.magnetSpanB,
            inWhitelist: true,
            inBlacklist: false,
            minNotional,
            isEligible: notionalCheck.eligible,
            feedType: '5m Klines',
          });
        }
      }
    } catch (err) {
      // Continue next symbol
    }
  }
}

// --- BINANCE FUTURES API LIVE DATA SYNC (24hr Ticker baseline) ---

async function fetchBinancePrices(): Promise<void> {
  const now = Date.now();
  if (now - lastMarketFetchTime < 10000 && marketCache.size > 0) {
    return;
  }
  lastMarketFetchTime = now;

  return new Promise((resolve) => {
    https
      .get('https://fapi.binance.com/fapi/v1/ticker/24hr', { timeout: 4000 }, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
              for (const item of data) {
                const sym = item.symbol;
                if (!sym.endsWith('USDT')) continue;

                const lastPrice = parseFloat(item.lastPrice) || 0;
                const priceChangePercent = parseFloat(item.priceChangePercent) || 0;
                const high = parseFloat(item.highPrice) || lastPrice * 1.03;
                const low = parseFloat(item.lowPrice) || lastPrice * 0.97;
                const vol = parseFloat(item.quoteVolume) || 0;

                const existing = marketCache.get(sym);
                // If already powered by 5m Klines, just update price & 24h stats to preserve 5m indicators
                if (existing && existing.feedType === '5m Klines') {
                  existing.price = lastPrice;
                  existing.change24h = priceChangePercent;
                  existing.high24h = high;
                  existing.low24h = low;
                  existing.volume24h = vol;
                  continue;
                }

                // ---- ICHIMOKU ITTO BY ITTO-RYU CALCULATION (Fallback) ----
                const ichi = calculateIchimokuItto(
                  lastPrice,
                  high,
                  low,
                  priceChangePercent,
                  botConfig.ichimoku_preset,
                  botConfig.strong_cut_threshold,
                  botConfig.chop_score_band,
                  botConfig.kijun_slope_len
                );

                const minNotional = getSymbolMinNotional(sym);
                const notionalCheck = isCoinNotionalEligible(sym, 0.8, 10);

                marketCache.set(sym, {
                  symbol: sym,
                  price: lastPrice,
                  change24h: priceChangePercent,
                  high24h: high,
                  low24h: low,
                  volume24h: vol,
                  tenkan: ichi.tenkan,
                  kijun: ichi.kijun,
                  ssaRaw: ichi.ssaRaw,
                  ssbRaw: ichi.ssbRaw,
                  kumoA: ichi.kumoA,
                  kumoB: ichi.kumoB,
                  chikou: ichi.chikou,
                  score: ichi.score,
                  scorePct: ichi.scorePct,
                  sanyaku: ichi.sanyaku,
                  inKumo: ichi.inKumo,
                  noCut: ichi.noCut,
                  trendText: ichi.trendText,
                  signalType: ichi.signalType,
                  magnetKijun: ichi.magnetKijun,
                  magnetSpanB: ichi.magnetSpanB,
                  inWhitelist: whitelist.has(sym),
                  inBlacklist: blacklist.has(sym),
                  blacklistReason: blacklist.get(sym)?.reason,
                  minNotional,
                  isEligible: notionalCheck.eligible,
                  feedType: '24h Ticker',
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing Binance data, using baseline cache:', e);
            seedBaselineCoins();
          }
          resolve();
        });
      })
      .on('error', () => {
        seedBaselineCoins();
        resolve();
      });
  });
}

function seedBaselineCoins() {
  if (marketCache.size > 0) return;
  const mockPrices: Record<string, { price: number; change: number }> = {
    BTCUSDT: { price: 68450.0, change: 2.15 },
    ETHUSDT: { price: 2620.5, change: 1.84 },
    SOLUSDT: { price: 184.22, change: 4.12 },
    BNBUSDT: { price: 592.1, change: 0.95 },
    XRPUSDT: { price: 0.542, change: -1.2 },
    DOGEUSDT: { price: 0.1768, change: 5.4 },
    ADAUSDT: { price: 0.364, change: 0.8 },
    AVAXUSDT: { price: 28.12, change: -2.3 },
    LINKUSDT: { price: 12.45, change: 3.1 },
    SUIUSDT: { price: 2.15, change: 7.8 },
    NEARUSDT: { price: 4.96, change: 3.9 },
    PEPEUSDT: { price: 0.0000095, change: -3.5 },
    APTUSDT: { price: 10.15, change: 1.4 },
    FETUSDT: { price: 1.45, change: -0.8 },
    RENDERUSDT: { price: 5.82, change: 2.7 },
    TAOUSDT: { price: 520.4, change: 4.6 },
    FILUSDT: { price: 3.82, change: 0.2 },
    LTCUSDT: { price: 71.5, change: 1.1 },
    UNIUSDT: { price: 8.24, change: -1.4 },
    AAVEUSDT: { price: 154.2, change: 3.5 },
  };

  for (const [sym, data] of Object.entries(mockPrices)) {
    const high = data.price * 1.04;
    const low = data.price * 0.96;
    const ichi = calculateIchimokuItto(
      data.price,
      high,
      low,
      data.change,
      botConfig.ichimoku_preset,
      botConfig.strong_cut_threshold,
      botConfig.chop_score_band,
      botConfig.kijun_slope_len
    );

    marketCache.set(sym, {
      symbol: sym,
      price: data.price,
      change24h: data.change,
      high24h: high,
      low24h: low,
      volume24h: 15000000,
      tenkan: ichi.tenkan,
      kijun: ichi.kijun,
      ssaRaw: ichi.ssaRaw,
      ssbRaw: ichi.ssbRaw,
      kumoA: ichi.kumoA,
      kumoB: ichi.kumoB,
      chikou: ichi.chikou,
      score: ichi.score,
      scorePct: ichi.scorePct,
      sanyaku: ichi.sanyaku,
      inKumo: ichi.inKumo,
      noCut: ichi.noCut,
      trendText: ichi.trendText,
      signalType: ichi.signalType,
      magnetKijun: ichi.magnetKijun,
      magnetSpanB: ichi.magnetSpanB,
      inWhitelist: whitelist.has(sym),
      inBlacklist: blacklist.has(sym),
      blacklistReason: blacklist.get(sym)?.reason,
    });
  }
}

// --- REAL TELEGRAM BOT ENGINE & POLLING SERVICE ---
function getTelegramToken(): string | null {
  return (
    process.env.TELEGRAM_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN ||
    process.env.TG_TOKEN ||
    process.env.TG_BOT_TOKEN ||
    botConfig.telegram_bot_token ||
    null
  );
}

function broadcastTelegramAlert(msg: TelegramMessage): void {
  // 1. Always record in in-memory list for Web Dashboard Simulator & Audit Log
  telegramMessages.unshift(msg);

  // 2. If real Telegram Bot token is present, dispatch over Telegram Bot API
  const token = getTelegramToken();
  if (!token) {
    console.log(`[Telegram Outbound] Simulator recorded alert for chat ${msg.chat_id} (No token configured).`);
    return;
  }

  const sendPayload = (payload: any, isRetry = false) => {
    try {
      const dataStr = JSON.stringify(payload);
      const req = https.request(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataStr),
          },
          timeout: 8000,
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              console.warn(`[Telegram API Error] HTTP ${res.statusCode} for chat ${msg.chat_id}: ${body}`);
              // If parse mode error, retry as plain text without HTML
              if (!isRetry && body.includes("can't parse entities")) {
                const plainText = msg.text.replace(/<[^>]*>?/gm, '');
                const retryPayload = { ...payload, text: plainText, parse_mode: undefined };
                console.log(`[Telegram API Retry] Retrying plain text message for chat ${msg.chat_id}...`);
                sendPayload(retryPayload, true);
              }
            } else {
              console.log(`[Telegram API Success] Delivered message to chat ${msg.chat_id}`);
            }
          });
        }
      );

      req.on('error', (err) => {
        console.error(`[Telegram Outbound Error] Failed to send message to ${msg.chat_id}:`, err.message);
      });

      req.write(dataStr);
      req.end();
    } catch (err) {
      console.error('[Telegram Broadcast Exception]:', err);
    }
  };

  const payload: any = {
    chat_id: msg.chat_id,
    text: msg.text,
    parse_mode: 'HTML',
  };

  if (msg.buttons && msg.buttons.length > 0) {
    payload.reply_markup = {
      inline_keyboard: msg.buttons.map((row) =>
        row.map((btn) => ({
          text: btn.text,
          callback_data: btn.callback_data,
        }))
      ),
    };
  }

  sendPayload(payload);
}

let telegramPollingActive = false;
let lastUpdateId = 0;

function processTelegramUpdate(update: any): void {
  if (!update) return;

  // Handle Callback Query (inline buttons)
  if (update.callback_query) {
    const cb = update.callback_query;
    const cbData = cb.data || '';
    const senderId = String(cb.from?.id || cb.message?.chat?.id || '');
    handleCallbackQuery(senderId, cbData);

    // Answer callback query so button spinner stops in Telegram app
    const token = getTelegramToken();
    if (token && cb.id) {
      try {
        const postData = JSON.stringify({ callback_query_id: cb.id });
        const req = https.request(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 4000,
        });
        req.on('error', () => {});
        req.write(postData);
        req.end();
      } catch (e) {}
    }
    return;
  }

  // Handle Regular Message
  if (update.message) {
    const msg = update.message;
    const chatId = String(msg.chat?.id || '');
    const text = msg.text || '';
    const username = msg.from?.username || msg.chat?.username || 'user';
    const fullName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.chat?.first_name || 'Member';

    if (text) {
      // Record incoming user message in simulator
      telegramMessages.unshift({
        id: `usr-${Date.now()}-${chatId}`,
        timestamp: new Date().toLocaleTimeString(),
        chat_id: chatId,
        sender_name: fullName,
        is_from_bot: false,
        text,
      });

      handleTelegramCommand(chatId, username, fullName, text);
    }
  }
}

async function initTelegramBotEngine(): Promise<void> {
  const token = getTelegramToken();
  if (!token) {
    console.log('ℹ️ [Telegram Engine] No Telegram Bot Token configured. Webhook & Simulator active.');
    return;
  }

  try {
    // 1. Verify Bot Token and get bot identity
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData: any = await meRes.json();
    if (meData && meData.ok && meData.result) {
      botConfig.telegram_connected = true;
      botConfig.telegram_bot_username = meData.result.username;
      console.log(`🤖 [Telegram Engine] Successfully connected as @${meData.result.username} (ID: ${meData.result.id}, Name: ${meData.result.first_name})`);

      // 2. Set bot commands menu in Telegram
      try {
        await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commands: [
              { command: 'start', description: 'Connect & register for signals' },
              { command: 'status', description: 'View current trades & loss recovery' },
              { command: 'positions', description: 'View active positions with PnL' },
              { command: 'test_signal', description: 'Dispatch an immediate test trade signal' },
              { command: 'whitelist', description: 'List whitelisted trading coins' },
              { command: 'help', description: 'Show all bot commands and usage' },
              { command: 'menu', description: 'Show main navigation menu' },
              { command: 'bot_on', description: 'Admin: resume automatic scanner' },
              { command: 'bot_off', description: 'Admin: pause automatic scanner' },
              { command: 'users', description: 'Admin: view registered members' },
              { command: 'approve_all', description: 'Admin: approve all users' },
              { command: 'set_admin', description: 'Assign yourself as Admin' },
            ],
          }),
        });
      } catch (cmdErr) {
        // non-blocking
      }

      // 3. Clear conflicting webhooks so getUpdates long polling runs smoothly
      try {
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
        console.log('🤖 [Telegram Engine] Cleared conflicting webhooks, enabling high-performance Long Polling.');
      } catch (e) {}

      // 4. Start Long Polling loop
      startTelegramPolling(token);
    } else {
      console.warn('⚠️ [Telegram Engine] Invalid Bot Token response:', meData);
    }
  } catch (err: any) {
    console.error('❌ [Telegram Engine] Initialization error:', err.message);
  }
}

function startTelegramPolling(token: string) {
  if (telegramPollingActive) return;
  telegramPollingActive = true;

  (async () => {
    console.log('🚀 [Telegram Engine] Long Polling started. Listening for messages & commands in real-time...');
    while (telegramPollingActive) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, { signal: AbortSignal.timeout(28000) });
        if (!res.ok) {
          if (res.status === 409) {
            console.warn('[Telegram Polling] 409 Conflict: waiting 5s before reconnecting...');
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data: any = await res.json();
        if (data && data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            if (update.update_id) {
              lastUpdateId = Math.max(lastUpdateId, update.update_id);
            }
            processTelegramUpdate(update);
          }
        }
      } catch (pollErr: any) {
        // Timeout or network blip - continue looping smoothly
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  })();
}


// --- CORE DISPATCHER & RISK RECOVERY ENGINE (from main.py) ---

function dispatchTradeToUsers(symbol: string, side: 'BUY' | 'SELL', currentPrice: number): {
  success: boolean;
  message: string;
  dispatchedCount: number;
} {
  if (botConfig.is_paused) {
    return { success: false, message: `Bot is paused. Signal for ${symbol} ignored.`, dispatchedCount: 0 };
  }

  // Directional exposure check
  const openPositions = positions.filter((p) => p.is_open === 1);

  // 🛑 RULE 1: එක කාසියකින් ලැබෙන සිග්නල් එකක් close වනතුරු එම කාසියෙන් නව සිග්නල් සෙවිම/නිකුත් කිරීම නතර කලයුතුයි!
  const hasActiveTradeOnCoin = openPositions.some((p) => p.symbol === symbol);
  if (hasActiveTradeOnCoin) {
    return {
      success: false,
      message: `🛑 ${symbol} සඳහා දැනටමත් Open Trade එකක් පවතින බැවින් එම ට්‍රේඩ් එක Close වන තුරු මෙම කාසියෙන් නව සිග්නල් සෙවීම සහ නිකුත් කිරීම සම්පූර්ණයෙන්ම අත්හිටුවා ඇත.`,
      dispatchedCount: 0,
    };
  }

  const openBuys = openPositions.filter((p) => p.side === 'BUY').length;
  const openSells = openPositions.filter((p) => p.side === 'SELL').length;

  if (side === 'BUY' && openBuys >= botConfig.max_buys) {
    return { success: false, message: `BUY limit reached (${openBuys}/${botConfig.max_buys}).`, dispatchedCount: 0 };
  }
  if (side === 'SELL' && openSells >= botConfig.max_sells) {
    return { success: false, message: `SELL limit reached (${openSells}/${botConfig.max_sells}).`, dispatchedCount: 0 };
  }
  if (openPositions.length >= botConfig.max_signals_global) {
    return { success: false, message: `Global max trades reached (${openPositions.length}/${botConfig.max_signals_global}).`, dispatchedCount: 0 };
  }

  botConfig.signal_count += 1;
  const sigNum = botConfig.signal_count;
  let dispatched = 0;

  for (const [, u] of users.entries()) {
    if (u.is_approved !== 1 || u.is_active !== 1) continue;

    // Check user concurrency limit
    const userOpens = openPositions.filter((p) => p.chat_id === u.chat_id);
    if (userOpens.length >= u.max_user_trades) continue;

    // Prevent duplicate symbol for user
    if (userOpens.some((p) => p.symbol === symbol)) continue;

    const margin = u.base_margin;
    const leverage = u.leverage;

    // 🛑 REQUIREMENT 1: Binance Min Notional ($5 / $10) Filter & Order Rejection Guard
    // Filter out coins that do not meet the user's margin * leverage notional floor
    const notionalCheck = isCoinNotionalEligible(symbol, margin, leverage);
    if (!notionalCheck.eligible) {
      console.warn(`[Binance Min Notional Guard] Skipping dispatch for user ${u.chat_id} on ${symbol}: ${notionalCheck.reason}`);
      continue;
    }

    const slMarginPct = u.margin_sl_pct;
    const fastTpPct = u.fast_tp_pct;
    const rtpPct = u.rtp_pct;
    const bhBalanceSet = u.blacklist_balance_set;
    const userPool = u.global_loss_pool;

    // Capped Partial Recovery Logic (from main.py lines 645-660)
    const maxRecoverPerTrade = 0.20; // Max $0.20 per trade to keep TP reachable
    let pendingLossToAdd = 0.0;
    if (userPool > 0) {
      pendingLossToAdd = Math.min(userPool * (rtpPct / 100.0), maxRecoverPerTrade);
      u.global_loss_pool = Math.max(0.0, userPool - pendingLossToAdd);
    }

    const positionSize = margin * leverage;
    const coinSlMovePct = (slMarginPct / leverage) / 100.0;
    const baseProfitDollar = margin * (fastTpPct / 100.0);
    const baseMovePct = baseProfitDollar / positionSize;

    // 🎯 REQUIREMENT 2: Calculate Base TP (original coin TP before loss recovery addition)
    let baseTpPrice = 0;
    if (side === 'BUY') {
      baseTpPrice = currentPrice * (1.0 + baseMovePct);
    } else {
      baseTpPrice = currentPrice * (1.0 - baseMovePct);
    }

    // 🎯 Calculate Full Recovery TP (Base TP + Attached Loss Recovery)
    const targetProfitDollar = baseProfitDollar + pendingLossToAdd + bhBalanceSet;
    const maxAllowedMove = 0.05; // Cap max move at 5% to guarantee achievable TP
    const calculatedMove = targetProfitDollar / positionSize;
    const requiredMovePct = Math.min(calculatedMove, maxAllowedMove);

    let recoveryTpPrice = 0;
    let initialSl = 0;
    if (side === 'BUY') {
      initialSl = currentPrice * (1.0 - coinSlMovePct);
      recoveryTpPrice = currentPrice * (1.0 + requiredMovePct);
    } else {
      initialSl = currentPrice * (1.0 + coinSlMovePct);
      recoveryTpPrice = currentPrice * (1.0 - requiredMovePct);
    }

    const newPos: UserPosition = {
      id: nextPositionId++,
      chat_id: u.chat_id,
      user_name: u.full_name || u.username,
      symbol,
      side,
      entry_price: currentPrice,
      current_price: currentPrice,
      tp_price: Number(recoveryTpPrice.toFixed(4)),
      base_tp_price: Number(baseTpPrice.toFixed(4)),
      recovery_tp_price: Number(recoveryTpPrice.toFixed(4)),
      sl_price: Number(initialSl.toFixed(4)),
      margin,
      leverage,
      attached_loss: Number(pendingLossToAdd.toFixed(4)),
      signal_num: sigNum,
      opened_at: Date.now(),
      is_open: 1,
      reminders_sent: 0,
      be_alert_sent: false,
    };

    positions.unshift(newPos);
    dispatched++;

    // Generate Telegram Dispatch Message (Sinhala & English matching main.py)
    const directionBadge = side === 'BUY' ? 'BUY / LONG 🟢' : 'SELL / SHORT 🔴';
    const recoveryTxt = pendingLossToAdd > 0
      ? `\n🩹 <b>Loss Recovery Attached:</b> +$${pendingLossToAdd.toFixed(4)}` +
        `\n⚡ <b>Base TP (BE Trigger):</b> $${baseTpPrice.toFixed(4)}` +
        `\n🎯 <b>Full Recovery TP:</b> $${recoveryTpPrice.toFixed(4)}` +
        `\n\n💡 <i>සටහන: මිල Base TP ($${baseTpPrice.toFixed(4)}) වෙත ළඟා වූ පසු SL එක Entry Price ($${currentPrice.toFixed(4)}) වෙත ගෙන යන ලෙස (Breakeven - BE) ක්ෂණික Alert එකක් ලැබෙනු ඇත.</i>`
      : `\n🎯 <b>Target TP:</b> $${baseTpPrice.toFixed(4)}`;

    const dispatchMsg: TelegramMessage = {
      id: `sig-${Date.now()}-${u.chat_id}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: u.chat_id,
      sender_name: 'RedBull Master Bot',
      is_from_bot: true,
      text: `🚀 <b>TRADE SIGNAL #${sigNum} DISPATCHED!</b>\n\n` +
        `💎 <b>Coin:</b> <code>${symbol}</code>\n` +
        `📈 <b>Direction:</b> ${directionBadge}\n` +
        `💵 <b>Entry Price:</b> $${currentPrice.toFixed(4)}\n` +
        (pendingLossToAdd > 0 
          ? `🎯 <b>Target TP (Full):</b> $${recoveryTpPrice.toFixed(4)}\n⚡ <b>Base TP (BE Trigger):</b> $${baseTpPrice.toFixed(4)}\n`
          : `🎯 <b>Target TP:</b> $${baseTpPrice.toFixed(4)}\n`) +
        `🛑 <b>Stop Loss:</b> $${initialSl.toFixed(4)}\n` +
        `⚙️ <b>Margin:</b> $${margin.toFixed(2)} (${leverage}x Lev)${recoveryTxt}\n\n` +
        `Sinhala: <i>සිග්නල් එක ක්‍රියාත්මක විය. පාඩුව පියවීමේ පියවර අංක ${u.loss_recovery_step + 1} ක්‍රියාත්මකයි.</i>`,
      buttons: [
        [
          { text: '🚫 Skip Trade & Refund', callback_data: `skip_trade:${sigNum}` },
          { text: '🔕 Mute Alerts', callback_data: `mute:${sigNum}` },
        ],
      ],
    };

    broadcastTelegramAlert(dispatchMsg);
  }

  // Set 10-minute cooldown on symbol
  signalCooldowns.set(symbol, Date.now() + botConfig.signal_cooldown_mins * 60 * 1000);

  return {
    success: true,
    message: `Dispatched Signal #${sigNum} for ${symbol} (${side}) to ${dispatched} user(s).`,
    dispatchedCount: dispatched,
  };
}

// --- TELEGRAM COMMAND PARSER (from main.py webhook handler) ---

function handleTelegramCommand(chatId: string, username: string, fullName: string, text: string): TelegramMessage {
  const tokens = text.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase().replace('/', '');
  const isAdmin = chatId === botConfig.admin_chat_id;

  // Ensure user exists or auto-register
  let user = users.get(chatId);
  const isTargetAdmin = chatId === botConfig.admin_chat_id || (isAdmin && user?.is_admin === 1);
  const shouldAutoApprove = botConfig.auto_approve_users !== false || isTargetAdmin;

  if (!user) {
    user = {
      chat_id: chatId,
      full_name: fullName || 'New Member',
      username: username || 'user',
      is_approved: shouldAutoApprove ? 1 : 0,
      is_active: shouldAutoApprove ? 1 : 0,
      is_admin: isTargetAdmin ? 1 : 0,
      base_margin: 0.8,
      leverage: 10,
      margin_sl_pct: 27.0,
      fast_tp_pct: 30.0,
      rtp_pct: 15.0,
      blacklist_balance_set: 0.10,
      max_user_trades: 5,
      user_start_hour: 0,
      user_start_minute: 0,
      user_end_hour: 23,
      user_end_minute: 59,
      user_custom_time_enabled: 0,
      is_muted: 0,
      global_loss_pool: 0.0,
      global_loss_completed: 0.0,
      loss_recovery_step: 0,
      last_interaction: new Date().toISOString(),
    };
    users.set(chatId, user);
  } else {
    user.last_interaction = new Date().toISOString();
    if (fullName) user.full_name = fullName;
    if (username) user.username = username;
    if (isTargetAdmin) user.is_admin = 1;
    if (shouldAutoApprove && user.is_approved === 0) {
      user.is_approved = 1;
      user.is_active = 1;
    }
  }

  let replyText = '';
  let buttons: { text: string; callback_data: string }[][] | undefined = undefined;

  switch (cmd) {
    case 'start':
      if (user.is_admin === 1) {
        replyText = `👑 <b>ආයුබෝවන් Administrator!</b>\n\n` +
          `RedBull Loss Recovery Master Bot කළමනාකරණ පද්ධතියට ඔබව සාදරයෙන් පිළිගනිමු.\n\n` +
          `🛠 <b>ප්‍රධාන Commands:</b>\n` +
          `• <b>/status</b> - පද්ධති තත්වය සහ Open Trades\n` +
          `• <b>/test_signal</b> - ක්ෂණික Test Signal එකක් නිකුත් කිරීම\n` +
          `• <b>/positions</b> - සියලු Active Positions\n` +
          `• <b>/whitelist</b> - අනුමත කාසි ලැයිස්තුව\n` +
          `• <b>/bot_on</b> / <b>/bot_off</b> - Scanner Master Switch\n` +
          `• <b>/users</b> - සියලු සාමාජිකයින් ලැයිස්තුව\n` +
          `• <b>/menu</b> - සියලු Controls`;
      } else {
        replyText = `🎉 <b>ආයුබෝවන් ${user.full_name}!</b>\n\n` +
          `RedBull Multi-User Loss Recovery Bot වෙත සාදරයෙන් පිළිගනිමු! ඔබගේ ගිණුම සාර්ථකව සම්බන්ධ කර active කරන ලදී.\n\n` +
          `✅ <b>තත්වය:</b> APPROVED & ACTIVE 🟢\n` +
          `💎 <b>Margin:</b> $${user.base_margin.toFixed(2)} (${user.leverage}x Leverage)\n` +
          `🛡️ <b>Binance Min Notional Guard:</b> Active ($5.00+ Floor)\n\n` +
          `📌 <b>ඔබේ Commands:</b>\n` +
          `• <b>/status</b> - ඔබගේ active trades සහ recovery pool තත්වය\n` +
          `• <b>/positions</b> - ඔබගේ open trades ලැයිස්තුව\n` +
          `• <b>/test_signal</b> - Test Signal එකක් ලබාගැනීම\n` +
          `• <b>/my_off</b> - Signals තාවකාලිකව pause කිරීම\n` +
          `• <b>/my_on</b> - Signals නැවත ආරම්භ කිරීම\n` +
          `• <b>/help</b> - සියලු විධාන විස්තර`;
      }
      break;

    case 'status': {
      const userActivePos = positions.filter((p) => p.chat_id === chatId && p.is_open === 1);
      const totalLossPool = user.global_loss_pool;
      const completedLoss = user.global_loss_completed;

      let posDetails = '<i>No active positions</i>';
      if (userActivePos.length > 0) {
        posDetails = userActivePos
          .map(
            (p) =>
              `• <b>${p.symbol}</b> (${p.side}) Entry: $${p.entry_price} | TP: $${p.tp_price} | Lev: ${p.leverage}x`
          )
          .join('\n');
      }

      replyText = `📊 <b>YOUR TRADING & LOSS RECOVERY STATUS</b>\n\n` +
        `👤 <b>User:</b> ${user.full_name} (@${user.username})\n` +
        `⚡ <b>Account:</b> ${user.is_active ? 'ACTIVE 🟢' : 'PAUSED ⏸️'}\n` +
        `💼 <b>Open Trades:</b> ${userActivePos.length} / ${user.max_user_trades}\n` +
        `💰 <b>Base Margin:</b> $${user.base_margin} (${user.leverage}x Lev)\n` +
        `🩸 <b>Current Loss Pool:</b> $${totalLossPool.toFixed(4)}\n` +
        `🏆 <b>Total Loss Recovered:</b> $${completedLoss.toFixed(4)}\n\n` +
        `🔥 <b>Active Positions:</b>\n${posDetails}`;

      buttons = [
        [
          { text: '🔄 Refresh Status', callback_data: 'my_status' },
          { text: '🔕 Mute Reminders', callback_data: 'mute:all' },
        ],
      ];
      break;
    }

    case 'bot_on':
    case 'botrun':
    case 'run':
      if (!isAdmin) {
        replyText = '❌ <b>පරිපාලක අයිතියක් නොමැත (Admin Only)!</b>';
      } else {
        botConfig.is_paused = false;
        replyText = '🟢 <b>REDBULL MASTER BOT IS NOW RUNNING!</b>\nසියලු market scan සහ trade signals සක්‍රිය කරන ලදී.';
      }
      break;

    case 'bot_off':
    case 'botoff':
    case 'stop':
    case 'pause':
      if (!isAdmin) {
        replyText = '❌ <b>Admin Only!</b>';
      } else {
        botConfig.is_paused = true;
        replyText = '⏸️ <b>REDBULL MASTER BOT PAUSED!</b>\nනව trading signals යැවීම තාවකාලිකව නවතා ඇත.';
      }
      break;

    case 'toggle_paper':
      if (!isAdmin) {
        replyText = '❌ <b>Admin Only!</b>';
      } else {
        botConfig.paper_trading = !botConfig.paper_trading;
        replyText = `🛡️ <b>Trading Mode Changed:</b> ${
          botConfig.paper_trading ? 'PAPER TRADING (Simulation)' : 'REAL BINANCE FUTURES (LIVE ORDERS)'
        }`;
      }
      break;

    case 'my_off':
    case 'pause_signals':
      user.is_active = 0;
      replyText = '⏸️ <b>ඔබගේ Trade Signals සාර්ථකව Pause කරන ලදී.</b> නැවත ආරම්භ කිරීමට /my_on යවන්න.';
      break;

    case 'my_on':
    case 'resume_signals':
      user.is_active = 1;
      replyText = '🟢 <b>ඔබගේ Trade Signals සාර්ථකව නැවත ක්‍රියාත්මක කරන ලදී!</b>';
      break;

    case 'users':
      if (!isAdmin) {
        replyText = '❌ <b>Admin Only!</b>';
      } else {
        const userList = Array.from(users.values())
          .map(
            (u) =>
              `• <code>${u.chat_id}</code>: ${u.full_name} (@${u.username}) - [${
                u.is_approved ? (u.is_active ? 'Active' : 'Paused') : 'Pending'
              }] Loss Pool: $${u.global_loss_pool.toFixed(2)}`
          )
          .join('\n');
        replyText = `👥 <b>SYSTEM REGISTERED USERS (${users.size}):</b>\n\n${userList}\n\n<i>To approve: /approve &lt;chat_id&gt;</i>`;
      }
      break;

    case 'approve':
      if (!isAdmin) {
        replyText = '❌ <b>Admin Only!</b>';
      } else if (tokens.length < 2) {
        replyText = '⚠️ Usage: <code>/approve &lt;chat_id&gt;</code>';
      } else {
        const targetId = tokens[1];
        const target = users.get(targetId);
        if (target) {
          target.is_approved = 1;
          target.is_active = 1;
          replyText = `✅ User <code>${targetId}</code> (${target.full_name}) සාර්ථකව Approve කරන ලදී!`;
        } else {
          replyText = `❌ User ID <code>${targetId}</code> සොයාගත නොහැක.`;
        }
      }
      break;

    case 'skip':
      if (tokens.length < 2) {
        replyText = '⚠️ Usage: <code>/skip &lt;signal_num&gt;</code>';
      } else {
        const sig = parseInt(tokens[1], 10);
        const pos = positions.find((p) => p.chat_id === chatId && p.signal_num === sig && p.is_open === 1);
        if (pos) {
          pos.is_open = 0;
          pos.close_reason = 'SKIPPED_REFUND';
          if (pos.attached_loss > 0) {
            user.global_loss_pool += pos.attached_loss;
          }
          replyText = `🚫 <b>TRADE #${sig} (${pos.symbol}) SKIPPED & REFUNDED!</b> ↩️\n` +
            `✅ මෙම ට්‍රේඩ් එක අවලංගු කර slot එක නිදහස් කරන ලදී.` +
            (pos.attached_loss > 0 ? `\n💸 ඔබගේ Loss Pool එකට <b>$${pos.attached_loss.toFixed(4)}</b> ක මුදල නැවත බැර විය.` : '');
        } else {
          replyText = `ℹ️ Trade #${sig} දැනට ක්‍රියාකාරී නැත.`;
        }
      }
      break;

    case 'menu':
      replyText = `📋 <b>REDBULL MASTER BOT MENU</b>\n\n` +
        `• <b>/status</b> - Current open positions & PnL\n` +
        `• <b>/positions</b> - View all active trades\n` +
        `• <b>/test_signal</b> - Test trade dispatch alert\n` +
        `• <b>/whitelist</b> - View supported coins\n` +
        `• <b>/my_on</b> / <b>/my_off</b> - Pause or resume signals\n` +
        `• <b>/skip &lt;num&gt;</b> - Cancel trade & refund attached loss\n` +
        (isAdmin
          ? `\n👑 <b>Admin Controls:</b>\n` +
            `• /bot_on & /bot_off - Master toggle\n` +
            `• /users - Manage members\n` +
            `• /approve &lt;id&gt; - Approve new member\n` +
            `• /approve_all - Approve all pending members\n` +
            `• /toggle_paper - Switch paper / live trading\n` +
            `• /set_admin - Set yourself as Admin\n` +
            `• /coin_stats - Whitelist overview`
          : `\n<i>Need admin access? Send /set_admin</i>`);
      break;

    case 'positions':
    case 'trades': {
      const active = positions.filter((p) => p.is_open === 1 && (user.is_admin === 1 || p.chat_id === chatId));
      if (active.length === 0) {
        replyText = `💼 <b>NO OPEN POSITIONS</b>\n\nදැනට කිසිදු active trade එකක් නොමැත. නව Ichimoku signal එකක් ලැබුණු වහාම alert එකක් ලැබෙනු ඇත.`;
      } else {
        const list = active.map((p) => {
          const m = marketCache.get(p.symbol);
          const cur = m?.price || p.current_price;
          const pnlPct = p.side === 'BUY' 
            ? ((cur - p.entry_price) / p.entry_price) * p.leverage * 100 
            : ((p.entry_price - cur) / p.entry_price) * p.leverage * 100;
          const pnlSign = pnlPct >= 0 ? '🟢 +' : '🔴 ';
          return `• <b>${p.symbol}</b> (${p.side} ${p.leverage}x)\n` +
            `  Entry: $${p.entry_price.toFixed(4)} | Cur: $${cur.toFixed(4)}\n` +
            `  TP: $${p.tp_price.toFixed(4)} | SL: $${p.sl_price.toFixed(4)}\n` +
            `  PnL: ${pnlSign}${pnlPct.toFixed(2)}% | User: ${p.user_name || p.chat_id}`;
        }).join('\n\n');
        replyText = `💼 <b>ACTIVE POSITIONS (${active.length}):</b>\n\n${list}`;
      }
      break;
    }

    case 'test_signal':
    case 'signal':
    case 'test': {
      const testSym = tokens[1] ? (tokens[1].toUpperCase().endsWith('USDT') ? tokens[1].toUpperCase() : `${tokens[1].toUpperCase()}USDT`) : 'DOGEUSDT';
      const testSide = tokens[2] && tokens[2].toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
      const m = marketCache.get(testSym);
      const testPrice = m?.price || (testSym === 'DOGEUSDT' ? 0.165 : 1.25);

      const res = dispatchTradeToUsers(testSym, testSide, testPrice);
      if (res.success) {
        replyText = `🚀 <b>TEST SIGNAL DISPATCHED!</b>\n\n` +
          `🪙 Coin: <b>${testSym}</b> (${testSide})\n` +
          `💵 Price: $${testPrice}\n` +
          `👥 Dispatched to <b>${res.dispatchedCount} active user(s)</b>.\n\n` +
          `<i>Check Telegram for the trade signal alert with TP/SL and Breakeven trigger!</i>`;
      } else {
        replyText = `⚠️ <b>Signal Dispatch Result:</b> ${res.message}`;
      }
      break;
    }

    case 'whitelist':
    case 'coins': {
      const coins = Array.from(whitelist).join(', ');
      replyText = `🪙 <b>WHITELISTED COINS (${whitelist.size}):</b>\n\n<code>${coins}</code>\n\n` +
        `<i>All coins are pre-verified for Binance Futures $5.00 min notional on $0.80-$1.00 margin.</i>`;
      break;
    }

    case 'approve_all': {
      if (!isAdmin) {
        replyText = '❌ <b>Admin Only!</b>';
      } else {
        let count = 0;
        for (const [, u] of users.entries()) {
          if (u.is_approved !== 1 || u.is_active !== 1) {
            u.is_approved = 1;
            u.is_active = 1;
            count++;
          }
        }
        replyText = `✅ <b>සියලු පරිශීලකයින් (${count} members) සාර්ථකව Approve කර Active කරන ලදී!</b>`;
      }
      break;
    }

    case 'set_admin':
    case 'make_admin': {
      botConfig.admin_chat_id = chatId;
      user.is_admin = 1;
      user.is_approved = 1;
      user.is_active = 1;
      replyText = `👑 <b>SUCCESS!</b>\n\nඔබගේ Chat ID (<code>${chatId}</code>) පද්ධතියේ ප්‍රධාන <b>Admin</b> ලෙස නම් කරන ලදී. ඔබට දැන් සියලු පරිපාලක commands ක්‍රියාත්මක කල හැක!`;
      break;
    }

    case 'help': {
      replyText = `📖 <b>REDBULL LOSS RECOVERY MASTER BOT HELP</b>\n\n` +
        `🟢 <b>සාමාන්‍ය Commands:</b>\n` +
        `• <b>/start</b> - Bot වෙත සම්බන්ධ වීම සහ ලියාපදිංචිය\n` +
        `• <b>/status</b> - ඔබගේ open trades සහ loss recovery තත්වය\n` +
        `• <b>/positions</b> - ඔබගේ සියලු සක්‍රිය trades ලැයිස්තුව\n` +
        `• <b>/whitelist</b> - අනුමත කාසි ලැයිස්තුව\n` +
        `• <b>/test_signal</b> - Test Signal එකක් trigger කර Telegram වෙත යැවීම\n` +
        `• <b>/my_off</b> - Trade signals තාවකාලිකව pause කිරීම\n` +
        `• <b>/my_on</b> - Trade signals නැවත ආරම්භ කිරීම\n` +
        `• <b>/skip &lt;id&gt;</b> - Trade එක cancel කර loss එක refund කිරීම\n\n` +
        `👑 <b>Admin Commands:</b>\n` +
        `• <b>/bot_on</b> / <b>/bot_off</b> - Scanner master switch\n` +
        `• <b>/users</b> - සියලු users ලැයිස්තුව\n` +
        `• <b>/approve &lt;id&gt;</b> - User කෙනෙක් approve කිරීම\n` +
        `• <b>/approve_all</b> - සියලු users approve කිරීම\n` +
        `• <b>/set_admin</b> - ඔබව Admin ලෙස පත් කරගැනීම\n` +
        `• <b>/toggle_paper</b> - Paper / Real trading මාරු කිරීම`;
      break;
    }

    default:
      replyText = `ℹ️ නොදන්නා විධානයකි. සියලු commands බැලීමට <b>/menu</b> හෝ <b>/help</b> ලබාදෙන්න.`;
      break;
  }

  const replyMsg: TelegramMessage = {
    id: `reply-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    chat_id: chatId,
    sender_name: 'RedBull Master Bot',
    is_from_bot: true,
    text: replyText,
    buttons,
  };

  broadcastTelegramAlert(replyMsg);
  return replyMsg;
}

// --- CALLBACK QUERY HANDLER (inline buttons from main.py) ---

function handleCallbackQuery(chatId: string, data: string): { success: boolean; message: string } {
  const user = users.get(chatId);
  const isAdmin = chatId === botConfig.admin_chat_id;

  if (data.startsWith('mute:')) {
    const targetSig = data.split(':')[1];
    if (targetSig === 'all') {
      positions.forEach((p) => {
        if (p.chat_id === chatId) p.reminders_sent = 999;
      });
      if (user) user.is_muted = 1;
    } else {
      const sig = parseInt(targetSig, 10);
      const pos = positions.find((p) => p.chat_id === chatId && p.signal_num === sig);
      if (pos) pos.reminders_sent = 999;
    }

    const muteMsg: TelegramMessage = {
      id: `cb-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: chatId,
      sender_name: 'RedBull Master Bot',
      is_from_bot: true,
      text: '✅ <b>Reminder alerts mute කරන ලදී!</b> (Alerts silenced)',
    };
    broadcastTelegramAlert(muteMsg);
    return { success: true, message: 'Alerts muted successfully' };
  }

  if (data.startsWith('skip_trade:')) {
    const sig = parseInt(data.split(':')[1], 10);
    const pos = positions.find((p) => p.chat_id === chatId && p.signal_num === sig && p.is_open === 1);
    if (pos) {
      pos.is_open = 0;
      pos.close_reason = 'SKIPPED_REFUND';
      if (user && pos.attached_loss > 0) {
        user.global_loss_pool += pos.attached_loss;
      }

      const refundTxt = pos.attached_loss > 0
        ? `\n💸 ඔබගේ Loss Pool එකට <b>$${pos.attached_loss.toFixed(4)}</b> ක මුදල නැවත බැර විය.`
        : '';

      const skipMsg: TelegramMessage = {
        id: `cb-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        chat_id: chatId,
        sender_name: 'RedBull Master Bot',
        is_from_bot: true,
        text: `🚫 <b>TRADE #${sig} (${pos.symbol}) SKIPPED & REFUNDED!</b> ↩️\n\n` +
          `✅ මෙම ට්‍රේඩ් එක සාර්ථකව අවලංගු කර slot එක නිදහස් කරන ලදී.${refundTxt}\n\n` +
          `💡 මීළඟට පැමිණෙන නව කාසියකින් මෙම පාඩුව ස්වයංක්‍රීයව පියවනු ඇත.`,
      };
      broadcastTelegramAlert(skipMsg);
      return { success: true, message: `Trade #${sig} skipped and refunded` };
    }
    return { success: false, message: `Trade #${sig} is not active` };
  }

  if (data === 'my_status') {
    handleTelegramCommand(chatId, user?.username || 'user', user?.full_name || 'Member', '/status');
    return { success: true, message: 'Status sent' };
  }

  if (isAdmin && (data.startsWith('approve:') || data.startsWith('reject:'))) {
    const [action, targetId] = data.split(':');
    const target = users.get(targetId);
    if (target) {
      if (action === 'approve') {
        target.is_approved = 1;
        target.is_active = 1;
        broadcastTelegramAlert({
          id: `cb-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          chat_id: targetId,
          sender_name: 'RedBull Master Bot',
          is_from_bot: true,
          text: '🎉 <b>ඔබගේ ගිණුම පරිපාලක (Admin) විසින් අනුමත කරන ලදී!</b>\nදැන් ඔබට සාර්ථකව වෙළඳ සිග්නල් ලැබෙනු ඇත.',
        });
      } else {
        users.delete(targetId);
      }
      return { success: true, message: `User ${targetId} ${action}d` };
    }
  }

  return { success: false, message: 'Unknown action' };
}

// --- BACKGROUND MONITORING LOOP (Price simulation & PnL tracking) ---

function updatePositionsLivePrices() {
  for (const pos of positions) {
    if (pos.is_open !== 1) continue;
    const m = marketCache.get(pos.symbol);
    if (m && m.price > 0) {
      pos.current_price = m.price;
    } else {
      // gentle random tick fluctuation if offline
      const delta = (Math.random() - 0.49) * 0.001;
      pos.current_price = Number((pos.current_price * (1 + delta)).toFixed(4));
    }

    const posSize = pos.margin * pos.leverage;

    // --- 🎯 REQUIREMENT 2: Breakeven (BE) Alert & Stop-Loss Lock ---
    // When market reaches Base TP, send Telegram message immediately to move SL to Entry Price!
    if (!pos.be_alert_sent && pos.attached_loss > 0 && pos.base_tp_price) {
      const hitBaseTp = pos.side === 'BUY'
        ? pos.current_price >= pos.base_tp_price
        : pos.current_price <= pos.base_tp_price;

      if (hitBaseTp) {
        pos.be_alert_sent = true;
        // Lock Breakeven on the position (SL moved to Entry Price)
        pos.sl_price = pos.entry_price;

        const beMsg: TelegramMessage = {
          id: `be-${Date.now()}-${pos.id}`,
          timestamp: new Date().toLocaleTimeString(),
          chat_id: pos.chat_id,
          sender_name: 'RedBull Master Bot',
          is_from_bot: true,
          text: `🛡️ <b>BREAKEVEN (BE) ALERT: MOVE STOP-LOSS TO ENTRY!</b> 🔒\n\n` +
            `💎 <b>Coin:</b> <code>${pos.symbol}</code> (Signal #${pos.signal_num})\n` +
            `📈 <b>Direction:</b> ${pos.side === 'BUY' ? 'BUY / LONG 🟢' : 'SELL / SHORT 🔴'}\n` +
            `⚡ <b>Base TP Hit:</b> $${pos.base_tp_price.toFixed(4)}\n` +
            `💵 <b>Entry Price:</b> $${pos.entry_price.toFixed(4)}\n` +
            `🎯 <b>Remaining Recovery TP:</b> $${pos.tp_price.toFixed(4)}\n` +
            `🛡️ <b>Updated SL:</b> $${pos.entry_price.toFixed(4)} (Breakeven - Zero Risk)\n\n` +
            `Sinhala: <i>⚠️ <b>අවධානයට:</b> ${pos.symbol} කාසියේ මුල් <b>Base TP ($${pos.base_tp_price.toFixed(4)})</b> මට්ටමට මිල පැමිණ ඇත! ` +
            `කරුණාකර ඔබගේ Stop-Loss (SL) අගය <b>Entry Price ($${pos.entry_price.toFixed(4)})</b> වෙත ගෙන ගොස් සකසන්න (Breakeven - BE). ` +
            `එමගින් ප්‍රාග්ධනය 100% ක් සුරක්ෂිත වන අතර කිසිදු පාඩුවක් නොවී සම්පූර්ණ Recovery TP ($${pos.tp_price.toFixed(4)}) දක්වා රැඳී සිටිය හැක.</i>`,
          buttons: [
            [
              { text: '🔒 SL Breakeven Locked', callback_data: `mute:${pos.signal_num}` },
              { text: '📊 My Status', callback_data: 'my_status' },
            ],
          ],
        };
        broadcastTelegramAlert(beMsg);
      }
    }

    if (pos.side === 'BUY') {
      const priceDiffPct = (pos.current_price - pos.entry_price) / pos.entry_price;
      pos.pnl = Number((posSize * priceDiffPct).toFixed(4));
      pos.pnl_pct = Number((priceDiffPct * pos.leverage * 100).toFixed(2));

      // Auto-trigger Take Profit or Stop Loss hit simulation
      if (pos.current_price >= pos.tp_price) {
        closePosition(pos.id, 'TP_HIT');
      } else if (pos.current_price <= pos.sl_price) {
        closePosition(pos.id, 'SL_HIT');
      }
    } else {
      const priceDiffPct = (pos.entry_price - pos.current_price) / pos.entry_price;
      pos.pnl = Number((posSize * priceDiffPct).toFixed(4));
      pos.pnl_pct = Number((priceDiffPct * pos.leverage * 100).toFixed(2));

      if (pos.current_price <= pos.tp_price) {
        closePosition(pos.id, 'TP_HIT');
      } else if (pos.current_price >= pos.sl_price) {
        closePosition(pos.id, 'SL_HIT');
      }
    }
  }
}

function closePosition(positionId: number, reason: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'SKIPPED_REFUND') {
  const pos = positions.find((p) => p.id === positionId && p.is_open === 1);
  if (!pos) return;

  pos.is_open = 0;
  pos.closed_at = Date.now();
  pos.close_reason = reason;

  const user = users.get(pos.chat_id);
  if (!user) return;

  if (reason === 'TP_HIT') {
    // Loss recovery completed!
    if (pos.attached_loss > 0) {
      user.global_loss_completed += pos.attached_loss;
      user.loss_recovery_step += 1;
    }
    broadcastTelegramAlert({
      id: `tp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: pos.chat_id,
      sender_name: 'RedBull Master Bot',
      is_from_bot: true,
      text: `🎉 <b>TAKE PROFIT (TP) REACHED!</b> 🎯\n\n` +
        `💎 <b>Coin:</b> <code>${pos.symbol}</code>\n` +
        `💰 <b>Profit:</b> +$${(pos.pnl || 0.25).toFixed(4)} (+${(pos.pnl_pct || 25).toFixed(2)}%)\n` +
        (pos.attached_loss > 0 ? `🩹 <b>Recovered Loss:</b> $${pos.attached_loss.toFixed(4)} successfully recovered! 🎉\n` : '') +
        `✅ Slot released. Next opportunity scanning active.`,
    });
  } else if (reason === 'SL_HIT') {
    // Stop loss hit -> attached loss + margin SL added back to user's loss pool
    const lossAmount = pos.margin * (user.margin_sl_pct / 100.0);
    user.global_loss_pool += lossAmount + pos.attached_loss;

    broadcastTelegramAlert({
      id: `sl-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: pos.chat_id,
      sender_name: 'RedBull Master Bot',
      is_from_bot: true,
      text: `🛑 <b>STOP LOSS (SL) HIT:</b> <code>${pos.symbol}</code>\n\n` +
        `📉 <b>Loss:</b> -$${lossAmount.toFixed(4)}\n` +
        `🔄 <b>Auto-Recovery:</b> Added to Global Loss Pool ($${user.global_loss_pool.toFixed(4)}).\n` +
        `💡 Next winning trades will systematically recover this deficit.`,
    });
  }
}

// --- AUTOMATED ICHIMOKU MARKET SCANNER WORKER ---
function scanIchimokuSignals() {
  if (botConfig.is_paused) return;

  const openPositions = positions.filter((p) => p.is_open === 1);
  const activeCoinsSet = new Set(openPositions.map((p) => p.symbol));

  for (const sym of whitelist) {
    if (blacklist.has(sym)) continue;

    // 🛑 STRICT RULE 1:
    // එක කාසියකින් ලැබෙන සිග්නල් එකක් close වනතුරු එම කාසියෙන් නව සිග්නල් සෙවිම නතර කලයුතුයි!
    if (activeCoinsSet.has(sym)) {
      continue; // Skip scanning this coin completely while an active trade is open!
    }

    // 🛑 STRICT REQUIREMENT 1: Min Notional Check
    // Exclude coins from scanning that do not meet standard margin Min Notional ($5 / $10)
    const notionalCheck = isCoinNotionalEligible(sym, 0.8, 10);
    if (!notionalCheck.eligible) {
      continue;
    }

    // Cooldown check
    const cooldown = signalCooldowns.get(sym);
    if (cooldown && Date.now() < cooldown) continue;

    const coin = marketCache.get(sym);
    if (!coin || coin.noCut) continue;

    // Check BTC Dump Filter
    const btcCoin = marketCache.get('BTCUSDT');
    const isBtcDumping = botConfig.btc_dump_filter && btcCoin ? btcCoin.change24h < -4.0 : false;

    if (coin.signalType === 'STRONG_UP' || (coin.sanyaku === 1 && coin.score >= 3)) {
      if (!isBtcDumping) {
        dispatchTradeToUsers(sym, 'BUY', coin.price);
        break; // Dispatch one signal per scan tick to keep portfolio balanced
      }
    } else if (coin.signalType === 'STRONG_DOWN' || (coin.sanyaku === -1 && coin.score <= -3)) {
      dispatchTradeToUsers(sym, 'SELL', coin.price);
      break;
    }
  }
}

// --- SERVER INITIALIZATION ---

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Graceful shutdown handling for container platforms like Railway
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal, exiting cleanly...');
    process.exit(0);
  });
  process.on('SIGINT', () => {
    console.log('Received SIGINT signal, exiting cleanly...');
    process.exit(0);
  });

  // Background ticker & monitor interval (every 3 seconds)
  setInterval(() => {
    updatePositionsLivePrices();
  }, 3000);

  // Background Ichimoku auto-scanner (every 8 seconds)
  setInterval(() => {
    scanIchimokuSignals();
  }, 8000);

  // Background Live 5m Candlestick Klines synchronization (every 12 seconds)
  setInterval(() => {
    syncWhitelist5mKlines().catch(() => {});
  }, 12000);

  // Background Binance price sync (every 20 seconds)
  setInterval(() => {
    fetchBinancePrices().catch(() => {});
  }, 20000);

  // --- HEALTH & REPO SIGNATURE ENDPOINTS ---
  app.get(['/health', '/api/health'], (req: Request, res: Response) => {
    res.status(200).send('RedBull Loss Recovery Master Bot (Multi-User Engine) Live!');
  });

  app.get('/', (req: Request, res: Response, next) => {
    // If request accepts HTML, allow Vite/Static dashboard to handle
    if (req.headers.accept?.includes('text/html')) {
      return next();
    }
    res.status(200).send('RedBull Loss Recovery Master Bot (Multi-User Engine) Live!');
  });

  // --- TELEGRAM WEBHOOK ENDPOINTS (POST /webhook and POST /webho) ---
  app.post(['/webhook', '/webho'], (req: Request, res: Response) => {
    try {
      const secretToken = process.env.TELEGRAM_SECRET_TOKEN;
      if (secretToken) {
        const reqToken = req.headers['x-telegram-bot-api-secret-token'];
        if (reqToken !== secretToken) {
          return res.status(403).send('Forbidden');
        }
      }

      const update = req.body;
      if (!update) {
        return res.status(200).send('OK');
      }

      // Handle Callback Query (inline buttons)
      if (update.callback_query) {
        const cb = update.callback_query;
        const cbData = cb.data || '';
        const senderId = String(cb.from?.id || '');
        handleCallbackQuery(senderId, cbData);
        return res.status(200).send('OK');
      }

      // Handle Message
      if (update.message) {
        const msg = update.message;
        const chatId = String(msg.chat?.id || '');
        const text = msg.text || '';
        const username = msg.chat?.username || 'User';
        const fullName = msg.chat?.first_name || 'Member';

        if (text) {
          // Log incoming user message
          telegramMessages.unshift({
            id: `usr-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            chat_id: chatId,
            sender_name: fullName,
            is_from_bot: false,
            text,
          });

          handleTelegramCommand(chatId, username, fullName, text);
        }
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).send('Internal Error');
    }
  });

  // --- REST APIS FOR DASHBOARD ---

  // 1. Bot Status & System Info
  app.get('/api/status', (req: Request, res: Response) => {
    const openPos = positions.filter((p) => p.is_open === 1);
    const openBuys = openPos.filter((p) => p.side === 'BUY').length;
    const openSells = openPos.filter((p) => p.side === 'SELL').length;
    const totalUsers = users.size;
    const approvedUsers = Array.from(users.values()).filter((u) => u.is_approved === 1).length;
    const totalLossPool = Array.from(users.values()).reduce((sum, u) => sum + u.global_loss_pool, 0);
    const totalLossRecovered = Array.from(users.values()).reduce((sum, u) => sum + u.global_loss_completed, 0);

    res.json({
      config: botConfig,
      metrics: {
        openTrades: openPos.length,
        openBuys,
        openSells,
        totalUsers,
        approvedUsers,
        whitelistedCount: whitelist.size,
        blacklistedCount: blacklist.size,
        totalLossPool: Number(totalLossPool.toFixed(4)),
        totalLossRecovered: Number(totalLossRecovered.toFixed(4)),
      },
    });
  });

  // 2. Toggle Bot Controls
  app.post('/api/bot/config', (req: Request, res: Response) => {
    const { 
      is_paused, 
      paper_trading, 
      max_buys, 
      max_sells, 
      max_signals_global, 
      btc_dump_filter,
      ichimoku_preset,
      strong_cut_threshold,
      chop_score_band,
      kijun_slope_len,
      telegram_bot_token,
      admin_chat_id,
      auto_approve_users
    } = req.body;
    if (typeof is_paused === 'boolean') botConfig.is_paused = is_paused;
    if (typeof paper_trading === 'boolean') botConfig.paper_trading = paper_trading;
    if (typeof max_buys === 'number') botConfig.max_buys = max_buys;
    if (typeof max_sells === 'number') botConfig.max_sells = max_sells;
    if (typeof max_signals_global === 'number') botConfig.max_signals_global = max_signals_global;
    if (typeof btc_dump_filter === 'boolean') botConfig.btc_dump_filter = btc_dump_filter;
    if (ichimoku_preset && ['Crypto', 'Classic', '5-Day Week'].includes(ichimoku_preset)) {
      botConfig.ichimoku_preset = ichimoku_preset;
    }
    if (typeof strong_cut_threshold === 'number') botConfig.strong_cut_threshold = strong_cut_threshold;
    if (typeof chop_score_band === 'number') botConfig.chop_score_band = chop_score_band;
    if (typeof kijun_slope_len === 'number') botConfig.kijun_slope_len = kijun_slope_len;
    if (typeof admin_chat_id === 'string' && admin_chat_id.trim()) {
      botConfig.admin_chat_id = admin_chat_id.trim();
    }
    if (typeof auto_approve_users === 'boolean') {
      botConfig.auto_approve_users = auto_approve_users;
    }
    if (typeof telegram_bot_token === 'string' && telegram_bot_token.trim()) {
      botConfig.telegram_bot_token = telegram_bot_token.trim();
      telegramPollingActive = false; // Trigger reload of polling loop
      setTimeout(() => {
        initTelegramBotEngine().catch((err) => {
          console.warn('[Telegram Re-init Warning]:', err.message);
        });
      }, 500);
    }

    res.json({ success: true, config: botConfig });
  });

  // Outbound Telegram message test trigger from dashboard
  app.post('/api/telegram/test-outbound', (req: Request, res: Response) => {
    const { chatId } = req.body;
    const targetChat = chatId || botConfig.admin_chat_id;
    const token = getTelegramToken();
    const testMsg: TelegramMessage = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: targetChat,
      sender_name: 'RedBull Master Bot',
      is_from_bot: true,
      text: `🔔 <b>REDBULL BOT TELEGRAM CONNECTIVITY TEST!</b>\n\n` +
        `✅ Telegram Bot සම්බන්ධතාවය සහ Outbound Dispatches සාර්ථකව ක්‍රියාත්මකයි!\n` +
        `⚡ RedBull Loss Recovery Engine එකෙන් Trading Signals ලැබීමට ඔබගේ ගිණුම සූදානම්.\n\n` +
        `• Chat ID: <code>${targetChat}</code>\n` +
        `• Mode: ${botConfig.paper_trading ? 'Paper Trading' : 'Live Binance'}\n\n` +
        `විධාන පරීක්ෂා කිරීමට <b>/status</b> හෝ <b>/test_signal</b> යවන්න.`,
      buttons: [
        [
          { text: '📊 My Status', callback_data: 'my_status' },
          { text: '🚀 Test Signal', callback_data: 'skip:0' },
        ],
      ],
    };

    broadcastTelegramAlert(testMsg);
    res.json({
      success: true,
      hasToken: Boolean(token),
      targetChat,
      message: `Test alert dispatched to chat ${targetChat}`,
      sentMessage: testMsg,
    });
  });

  // 3. User Management
  app.get('/api/users', (req: Request, res: Response) => {
    const userList = Array.from(users.values()).map((u) => {
      const activeCount = positions.filter((p) => p.chat_id === u.chat_id && p.is_open === 1).length;
      return { ...u, active_trades_count: activeCount };
    });
    res.json(userList);
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const data = req.body as Partial<User> & { chat_id: string };
    if (!data.chat_id) {
      return res.status(400).json({ error: 'chat_id is required' });
    }

    let existing = users.get(data.chat_id);
    if (!existing) {
      existing = {
        chat_id: data.chat_id,
        full_name: data.full_name || 'Member',
        username: data.username || 'member',
        is_approved: data.is_approved ?? 1,
        is_active: data.is_active ?? 1,
        is_admin: data.is_admin ?? 0,
        base_margin: data.base_margin ?? 0.8,
        leverage: data.leverage ?? 10,
        margin_sl_pct: data.margin_sl_pct ?? 27.0,
        fast_tp_pct: data.fast_tp_pct ?? 30.0,
        rtp_pct: data.rtp_pct ?? 15.0,
        blacklist_balance_set: data.blacklist_balance_set ?? 0.10,
        max_user_trades: data.max_user_trades ?? 5,
        user_start_hour: data.user_start_hour ?? 0,
        user_start_minute: data.user_start_minute ?? 0,
        user_end_hour: data.user_end_hour ?? 23,
        user_end_minute: data.user_end_minute ?? 59,
        user_custom_time_enabled: data.user_custom_time_enabled ?? 0,
        is_muted: data.is_muted ?? 0,
        global_loss_pool: data.global_loss_pool ?? 0.0,
        global_loss_completed: data.global_loss_completed ?? 0.0,
        loss_recovery_step: 0,
        last_interaction: new Date().toISOString(),
      };
    } else {
      Object.assign(existing, data);
    }
    users.set(data.chat_id, existing);
    res.json({ success: true, user: existing });
  });

  app.post('/api/users/:chatId/action', (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { action, value } = req.body;
    const user = users.get(chatId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (action === 'approve') {
      user.is_approved = 1;
      user.is_active = 1;
    } else if (action === 'reject') {
      users.delete(chatId);
      return res.json({ success: true, message: 'User rejected and removed' });
    } else if (action === 'toggle_active') {
      user.is_active = user.is_active === 1 ? 0 : 1;
    } else if (action === 'adjust_loss') {
      const delta = Number(value) || 0;
      user.global_loss_pool = Math.max(0, user.global_loss_pool + delta);
    } else if (action === 'reset_loss') {
      user.global_loss_pool = 0;
    }

    res.json({ success: true, user });
  });

  // 4. Positions Management
  app.get('/api/positions', (req: Request, res: Response) => {
    res.json(positions);
  });

  app.post('/api/positions/:id/close', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { reason = 'MANUAL_CLOSE' } = req.body;
    closePosition(id, reason);
    res.json({ success: true, position: positions.find((p) => p.id === id) });
  });

  app.post('/api/positions/:id/skip', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const pos = positions.find((p) => p.id === id && p.is_open === 1);
    if (!pos) {
      return res.status(404).json({ error: 'Position not found' });
    }

    pos.is_open = 0;
    pos.close_reason = 'SKIPPED_REFUND';
    const user = users.get(pos.chat_id);
    if (user && pos.attached_loss > 0) {
      user.global_loss_pool += pos.attached_loss;
    }

    telegramMessages.unshift({
      id: `skip-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: pos.chat_id,
      sender_name: 'RedBull Master Bot',
      is_from_bot: true,
      text: `🚫 <b>TRADE #${pos.signal_num} (${pos.symbol}) SKIPPED & REFUNDED!</b> ↩️\n` +
        `Attached loss ($${pos.attached_loss.toFixed(4)}) returned to loss pool.`,
    });

    res.json({ success: true, position: pos });
  });

  // 5. Coins Market & Lists
  app.get('/api/coins', (req: Request, res: Response) => {
    seedBaselineCoins();
    const openPos = positions.filter((p) => p.is_open === 1);
    const activeSymbolsMap = new Map<string, 'BUY' | 'SELL'>();
    for (const p of openPos) {
      activeSymbolsMap.set(p.symbol, p.side);
    }

    const coins = Array.from(marketCache.values()).map((c) => ({
      ...c,
      inWhitelist: whitelist.has(c.symbol),
      inBlacklist: blacklist.has(c.symbol),
      blacklistReason: blacklist.get(c.symbol)?.reason,
      hasActiveTrade: activeSymbolsMap.has(c.symbol),
      activeTradeSide: activeSymbolsMap.get(c.symbol),
    }));
    res.json(coins);
  });

  app.post('/api/coins/whitelist', (req: Request, res: Response) => {
    const { symbol, action } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const sym = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
    if (action === 'add') {
      whitelist.add(sym);
      blacklist.delete(sym);
    } else if (action === 'remove') {
      whitelist.delete(sym);
    } else if (action === 'reset_default') {
      whitelist = new Set(defaultCoinsList);
    }

    res.json({ success: true, whitelist: Array.from(whitelist) });
  });

  app.post('/api/coins/blacklist', (req: Request, res: Response) => {
    const { symbol, reason = 'Manually blacklisted', action } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const sym = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
    if (action === 'add') {
      blacklist.set(sym, { reason, added_at: new Date().toISOString() });
      whitelist.delete(sym);
    } else if (action === 'remove') {
      blacklist.delete(sym);
    }

    res.json({ success: true, blacklist: Array.from(blacklist.entries()) });
  });

  // 6. Manual Signal Dispatch
  app.post('/api/signals/dispatch', (req: Request, res: Response) => {
    const { symbol, side, price } = req.body;
    if (!symbol || !side) {
      return res.status(400).json({ error: 'Symbol and side are required' });
    }

    const sym = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
    const m = marketCache.get(sym);
    const executionPrice = Number(price) || m?.price || 100.0;

    const result = dispatchTradeToUsers(sym, side, executionPrice);
    res.json(result);
  });

  // 7. Telegram Simulator Messages
  app.get('/api/telegram/messages', (req: Request, res: Response) => {
    res.json(telegramMessages.slice(0, 50));
  });

  app.post('/api/telegram/send', (req: Request, res: Response) => {
    const { chatId, text, username, fullName } = req.body;
    if (!chatId || !text) {
      return res.status(400).json({ error: 'chatId and text are required' });
    }

    // Save outgoing message
    const userMsg: TelegramMessage = {
      id: `usr-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chat_id: chatId,
      sender_name: fullName || 'User',
      is_from_bot: false,
      text,
    };
    telegramMessages.unshift(userMsg);

    const botReply = handleTelegramCommand(chatId, username || 'user', fullName || 'Member', text);
    res.json({ success: true, userMessage: userMsg, botReply });
  });

  app.post('/api/telegram/callback', (req: Request, res: Response) => {
    const { chatId, callbackData } = req.body;
    if (!chatId || !callbackData) {
      return res.status(400).json({ error: 'chatId and callbackData required' });
    }
    const result = handleCallbackQuery(chatId, callbackData);
    res.json(result);
  });

  // --- VITE MIDDLEWARE IN DEV OR STATIC IN PROD ---
  const distDir = path.resolve(__dirname, 'dist');
  const distIndexHtml = path.resolve(distDir, 'index.html');
  const hasDist = fs.existsSync(distIndexHtml);

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(distIndexHtml);
    });
  } else if (hasDist) {
    // If dist is built even in non-production, serve static files as primary
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(distIndexHtml);
    });
  } else {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('⚠️ Vite middleware could not be loaded, serving fallback dashboard:', e);
      app.get('*', (req: Request, res: Response) => {
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RedBull Loss Recovery Master</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
              h1 { color: #f43f5e; margin-top: 0; font-size: 22px; display: flex; align-items: center; gap: 8px; }
              .badge { display: inline-block; padding: 4px 12px; background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid rgba(34,197,94,0.4); border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
              .links { background: #0f172a; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #334155; }
              .links a { color: #38bdf8; text-decoration: none; display: block; padding: 6px 0; font-family: monospace; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>⚡ RedBull Loss Recovery Engine</h1>
              <div class="badge">● Server Active (Port ${PORT})</div>
              <p>The backend server, Binance 5m Kline Ichimoku scanner, and risk engine are running live.</p>
              <div class="links">
                <a href="/api/status" target="_blank">📊 /api/status - Live Metrics</a>
                <a href="/api/coins" target="_blank">🪙 /api/coins - 5m Ichimoku Scanner</a>
                <a href="/api/positions" target="_blank">💼 /api/positions - Active Positions</a>
                <a href="/health" target="_blank">❤️ /health - Health Check</a>
              </div>
            </div>
          </body>
          </html>
        `);
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RedBull Loss Recovery Master Server listening at http://0.0.0.0:${PORT}`);

    // Start Telegram Bot Long Polling engine
    initTelegramBotEngine().catch((err) => {
      console.warn('⚠️ [Telegram Engine Startup Warning]:', err.message);
    });

    // Start background Binance price fetching & 5m Kline calculations
    fetchBinancePrices().catch(() => {});
    syncWhitelist5mKlines().catch(() => {});
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
