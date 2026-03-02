import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CreditCard,
  Download,
  QrCode,
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

function UpiQrCode({
  upiId,
  amount,
  customImageUrl,
}: {
  upiId: string;
  amount?: string;
  customImageUrl?: string;
}) {
  const amountNum = Number.parseFloat(amount || "0");
  const upiLink =
    amountNum > 0
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amountNum}&cu=INR`
      : `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`;

  // Use a QR code generated via URL encoding displayed as a visual placeholder
  // when no custom image is provided
  const imageToShow = customImageUrl;

  return (
    <div className="flex flex-col items-center gap-3 py-3">
      {imageToShow ? (
        <div className="bg-white p-3 rounded-lg border-2 border-neon/30 shadow-lg">
          <img
            src={imageToShow}
            alt="UPI QR Code"
            className="w-44 h-44 object-contain"
          />
        </div>
      ) : (
        <div
          className="bg-white p-4 rounded-lg border-2 border-neon/30 shadow-lg flex flex-col items-center justify-center gap-2"
          style={{ width: 176, height: 176 }}
        >
          <QrCode className="w-16 h-16 text-gray-800" />
          <p className="text-[10px] text-gray-600 text-center font-medium">
            {upiId}
          </p>
        </div>
      )}
      <div className="text-center">
        <p className="text-xs font-bold text-neon flex items-center justify-center gap-1">
          <QrCode className="w-3.5 h-3.5" />
          Scan to Pay via UPI
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Works with GPay, PhonePe, PayTM, BHIM
        </p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
          {upiId}
        </p>
        {amount && Number.parseFloat(amount) > 0 && (
          <p className="text-xs font-bold text-gold mt-1">
            Amount: ₹{Number(amount).toLocaleString()}
          </p>
        )}
      </div>
      <a
        href={upiLink}
        className="text-[11px] text-neon underline"
        target="_blank"
        rel="noreferrer"
      >
        Open UPI App directly
      </a>
    </div>
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

// ================================================================
// STRIPE PAYMENT FORM
// ================================================================

function StripePaymentForm({ amount }: { amount: string }) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const getCardType = () => {
    const n = cardNumber.replace(/\s/g, "");
    if (n.startsWith("4")) return "Visa";
    if (n.startsWith("5") || n.startsWith("2")) return "Mastercard";
    if (n.startsWith("34") || n.startsWith("37")) return "Amex";
    return null;
  };

  const handlePay = () => {
    if (
      !cardName ||
      cardNumber.replace(/\s/g, "").length < 16 ||
      !expiry ||
      !cvv
    ) {
      toast.error("Please fill in all card details");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Payment initiated via Stripe (demo)");
    }, 1500);
  };

  const cardType = getCardType();
  const amountNum = Number.parseFloat(amount) || 0;

  return (
    <div
      className="rounded-sm border p-4 space-y-3 mt-2"
      style={{
        background: "oklch(0.12 0.03 265)",
        borderColor: "oklch(0.5 0.22 280 / 40%)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: "#635BFF" }} />
          <span className="text-sm font-bold" style={{ color: "#635BFF" }}>
            Pay with Stripe
          </span>
        </div>
        {cardType && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-white/10 text-foreground">
            {cardType}
          </span>
        )}
      </div>

      <div>
        <label
          htmlFor="stripe-name"
          className="text-[11px] text-muted-foreground block mb-1"
        >
          Cardholder Name
        </label>
        <Input
          id="stripe-name"
          placeholder="John Doe"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          className="h-9 text-sm bg-secondary/50 border-border rounded-sm"
          data-ocid="stripe.input"
        />
      </div>

      <div>
        <label
          htmlFor="stripe-number"
          className="text-[11px] text-muted-foreground block mb-1"
        >
          Card Number
        </label>
        <Input
          id="stripe-number"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          className="h-9 text-sm bg-secondary/50 border-border rounded-sm font-mono tracking-wider"
          data-ocid="stripe.input"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="stripe-expiry"
            className="text-[11px] text-muted-foreground block mb-1"
          >
            Expiry MM/YY
          </label>
          <Input
            id="stripe-expiry"
            placeholder="08/27"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="h-9 text-sm bg-secondary/50 border-border rounded-sm font-mono"
            data-ocid="stripe.input"
          />
        </div>
        <div>
          <label
            htmlFor="stripe-cvv"
            className="text-[11px] text-muted-foreground block mb-1"
          >
            CVV
          </label>
          <Input
            id="stripe-cvv"
            placeholder="123"
            value={cvv}
            type="password"
            maxLength={4}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="h-9 text-sm bg-secondary/50 border-border rounded-sm font-mono"
            data-ocid="stripe.input"
          />
        </div>
      </div>

      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full font-bold rounded-sm h-10 mt-1"
        style={{ background: "#635BFF", color: "#fff" }}
        data-ocid="stripe.submit_button"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
            Processing...
          </span>
        ) : (
          `Pay ₹${amountNum > 0 ? amountNum.toLocaleString() : "---"} with Stripe`
        )}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        🔒 Secured by Stripe — demo mode only
      </p>
    </div>
  );
}

// ================================================================
// PAYPAL MODAL
// ================================================================

function PayPalModal({ amount }: { amount: string }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const amountNum = Number.parseFloat(amount) || 0;

  const handleContinue = () => {
    if (!email || !password) {
      toast.error("Please enter your PayPal credentials");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Redirecting to PayPal... (demo)");
    }, 1500);
  };

  return (
    <div
      className="rounded-sm border p-4 space-y-3 mt-2"
      style={{ background: "oklch(0.12 0.03 230)", borderColor: "#003087aa" }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black" style={{ color: "#003087" }}>
            Pay
          </span>
          <span className="text-lg font-black" style={{ color: "#009cde" }}>
            Pal
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Secure Checkout
        </span>
      </div>

      {!showLogin ? (
        <div className="space-y-3">
          <div
            className="p-3 rounded-sm text-center"
            style={{
              background: "oklch(0.2 0.04 230)",
              border: "1px solid #009cde33",
            }}
          >
            <p className="text-xs text-muted-foreground">Amount to pay</p>
            <p className="text-xl font-black text-foreground mt-0.5">
              ₹{amountNum > 0 ? amountNum.toLocaleString() : "---"}
            </p>
          </div>
          <Button
            onClick={() => setShowLogin(true)}
            className="w-full font-bold rounded-sm h-10"
            style={{ background: "#009cde", color: "#fff" }}
            data-ocid="paypal.primary_button"
          >
            Continue with PayPal
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            You'll be securely redirected to PayPal (demo mode)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-foreground">Sign in to PayPal</p>
          <div>
            <label
              htmlFor="paypal-email"
              className="text-[11px] text-muted-foreground block mb-1"
            >
              Email or mobile number
            </label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-sm bg-secondary/50 border-border rounded-sm"
              data-ocid="paypal.input"
            />
          </div>
          <div>
            <label
              htmlFor="paypal-pass"
              className="text-[11px] text-muted-foreground block mb-1"
            >
              Password
            </label>
            <Input
              id="paypal-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-sm bg-secondary/50 border-border rounded-sm"
              data-ocid="paypal.input"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogin(false)}
              className="flex-1 rounded-sm h-9 border-border text-muted-foreground hover:text-foreground text-xs"
              data-ocid="paypal.cancel_button"
            >
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="flex-1 font-bold rounded-sm h-9 text-xs"
              style={{ background: "#003087", color: "#fff" }}
              data-ocid="paypal.submit_button"
            >
              {loading ? "Connecting..." : "Log In & Pay"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// RAZORPAY SHEET
// ================================================================

const RAZORPAY_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
];

function RazorpaySheet({ amount }: { amount: string }) {
  const [subTab, setSubTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);
  const amountNum = Number.parseFloat(amount) || 0;

  const formatCard = (val: string) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExp = (val: string) => {
    const d = val.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Pay via Razorpay (demo)");
    }, 1500);
  };

  return (
    <div
      className="rounded-sm border p-4 space-y-3 mt-2"
      style={{ background: "oklch(0.11 0.03 240)", borderColor: "#3395FF44" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">⚡</span>
        <span className="text-sm font-bold" style={{ color: "#3395FF" }}>
          Razorpay Checkout
        </span>
        <span className="ml-auto text-xs font-bold text-muted-foreground">
          ₹{amountNum > 0 ? amountNum.toLocaleString() : "---"}
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-sm p-0.5">
        {(["upi", "card", "netbanking"] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-sm transition-all ${
              subTab === t
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`razorpay.${t}.tab`}
          >
            {t === "upi" ? "UPI" : t === "card" ? "Card" : "Netbanking"}
          </button>
        ))}
      </div>

      {subTab === "upi" && (
        <div className="space-y-2">
          <label
            htmlFor="rp-upi"
            className="text-[11px] text-muted-foreground block"
          >
            UPI ID
          </label>
          <Input
            id="rp-upi"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="h-9 text-sm bg-secondary/50 border-border rounded-sm"
            data-ocid="razorpay.input"
          />
        </div>
      )}

      {subTab === "card" && (
        <div className="space-y-2">
          <Input
            placeholder="Card Number"
            value={cardNum}
            onChange={(e) => setCardNum(formatCard(e.target.value))}
            className="h-9 text-sm bg-secondary/50 border-border rounded-sm font-mono"
            data-ocid="razorpay.input"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExp(e.target.value))}
              className="h-9 text-sm bg-secondary/50 border-border rounded-sm font-mono"
              data-ocid="razorpay.input"
            />
            <Input
              placeholder="CVV"
              type="password"
              value={cardCvv}
              onChange={(e) =>
                setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="h-9 text-sm bg-secondary/50 border-border rounded-sm font-mono"
              data-ocid="razorpay.input"
            />
          </div>
        </div>
      )}

      {subTab === "netbanking" && (
        <div className="space-y-2">
          <label
            htmlFor="rp-bank"
            className="text-[11px] text-muted-foreground block"
          >
            Select Bank
          </label>
          <Select value={bank} onValueChange={setBank}>
            <SelectTrigger
              id="rp-bank"
              className="h-9 text-sm bg-secondary/50 border-border rounded-sm"
              data-ocid="razorpay.select"
            >
              <SelectValue placeholder="Choose your bank" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {RAZORPAY_BANKS.map((b) => (
                <SelectItem key={b} value={b} className="text-sm">
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full font-bold rounded-sm h-10"
        style={{ background: "#3395FF", color: "#fff" }}
        data-ocid="razorpay.submit_button"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
            Processing...
          </span>
        ) : (
          "Pay via Razorpay (demo)"
        )}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        🔒 Secured by Razorpay — demo mode only
      </p>
    </div>
  );
}

function PaymentMethodSelector({
  methods,
  selected,
  onSelect,
  depositAmount,
}: {
  methods: PaymentMethodConfig[];
  selected: string;
  onSelect: (id: string) => void;
  depositAmount?: string;
}) {
  const activeMethod = methods.find((m) => m.id === selected);
  const isUpi = activeMethod?.id === "UPI";
  const isGateway =
    activeMethod?.id === "Stripe" ||
    activeMethod?.id === "PayPal" ||
    activeMethod?.id === "Razorpay";

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

      {/* Gateway-specific UI */}
      {activeMethod?.id === "Stripe" && depositAmount !== undefined && (
        <StripePaymentForm amount={depositAmount} />
      )}
      {activeMethod?.id === "PayPal" && depositAmount !== undefined && (
        <PayPalModal amount={depositAmount} />
      )}
      {activeMethod?.id === "Razorpay" && depositAmount !== undefined && (
        <RazorpaySheet amount={depositAmount} />
      )}

      {/* Generic payment method details (not shown for gateways) */}
      {activeMethod && !isGateway && (
        <div className="bg-secondary border border-border rounded-sm p-3 mb-3">
          <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
            {activeMethod.label} Details
          </p>

          {/* UPI QR Code */}
          {isUpi && (activeMethod.upiId || activeMethod.qrImageUrl) && (
            <UpiQrCode
              upiId={activeMethod.upiId || "upi@paytm"}
              amount={depositAmount}
              customImageUrl={activeMethod.qrImageUrl}
            />
          )}

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
    const success = withdraw(amount, method?.label ?? withdrawMethod);
    if (success) {
      toast.success(
        `Withdrawal of ${fmt(amount)} requested via ${method?.label ?? withdrawMethod} — pending admin approval`,
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
                      depositAmount={depositAmount}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No payment methods available
                    </p>
                  )}

                  {/* 1-minute session timer (not shown for gateways) */}
                  {depositMethod &&
                    !["Stripe", "PayPal", "Razorpay"].includes(
                      depositMethod,
                    ) && <DepositTimer depositMethod={depositMethod} />}

                  {/* Quick presets — always show so gateway forms get the amount */}
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

                  {/* Confirm Deposit button — hidden for gateway methods */}
                  {!["Stripe", "PayPal", "Razorpay"].includes(
                    depositMethod,
                  ) && (
                    <>
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
                    </>
                  )}
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
