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
  Clock,
  Copy,
  Download,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PaymentMethodConfig } from "../context/BettingContext";
import { useBetting } from "../context/BettingContext";

const DEPOSIT_PRESETS = [100, 500, 1000, 2000, 5000, 10000];

const MIN_DEPOSIT = 100;
const MAX_DEPOSIT = 50000;

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

function DepositTimer({
  depositMethod,
}: {
  depositMethod: string;
}) {
  const [seconds, setSeconds] = useState(60);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer when method changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: depositMethod is a prop used to trigger timer reset
  useEffect(() => {
    setSeconds(60);
    setExpired(false);

    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setExpired(true);
          setTimeout(() => {
            setSeconds(60);
            setExpired(false);
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    intervalRef.current = id;

    return () => {
      clearInterval(id);
    };
  }, [depositMethod]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const urgency = seconds <= 15;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs font-bold transition-colors ${
        expired
          ? "border-loss/50 bg-loss/10 text-loss"
          : urgency
            ? "border-gold/50 bg-gold/10 text-gold animate-pulse"
            : "border-neon/30 bg-neon/5 text-neon"
      }`}
    >
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      {expired ? (
        <span>Session expired. Refreshing...</span>
      ) : (
        <span>Session expires in: {timeStr}</span>
      )}
    </div>
  );
}

function PaymentMethodSelector({
  methods,
  selected,
  onSelect,
}: {
  methods: PaymentMethodConfig[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const activeMethod = methods.find((m) => m.id === selected);

  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-2">
        Payment Method
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {methods.map((m) => (
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
      {activeMethod && (
        <div className="bg-secondary border border-border rounded-sm p-3 mb-3">
          <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
            {activeMethod.label} Details
          </p>
          <div className="space-y-1.5">
            {activeMethod.details.map((line) => (
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
          {activeMethod.note && (
            <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
              ⚠️ {activeMethod.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function WalletPage() {
  const {
    user,
    deposit,
    withdraw,
    transactions,
    transferToUser,
    paymentSettings,
  } = useBetting();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "p2p">(
    "deposit",
  );
  const [depositMethod, setDepositMethod] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("");
  const [p2pUsername, setP2pUsername] = useState("");
  const [p2pAmount, setP2pAmount] = useState("");

  const activeMethods = paymentSettings.methods.filter((m) => m.active);

  // Set default deposit/withdraw method when active methods are available
  useEffect(() => {
    if (activeMethods.length > 0 && !depositMethod) {
      setDepositMethod(activeMethods[0].id);
    }
  }, [activeMethods, depositMethod]);

  useEffect(() => {
    if (activeMethods.length > 0 && !withdrawMethod) {
      setWithdrawMethod(activeMethods[0].id);
    }
  }, [activeMethods, withdrawMethod]);

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
    `₹${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const handleDeposit = () => {
    const amount = Number.parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ₹${MIN_DEPOSIT}`);
      return;
    }
    if (amount > MAX_DEPOSIT) {
      toast.error(`Maximum deposit is ₹${MAX_DEPOSIT.toLocaleString()}`);
      return;
    }
    const method = activeMethods.find((m) => m.id === depositMethod);
    deposit(amount);
    toast.success(
      `${fmt(amount)} added to your balance! (${method?.label ?? depositMethod})`,
    );
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    const amount = Number.parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const method = activeMethods.find((m) => m.id === withdrawMethod);
    const success = withdraw(amount);
    if (success) {
      toast.success(
        `Withdrawal of ${fmt(amount)} requested via ${method?.label ?? withdrawMethod}`,
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

  const downloadTransactionsCSV = () => {
    const headers = [
      "Type",
      "Description",
      "Amount",
      "Credit/Debit",
      "Status",
      "Date",
    ];
    const rows = transactions.map((t) => [
      t.type,
      `"${t.description}"`,
      t.amount.toFixed(2),
      t.isCredit ? "Credit" : "Debit",
      t.status,
      new Date(t.date).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "betx-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transaction history downloaded!");
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
                  {/* Deposit limits info */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-secondary/50 px-2.5 py-1.5 rounded-sm border border-border">
                    <span>
                      Min:{" "}
                      <span className="text-neon font-bold">
                        ₹{MIN_DEPOSIT.toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Max:{" "}
                      <span className="text-gold font-bold">
                        ₹{MAX_DEPOSIT.toLocaleString()}
                      </span>
                    </span>
                  </div>

                  {/* Payment method */}
                  {activeMethods.length > 0 ? (
                    <PaymentMethodSelector
                      methods={activeMethods}
                      selected={depositMethod}
                      onSelect={setDepositMethod}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No payment methods available
                    </p>
                  )}

                  {/* 1-minute session timer */}
                  {depositMethod && (
                    <DepositTimer depositMethod={depositMethod} />
                  )}

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
                        ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
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
                    Confirm Deposit{" "}
                    {depositAmount
                      ? `₹${Number(depositAmount).toLocaleString()}`
                      : ""}
                  </Button>
                </div>
              )}

              {activeTab === "withdraw" && (
                <div className="space-y-3">
                  {/* Payment method */}
                  {activeMethods.length > 0 ? (
                    <PaymentMethodSelector
                      methods={activeMethods}
                      selected={withdrawMethod}
                      onSelect={setWithdrawMethod}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No payment methods available
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Available:{" "}
                    <span className="text-gold font-bold">
                      {fmt(user.balance)}
                    </span>
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ₹
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
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold">Transaction History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {transactions.length} transactions
                </p>
              </div>
              {transactions.length > 0 && (
                <Button
                  onClick={downloadTransactionsCSV}
                  variant="outline"
                  size="sm"
                  className="border-neon/40 text-neon hover:bg-neon/10 rounded-sm"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download CSV
                </Button>
              )}
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
