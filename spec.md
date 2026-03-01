# RangBaazi - Color Prediction & Betting Platform

## Current State
A full-featured sports betting and casino platform (BetX) with:
- Sports betting (Football, Basketball, Tennis, Cricket)
- Casino games: Aviator, Slots, Fishing, Mines, Roulette, Plinko, Teen Patti, Andar Bahar, Baccarat, Dragon Tiger, Coin Flip, Dice Roll
- Wallet with UPI, Bank, USDT, Bitcoin, P2P transfer
- Admin panel (locked to Khanzyy@) with Payments, Website Settings tabs
- Promotions page with referral system and daily bonus
- PWA install banner, CSV downloads
- VIP tier system, leaderboard

## Requested Changes (Diff)

### Add
- **Color Prediction Game ("Win Go")** -- Core game of Tiranga-style platforms:
  - 1-minute round timer countdown
  - Bet on Red (2x), Green (2x), or Violet (4.5x)
  - Numbers 0-9 displayed; 0 and 5 are Violet+Red/Green
  - Round history table showing last 20 results with color indicators
  - Multiple game modes: Win Go 1min, Win Go 3min, Win Go 5min (same game, different timer)
  - Big/Small betting option (Big=5-9, Small=0-4) both pay 2x
  - Number betting (0-9) pays 9x
  - My Orders tab showing personal bet history per round
- **Dedicated "Prediction" page** in navbar (primary feature)
- **Platform renamed** to "RangBaazi" (logo, titles, storage keys, PWA name)

### Modify
- Navbar: add "Prediction" tab as first/featured nav item with special highlight
- CasinoPage: add Win Go to the games list under a new "Prediction" category tab
- BettingContext: add ColorPrediction state (rounds, bets, history), rename storage keys to rangbaazi_*
- App.tsx: add "prediction" page route
- All "BetX" / "BETX" text references changed to "RangBaazi" / "RANGBAAZI"
- PWA banner: "Install RangBaazi App"
- Admin page: update site name default to RangBaazi
- Referral code prefix: RANG- instead of BETX-

### Remove
- Nothing removed

## Implementation Plan
1. Create `ColorPredictionGame.tsx` -- full Win Go game with timer, betting, history
2. Create `PredictionPage.tsx` -- standalone page featuring Win Go game modes
3. Update `BettingContext.tsx`:
   - Add color prediction types, state, round management
   - Rename storage keys to rangbaazi_*
   - Change referral code prefix to RANG-
   - Update DEFAULT_WEBSITE_SETTINGS siteName to RangBaazi
4. Update `App.tsx`:
   - Add "prediction" page case
   - Rename PWA banner to RangBaazi
5. Update `Navbar.tsx` -- add Prediction tab with featured styling
6. Update `CasinoPage.tsx` -- add Prediction category with Win Go entry
7. Update `AdminPage.tsx` -- update default site name references
8. Update `index.html` -- title to RangBaazi
