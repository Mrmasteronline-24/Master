# 📜 RED BULL MASTER ADMIN COMMANDS MENU
━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. මූලික පාලනය (Basic Controls):
• `/bot_on` : බොට් සක්රීය කරයි.
• `/bot_off` : බොට් තාවකාලිකව නවතයි.
• `/retune` : Normal (Inverted) සහ Trend-Following අතර මාරු වේ.
• `/toggle_paper` : Paper Trading සහ Real Binance අතර මාරු වේ.
• `/status` : පද්ධතියේ සම්පූර්ණ තත්ත්වය පෙන්වයි.
• `/skip` : විවෘත ට්රේඩ් එකක් මඟහැර Attached Loss එක නැවත Refund කරයි.
• `/max_trade` : උපරිම trade ගණන.

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
