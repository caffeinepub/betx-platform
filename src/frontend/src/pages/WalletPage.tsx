import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../context/BettingContext";

const DEPOSIT_PRESETS = [10, 25, 50, 100, 250, 500];

type PaymentMethod = "USDT" | "Bitcoin" | "UPI" | "Bank" | "Netbanking";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "USDT", label: "USDT (TRC20)", icon: "₮" },
  { id: "Bitcoin", label: "Bitcoin (BTC)", icon: "₿" },
  { id: "UPI", label: "UPI / PayTM", icon: "📲" },
  { id: "Bank", label: "Bank Transfer", icon: "🏦" },
  { id: "Netbanking", label: "Netbanking", icon: "💻" },
];

const PAYMENT_DETAILS: Record<
  PaymentMethod,
  {
    lines: { label: string; value: string; copyable?: boolean }[];
    note?: string;
  }
> = {
  USDT: {
    lines: [
      { label: "Network", value: "TRC20 (Tron)" },
      {
        label: "Address",
        value: "TXyz1234BetXabc5678defgh9012abcd",
        copyable: true,
      },
      { label: "Min Deposit", value: "$10 USDT" },
    ],
    note: "Send only USDT on TRC20 network. Other networks will result in loss of funds.",
  },
  Bitcoin: {
    lines: [
      { label: "Network", value: "Bitcoin (BTC)" },
      {
        label: "Address",
        value: "bc1q9betxplatform1234xyz789abcdef",
        copyable: true,
      },
      { label: "Min Deposit", value: "0.0005 BTC" },
    ],
    note: "Minimum 1 network confirmation required. Processing time: 10–30 min.",
  },
  UPI: {
    lines: [
      { label: "UPI ID", value: "betx@paytm", copyable: true },
      { label: "PayTM", value: "9876543210", copyable: true },
      { label: "GPay / PhonePe", value: "betx@ybl", copyable: true },
    ],
    note: "After payment, screenshot and click Confirm Deposit below.",
  },
  Bank: {
    lines: [
      { label: "Bank Name", value: "BetX Payments Pvt Ltd" },
      { label: "Account No.", value: "1234567890123", copyable: true },
      { label: "IFSC Code", value: "BETX0001234", copyable: true },
      { label: "Account Type", value: "Current Account" },
    ],
    note: "Use NEFT/IMPS/RTGS. Add your username in remarks for instant credit.",
  },
  Netbanking: {
    lines: [
      { label: "Method", value: "NEFT / IMPS / RTGS" },
      { label: "Account", value: "1234567890123" },
      { label: "IFSC", value: "BETX0001234" },
    ],
    note: "Login to your bank portal and transfer to the above account. Processing: 15–60 min.",
  },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 p-0.5 text-muted-foreground hover:text-neon transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-neon" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function PaymentMethodSelector({
  selected,
  onSelect,
}: {
  selected: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-2">
        Payment Method
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PAYMENT_METHODS.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`px-3 py-1.5 text-xs font-bold border rounded-sm transition-all ${
              selected === m.id
                ? "border-purple bg-purple/10 text-purple"
                : "border-border bg-secondary text-muted-foreground hover:border-purple/50"
            }`}
            style={
              selected === m.id
                ? {
                    borderColor: "oklch(0.65 0.25 290)",
                    background: "oklch(0.65 0.25 290 / 10%)",
                    color: "oklch(0.65 0.25 290)",
                  }
                : {}
            }
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      {/* Details card */}
      <div className="bg-secondary border border-border rounded-sm p-3 mb-3">
        <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
          {PAYMENT_METHODS.find((m) => m.id === selected)?.label} Details
        </p>
        <div className="space-y-1.5">
          {PAYMENT_DETAILS[selected].lines.map((line) => (
            <div
              key={line.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-xs text-muted-foreground">
                {line.label}
              </span>
              <div className="flex items-center">
                <span className="text-xs font-mono font-medium text-foreground truncate max-w-[160px]">
                  {line.value}
                </span>
                {line.copyable && <CopyButton value={line.value} />}
              </div>
            </div>
          ))}
        </div>
        {PAYMENT_DETAILS[selected].note && (
          <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
            ⚠️ {PAYMENT_DETAILS[selected].note}
          </p>
        )}
      </div>
    </div>
  );
}

