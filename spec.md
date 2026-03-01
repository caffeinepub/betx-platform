# BetX Platform

## Current State
A full sports betting + casino platform with:
- Sports betting (12 events, Football/Basketball/Tennis/Cricket)
- Casino lobby with 8 games: Aviator, Slot Machine, Fishing, Mines, Roulette, Plinko, Coin Flip, Dice Roll
- Wallet: basic Deposit/Withdrawal tabs with demo balance
- Auth, Leaderboard, Admin, My Bets pages
- Dark theme with electric green (neon) and gold accents

## Requested Changes (Diff)

### Add
- **New Casino Games:**
  - Teen Patti (Indian card game, 3 cards, Classic/Joker modes, Ante-based)
  - Andar Bahar (Indian card game, pick Andar or Bahar, 1 card drawn each side)
  - Baccarat (Player vs Banker, classic card game)
  - Dragon Tiger (2-card battle — Dragon vs Tiger, Tie pays 8x)
- **Payment Methods section in WalletPage:**
  - Tab: "P2P Transfer" — send funds to another username on the platform
  - Payment method selector on Deposit tab: USDT (TRC20), Bitcoin (BTC), UPI / PayTM, Bank Transfer (NEFT/IMPS), Netbanking
  - Payment method selector on Withdrawal tab: same options above
  - Each method shows fake wallet address / UPI ID / bank details for demo
  - P2P Transfer: input username + amount, deducts from sender, adds to recipient (simulated)
- **Unique visual template refresh:**
  - Add a premium neon-purple accent color alongside existing neon-green and gold
  - Casino page: add a scrolling ticker at top showing recent big wins across platform
  - Add VIP badge system: Bronze/Silver/Gold/Platinum based on total bets placed
  - Animated gradient border on active game card

### Modify
- **CasinoPage:** Add 4 new Indian card games to GAMES array with new category "Cards"
- **WalletPage:** Add P2P Transfer as 3rd tab alongside Deposit/Withdraw; enhance payment method selection UI per tab
- **BettingContext:** Add P2P transfer function `transferToUser(toUsername, amount): boolean`; add VIP tier computation to user
- **CasinoPage categories:** Add "Cards" category tab for Indian card games

### Remove
- Nothing removed

## Implementation Plan
1. Add `transferToUser` to BettingContext and expose in context type
2. Create `TeenPattiGame.tsx` in src/frontend/src/pages/games/
3. Create `AndarBaharGame.tsx` in src/frontend/src/pages/games/
4. Create `BaccaratGame.tsx` in src/frontend/src/pages/games/
5. Create `DragonTigerGame.tsx` in src/frontend/src/pages/games/
6. Update CasinoPage.tsx: import 4 new games, add to GAMES array, add "Cards" category
7. Update WalletPage.tsx: add P2P Transfer tab, add payment method UI on deposit/withdraw tabs
8. Update BettingContext.tsx: add transferToUser function, add VIP tier helper
9. Add recent-wins ticker component to CasinoPage header
10. Add VIP badge display in Navbar or user profile area
