# 📜 RED BULL MASTER ADMIN COMMANDS MENU
━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. මූලික පාලනය (Basic Controls):
• `/bot_on` : බොට් සක්රීය කරයි.
• `/bot_off` : බොට් තාවකාලිකව නවතයි.
• `/retune` : Normal (Inverted) සහ Trend-Following අතර මාරු වේ.
• `/toggle_paper` : Paper Trading සහ Real Binance අතර මාරු වේ.
• `/status` : පද්ධතියේ සම්පූර්ණ තත්ත්වය පෙන්වයි (Mr. Master Admin Status Dashboard).
• `/skip` : විවෘත ට්රේඩ් එකක් මඟහැර Attached Loss එක නැවත Refund කරයි.
• `/max_trade` : උපරිම trade ගණන.

### 👑 `/status` Dashboard Output Structure:
```text
👑 [MR. MASTER ADMIN STATUS DASHBOARD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. බොට් සක්රීයද: RUNNING 🟢
2. Retune මාදිලිය (/retune): TREND-FOLLOWING 🔄
3. ක්රියාත්මක මාදිලිය (/toggle_paper): 🧪 PAPER TRADING
4. දිශානුගත සීමා (/set_dir_limit): Max BUYs: 4 | Max SELLs: 4
5. Stale Timeout (/set_stale_timeout): 72.0 Hours
6. සිග්නල් වේලාව (/set_signal_time): 07:30 - 23:59

7. අනුමත සාමාජිකයන්ගේ ID (0):
සාමාජිකයින් නොමැත

8. ඉවත් කළ සාමාජිකයන්ගේ ID (0):
කිසිවෙකු නැත

9. සිග්නල් තත්ත්වය: ACTIVE SCANNING 🟢 (Online)
10. Admin Margin අගය: $0.80 (Leverage: 10x)
11. Take Profit (TP) අගය: 30.0%
12. Stop Loss (SL) අගය: 27.0%
13. Global Loss Pool අගය (To Cover): $0.00
14. Complete Loss Pool අගය (Recovered): $0.00

15. Active Trade ගණන (0 / 10):
  


16. Whitelist Coin ගණන (51):
1000BONKUSDT, 1000PEPEUSDT, AAVEUSDT, ADAUSDT, AMDUSDT, AVAXUSDT, BICOUSDT, BNBUSDT, BTCUSDT, BZUSDT, C98USDT, CLUSDT, CRCLUSDT, CYSUSDT, DRAMUSDT, ENAUSDT, ETHUSDT, EWYUSDT, FILUSDT, GOOGLUSDT, GRVTUSDT, GWEIUSDT, HFTUSDT, HOMEUSDT, INTCUSDT, LINKUSDT, LITEUSDT, MSTRUSDT, NEARUSDT, NVDAUSDT, ONUSDT, PAXGUSDT, PLTRUSDT, QQQUSDT, SAMSUNGUSDT, SOLUSDT, SPCXUSDT, STGUSDT, TAKEUSDT, TAOUSDT, TSLAUSDT, TSTUSDT, UNIUSDT, WDCUSDT, WLDUSDT, XAGUSDT, XAUTUSDT, XAUUSDT, XRPUSDT, ZBTUSDT, ZECUSDT


17. Blacklist Coin ගණන (0):



18. Binance Private API: CONNECTED 🟢 (Key: ...qZ73)
```

## 2. Smart Scanner & කාසි පාලනය (Market & Coins):
• `/auto_scan` : Binance පීරා $0.80 Margin එකට ගැලපෙන හොඳම Altcoins ස්වයංක්රීයව Whitelist කරයි.
• `/sync_coins` : Binance Futures සක්රීය කාසි Private API එකෙන් කියවයි.
• `/fwl_default` : මූලික කාසි 50 ම නැවත Whitelist එකට එක් කරයි.
• `/fwl_add [COINS]` : කාසි Whitelist එකට එක් කරයි.
• `/fwl_remove [COINS]` : කාසි Whitelist එකෙන් ඉවත් කරයි.
• `/clear_lists` : Whitelist ලැයිස්තුව සම්පූර්ණයෙන්ම හිස් කරයි.
• `/blacklist_view` : Blacklist ලැයිස්තුව පෙන්වයි.
• `/blacklist_add [COIN]` : කාසි Blacklist කරයි.
• `/blacklist_remove [COIN]` : කාසි Blacklist එකෙන් ඉවත් කරයි.