export function WalletPage() {
  const { user, deposit, withdraw, transactions, transferToUser } =
    useBetting();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "p2p">(
    "deposit",
  );
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>("USDT");
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>("USDT");
  const [p2pUsername, setP2pUsername] = useState("");
  const [p2pAmount, setP2pAmount] = useState("");

  if (!user) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-16 flex flex-col items-center justify-center gap-4">
        <Wallet className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="font-display font-bold text-xl mb-2">
            Log in to access Wallet
          </h2>
        </div>
      </div>
    );
  }

  const fmt = (n: number) =>
    `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const handleDeposit = () => {
    const amount = Number.parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    deposit(amount);
    toast.success(
      `${fmt(amount)} added to your balance! (${PAYMENT_METHODS.find((m) => m.id === depositMethod)?.label})`,
    );
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    const amount = Number.parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const success = withdraw(amount);
    if (success) {
      toast.success(
        `Withdrawal of ${fmt(amount)} requested via ${PAYMENT_METHODS.find((m) => m.id === withdrawMethod)?.label}`,
      );
      setWithdrawAmount("");
    } else {
      toast.error("Insufficient balance");
    }
  };

  const handleP2P = () => {
    const amount = Number.parseFloat(p2pAmount);
    if (!p2pUsername.trim()) {
      toast.error("Enter recipient username");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const result = transferToUser(p2pUsername.trim(), amount);
    if (result.success) {
      toast.success(`${fmt(amount)} sent to @${p2pUsername}!`);
      setP2pUsername("");
      setP2pAmount("");
    } else {
      toast.error(result.error ?? "Transfer failed");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalDeposited = transactions
    .filter((t) => t.type === "Deposit" && t.isCredit)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = transactions
    .filter((t) => t.type === "Withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWon = transactions
    .filter((t) => t.type === "Bet Won" || t.type === "Casino Win")
    .reduce((sum, t) => sum + t.amount, 0);

  const txIcon = (type: string) => {
    if (type === "Deposit")
      return <ArrowDownLeft className="w-4 h-4 text-win" />;
    if (type === "Withdrawal")
      return <ArrowUpRight className="w-4 h-4 text-loss" />;
    if (type === "P2P Send")
      return (
        <ArrowLeftRight
          className="w-4 h-4 text-purple"
          style={{ color: "oklch(0.65 0.25 290)" }}
        />
      );
    if (type === "P2P Receive")
      return <ArrowLeftRight className="w-4 h-4 text-neon" />;
    if (type === "Bet Placed" || type === "Casino Loss")
      return <TrendingDown className="w-4 h-4 text-loss" />;
    if (type === "Bet Won" || type === "Casino Win")
      return <TrendingUp className="w-4 h-4 text-win" />;
    return <Trophy className="w-4 h-4 text-gold" />;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your balance · Deposit · Withdraw · P2P Transfer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Balance + Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Balance card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-sm p-6"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.15 0.015 264), oklch(0.13 0.01 264))",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </span>
              </div>
              <span className="text-xs bg-neon/10 text-neon px-2 py-0.5 rounded-sm font-bold">
                DEMO
              </span>
            </div>
            <p className="font-display font-black text-4xl text-gold mb-1">
              {fmt(user.balance)}
            </p>
            <p className="text-xs text-muted-foreground">
              Welcome, {user.displayName}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
              {[
                {
                  label: "Deposited",
                  value: fmt(totalDeposited),
                  color: "text-win",
                },
                { label: "Won", value: fmt(totalWon), color: "text-neon" },
                {
                  label: "Withdrawn",
                  value: fmt(totalWithdrawn),
                  color: "text-muted-foreground",
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action tabs */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("deposit")}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === "deposit"
                    ? "bg-neon/10 text-neon border-b-2 border-neon"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 inline mr-1" />
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("withdraw")}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === "withdraw"
                    ? "bg-loss/10 text-loss border-b-2 border-loss"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
                Withdraw
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("p2p")}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === "p2p"
                    ? "border-b-2"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={
                  activeTab === "p2p"
                    ? {
                        background: "oklch(0.65 0.25 290 / 10%)",
                        color: "oklch(0.65 0.25 290)",
                        borderBottomColor: "oklch(0.65 0.25 290)",
                      }
                    : {}
                }
              >
                <ArrowLeftRight className="w-3.5 h-3.5 inline mr-1" />
                P2P
              </button>
            </div>

            <div className="p-4">
              {activeTab === "deposit" && (
                <div className="space-y-3">
                  {/* Payment method */}
                  <PaymentMethodSelector
                    selected={depositMethod}
                    onSelect={setDepositMethod}
                  />

                  {/* Quick presets */}
                  <div className="grid grid-cols-3 gap-2">
                    {DEPOSIT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setDepositAmount(String(preset))}
                        className={`py-2 text-sm font-bold border rounded-sm transition-all ${
                          depositAmount === String(preset)
                            ? "border-neon bg-neon/10 text-neon"
                            : "border-border bg-secondary text-muted-foreground hover:border-neon/50 hover:text-foreground"
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="pl-7 bg-secondary border-border rounded-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    After payment, click below to credit your demo balance.
                  </p>
                  <Button
                    onClick={handleDeposit}
                    className="w-full bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
                  >
                    <ArrowDownLeft className="w-4 h-4 mr-1.5" />
                    Confirm Deposit {depositAmount ? `$${depositAmount}` : ""}
                  </Button>
                </div>
              )}

              {activeTab === "withdraw" && (
                <div className="space-y-3">
                  {/* Payment method */}
                  <PaymentMethodSelector
                    selected={withdrawMethod}
                    onSelect={setWithdrawMethod}
                  />

                  <p className="text-xs text-muted-foreground">
                    Available:{" "}
                    <span className="text-gold font-bold">
                      {fmt(user.balance)}
                    </span>
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="Withdrawal amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="pl-7 bg-secondary border-border rounded-sm"
                    />
                  </div>
                  <Button
                    onClick={handleWithdraw}
                    variant="outline"
                    className="w-full border-loss text-loss hover:bg-loss/10 font-bold rounded-sm"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                    Request Withdrawal
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    ⏱ Withdrawal processed in 1–3 business days (demo mode)
                  </p>
                </div>
              )}

              {activeTab === "p2p" && (
                <div className="space-y-3">
                  <div
                    className="p-3 rounded-sm border"
                    style={{
                      background: "oklch(0.65 0.25 290 / 8%)",
                      borderColor: "oklch(0.65 0.25 290 / 30%)",
                    }}
                  >
                    <p
                      className="text-xs font-bold mb-0.5"
                      style={{ color: "oklch(0.65 0.25 290)" }}
                    >
                      🔄 P2P Transfer
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Send funds instantly to any registered player.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="p2p-username"
                      className="text-xs text-muted-foreground font-medium block mb-1"
                    >
                      Recipient Username
                    </label>
                    <Input
                      id="p2p-username"
                      type="text"
                      placeholder="Enter username (e.g. rajking99)"
                      value={p2pUsername}
                      onChange={(e) => setP2pUsername(e.target.value)}
                      className="bg-secondary border-border rounded-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="p2p-amount"
                      className="text-xs text-muted-foreground font-medium block mb-1"
                    >
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="p2p-amount"
                        type="number"
                        placeholder="Amount to send"
                        value={p2pAmount}
                        onChange={(e) => setP2pAmount(e.target.value)}
                        className="pl-7 bg-secondary border-border rounded-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your balance:{" "}
                    <span className="text-gold font-bold">
                      {fmt(user.balance)}
                    </span>
                  </p>
                  <Button
                    onClick={handleP2P}
                    className="w-full font-bold rounded-sm h-11"
                    style={{
                      background: "oklch(0.65 0.25 290 / 15%)",
                      border: "1px solid oklch(0.65 0.25 290)",
                      color: "oklch(0.65 0.25 290)",
                    }}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                    Send Funds
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Instant transfer — no fees in demo mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-sm">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-bold">Transaction History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {transactions.length} transactions
              </p>
            </div>
            {transactions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground text-sm">
                  No transactions yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">
                        Type
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground">
                        Description
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {txIcon(tx.type)}
                            <span className="text-xs font-medium">
                              {tx.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                          <span className="truncate block">
                            {tx.description}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-sm font-bold text-right ${
                            tx.isCredit ? "text-win" : "text-loss"
                          }`}
                        >
                          {tx.isCredit ? "+" : "-"}
                          {fmt(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${
                              tx.status === "Completed"
                                ? "bg-win/10 text-win"
                                : tx.status === "Pending"
                                  ? "bg-gold/10 text-gold"
                                  : "bg-loss/10 text-loss"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
