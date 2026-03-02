# RangBaazi

## Current State
Full-stack sports betting and casino platform with:
- Wallet page with Deposit/Withdraw/P2P tabs
- Existing payment methods: UPI, USDT (TRC20), Bitcoin, Bank Transfer, Netbanking
- Admin Panel with a "Payments" tab to configure payment methods
- BettingContext with PaymentMethodConfig, PaymentSettings types
- Deposit: 1-min timer, ₹100 min / ₹50,000 max, preset buttons
- Withdrawal: basic form, no approval workflow
- No Stripe/PayPal/Razorpay UI gateway screens
- No withdrawal approval queue in Admin

## Requested Changes (Diff)

### Add
- **Stripe gateway UI card** on Deposit tab: card number, expiry, CVV fields with realistic card-input styling, "Pay with Stripe" button (UI-only, no real API)
- **PayPal gateway UI card** on Deposit tab: "Pay with PayPal" button that opens a PayPal-style modal with email + password fields (UI-only)
- **Razorpay gateway UI card** on Deposit tab: shows Razorpay-branded payment sheet (UI-only) with UPI / Card / Netbanking sub-tabs
- New payment gateway type identifiers in PaymentMethodConfig: `"Stripe"`, `"PayPal"`, `"Razorpay"` alongside existing `"UPI"`, `"USDT"`, `"Bitcoin"`, `"Bank"`, `"Netbanking"`
- **Withdrawal approval queue** in Admin Panel > new "Withdrawals" tab:
  - Table of all pending withdrawal requests (username, amount, method, date)
  - Approve / Reject buttons per row
  - Status badges: Pending / Approved / Rejected
  - When approved: user balance deducted (already done at request time), status updated to Approved
  - When rejected: balance refunded to user
- `WithdrawalRequest` type added to BettingContext with fields: id, userId, username, amount, method, status, date
- `withdrawalRequests` state array in BettingContext
- `approveWithdrawal(id)` and `rejectWithdrawal(id)` actions in BettingContext
- Update `withdraw()` action to create a WithdrawalRequest entry (status: "Pending") instead of immediately completing
- Admin tab list updated to include "Withdrawals" tab with a count badge

### Modify
- **WalletPage Deposit tab**: existing payment methods remain; new gateways (Stripe, PayPal, Razorpay) shown as additional method buttons; clicking them shows the respective gateway UI below instead of the plain details card
- **PaymentMethodSelector**: support rendering dedicated gateway UI components for Stripe, PayPal, Razorpay IDs
- **AdminPage**: add "Withdrawals" tab (between Transactions and Users); show pending count badge on tab
- **Admin > Payments tab**: add Stripe, PayPal, Razorpay as toggleable methods (enable/disable), with configuration fields (API key placeholder, webhook URL placeholder — display-only labels noting "UI demo only")
- Transaction history: withdrawal transactions show status "Pending Approval" initially, updating to "Approved"/"Rejected" when admin acts

### Remove
- Nothing removed

## Implementation Plan
1. Add `WithdrawalRequest` type and related state/actions to BettingContext
2. Update `withdraw()` to create a pending WithdrawalRequest
3. Add `approveWithdrawal` / `rejectWithdrawal` functions that update request status and refund on rejection
4. Add default Stripe, PayPal, Razorpay entries to paymentSettings.methods in initial state
5. Build `StripePaymentForm`, `PayPalModal`, `RazorpaySheet` UI sub-components in WalletPage
6. Update `PaymentMethodSelector` to render dedicated UI for gateway types
7. Add "Withdrawals" admin tab to AdminPage TABS array with pending count badge
8. Build `WithdrawalsPanel` component in AdminPage showing the approval queue table
9. Update Admin > Payments tab to show Stripe/PayPal/Razorpay as configurable gateway rows
10. Validate, typecheck, and build