## 3. Admin Default සැකසුම් (අලුත් සාමාජිකයින්ට මෙය හිමිවේ):
• `/set_margin [VAL]` : Admin Margin අගය වෙනස් කිරීම (උදා: `/set_margin 0.8`).
• `/set_leverage [VAL]` : Admin Leverage අගය වෙනස් කිරීම (උදා: `/set_leverage 10`).
• `/set_tp [VAL]` : Admin Take Profit % වෙනස් කිරීම (උදා: `/set_tp 30`).
• `/set_sl [VAL]` : Admin Stop Loss % වෙනස් කිරීම (උදා: `/set_sl 27`).
• `/set_loss [VAL]` : Admin trade එකකදි signal එකකට එකතු කරන උපරුම loss එක සැකසිම (උදා: `/set_loss 0.20`).

## 4. අවදානම් පාලනය (Risk Controls):
• `/set_dir_limit [BUYS] [SELLS]` : දිශානුගත සීමා පනවයි (උදා: `/set_dir_limit 4 4`).
• `/set_stale_timeout [HOURS]` : හිරවූ ට්රේඩ් ඉවත් කිරීමේ කාලය. (Duration)
• `/set_signal_time [START] [END]` : ක්රියාත්මක වේලාව.

## 5. කණ්ඩායම් කළමනාකරණය (Team Management):
• `/users` : සියලු සාමාජිකයින්ගේ කෙටි ලැයිස්තුව.
• `/user_view [CHAT_ID]` : සාමාජිකයෙකුගේ සම්පූර්ණ විස්තර බැලීම.
• `/approve [CHAT_ID]` : සාමාජිකයෙකු අනුමත කරයි.
• `/remove_user [CHAT_ID]` : සාමාජිකයෙකු ඉවත් කරයි.
• `/pause_user [CHAT_ID]` : සාමාජිකයාගේ සිග්නල් නවතයි.
• `/resume_user [CHAT_ID]` : සාමාජිකයාගේ සිග්නල් නැවත අරඹයි.

## 6. සාමාජිකයින්ගේ Settings වෙනස් කිරීම:
• `/set_user_margin [CHAT_ID] [VAL]` : Margin වෙනස් කිරීම.
• `/set_user_leverage [CHAT_ID] [VAL]` : Leverage වෙනස් කිරීම.
• `/set_user_tp [CHAT_ID] [VAL]` : Take Profit වෙනස් කිරීම.
• `/set_user_sl [CHAT_ID] [VAL]` : Stop Loss වෙනස් කිරීම.
• `/set_loss [VAL]` : Admin trade එකකදි signal එකකට එකතු කරන උපරුම loss එක සැකසිම (උදා: `/set_rtp 0.20`).
• `/set_user_max_trades [CHAT_ID] [VAL]` : උපරිම ට්රේඩ් ගණන.
• `/set_user_time [CHAT_ID] [START] [END]` : වෙළඳ වේලාව.

## 7. පණිවිඩ යැවීම සහ වාර්තා (Messaging & Reports):
• `/broadcast [MSG]` : සියලු සාමාජිකයින්ට එකවර පණිවිඩ යැවීම.
• `/msg [CHAT_ID] [MSG]` : එක් සාමාජිකයෙකුට පෞද්ගලික පණිවිඩයක් යැවීම.
• `/coin_stats` : එක් එක් කාසියේ කාර්යසාධනය පෙන්වයි.
