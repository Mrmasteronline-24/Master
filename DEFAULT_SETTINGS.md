# ⚙️ Defult setting (RedBull Master Bot Default Settings)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```text
Defult setting


1. බොට් සක්රීයද: RUNNING 🟢
2. Retune මාදිලිය ): 
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
   •)))


16. Whitelist Coin ගණන (51):
1000BONKUSDT, 1000PEPEUSDT, AAVEUSDT, ADAUSDT, AMDUSDT, AVAXUSDT, BICOUSDT, BNBUSDT, BTCUSDT, BZUSDT, C98USDT, CLUSDT, CRCLUSDT, CYSUSDT, DRAMUSDT, ENAUSDT, ETHUSDT, EWYUSDT, FILUSDT, GOOGLUSDT, GRVTUSDT, GWEIUSDT, HFTUSDT, HOMEUSDT, INTCUSDT, LINKUSDT, LITEUSDT, MSTRUSDT, NEARUSDT, NVDAUSDT, ONUSDT, PAXGUSDT, PLTRUSDT, QQQUSDT, SAMSUNGUSDT, SOLUSDT, SPCXUSDT, STGUSDT, TAKEUSDT, TAOUSDT, TSLAUSDT, TSTUSDT, UNIUSDT, WDCUSDT, WLDUSDT, XAGUSDT, XAUTUSDT, XAUUSDT, XRPUSDT, ZBTUSDT, ZECUSDT


17. Blacklist Coin ගණන (0):



18. Binance Private API: CONNECTED 🟢 (Key: ...qZ73)
```

## Summary of Config Parameters in Code
- **Bot State**: Running (`is_paused: false`)
- **Retune Mode**: Trend-Following (`is_retuned: true`)
- **Execution Mode**: Paper Trading (`paper_trading: true`)
- **Directional Limits**: Max BUYs: 4 | Max SELLs: 4 (`max_buys: 4`, `max_sells: 4`)
- **Stale Timeout**: 72.0 Hours (`stale_timeout_hours: 72.0`)
- **Signal Active Window**: 07:30 - 23:59 (`signal_start_time: '07:30'`, `signal_end_time: '23:59'`)
- **Approved Members**: 0 non-admin members
- **Removed Members**: 0 members
- **Admin Margin**: $0.80 @ 10x Leverage (`admin_default_margin: 0.80`, `admin_default_leverage: 10`)
- **Take Profit (TP)**: 30.0% (`admin_default_tp: 30.0`)
- **Stop Loss (SL)**: 27.0% (`admin_default_sl: 27.0`)
- **Global Loss Pool**: $0.00 (`global_loss_pool: 0.00`)
- **Recovered Loss Pool**: $0.00 (`global_loss_completed: 0.00`)
- **Active Trades**: 0 / 10 (`   •)))`)
- **Whitelisted Coins (51)**: 51 pre-configured Binance Futures pairs
- **Blacklisted Coins (0)**: Empty blacklist
- **Binance Private API**: Connected (`binance_connected: true`, key preview `...qZ73`)
