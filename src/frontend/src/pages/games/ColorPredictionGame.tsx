import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

// ================================================================
// TYPES
// ================================================================

type BetColor = "red" | "green" | "violet";
type BetSize = "big" | "small";
type BetSelection =
  | { type: "color"; value: BetColor }
  | { type: "number"; value: number }
  | { type: "size"; value: BetSize };

interface RoundResult {
  period: string;
  number: number;
  color: BetColor | "violet+red" | "violet+green";
  bigSmall: "Big" | "Small";
}

interface PersonalBet {
  period: string;
  selection: string;
  point: number;
  result: RoundResult | null;
  status: "Pending" | "Won" | "Lost";
  profit: number;
}

type GameMode = "1min" | "3min" | "5min";

// ================================================================
// CONSTANTS
// ================================================================

const GAME_DURATIONS: Record<GameMode, number> = {
  "1min": 60,
  "3min": 180,
  "5min": 300,
};

const GAME_LABELS: Record<GameMode, string> = {
  "1min": "Win Go 1Min",
  "3min": "Win Go 3Min",
  "5min": "Win Go 5Min",
};

// Number to color mapping
function getNumberColor(n: number): BetColor | "violet+red" | "violet+green" {
  if (n === 0) return "violet+red";
  if (n === 5) return "violet+green";
  if (n === 1 || n === 3 || n === 7 || n === 9) return "green";
  return "red"; // 2, 4, 6, 8
}

function getPrimaryColor(
  colorResult: BetColor | "violet+red" | "violet+green",
): BetColor {
  if (colorResult === "violet+red") return "red";
  if (colorResult === "violet+green") return "green";
  return colorResult;
}

function getResultBigSmall(n: number): "Big" | "Small" {
  return n >= 5 ? "Big" : "Small";
}

function generatePeriod(mode: GameMode, roundIndex: number): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const modePrefix = mode === "1min" ? "1" : mode === "3min" ? "3" : "5";
  return `${dateStr}${modePrefix}-${String(roundIndex).padStart(5, "0")}`;
}

// ================================================================
// COLOR DOT
// ================================================================

function ColorDot({
  color,
  size = "sm",
}: {
  color: BetColor | "violet+red" | "violet+green";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "w-3 h-3" : size === "md" ? "w-5 h-5" : "w-7 h-7";

  if (color === "violet+red") {
    return (
      <div
        className={`${sizeClass} rounded-full flex overflow-hidden flex-shrink-0`}
      >
        <div
          className="w-1/2 h-full"
          style={{ background: "oklch(0.6 0.25 290)" }}
        />
        <div
          className="w-1/2 h-full"
          style={{ background: "oklch(0.65 0.22 22)" }}
        />
      </div>
    );
  }
  if (color === "violet+green") {
    return (
      <div
        className={`${sizeClass} rounded-full flex overflow-hidden flex-shrink-0`}
      >
        <div
          className="w-1/2 h-full"
          style={{ background: "oklch(0.6 0.25 290)" }}
        />
        <div
          className="w-1/2 h-full"
          style={{ background: "oklch(0.75 0.2 145)" }}
        />
      </div>
    );
  }

  const bgColor =
    color === "red"
      ? "oklch(0.65 0.22 22)"
      : color === "green"
        ? "oklch(0.75 0.2 145)"
        : "oklch(0.6 0.25 290)";

  return (
    <div
      className={`${sizeClass} rounded-full flex-shrink-0`}
      style={{ background: bgColor }}
    />
  );
}

// ================================================================
// TIMER CIRCLE
// ================================================================

function TimerCircle({
  timeLeft,
  total,
}: {
  timeLeft: number;
  total: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const dashOffset = circumference * (1 - progress);

  const isLow = timeLeft <= 10;
  const color = isLow
    ? "oklch(0.65 0.22 22)"
    : timeLeft <= 30
      ? "oklch(0.82 0.2 68)"
      : "oklch(0.88 0.23 155)";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 132, height: 132 }}
    >
      <svg
        className="absolute inset-0"
        width="132"
        height="132"
        viewBox="0 0 132 132"
        role="img"
        aria-label="Countdown timer"
      >
        {/* Background circle */}
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="oklch(0.22 0.015 264)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dashoffset 0.8s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <motion.span
          key={timeLeft}
          initial={isLow ? { scale: 1.3 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="font-display font-black text-4xl tabular-nums leading-none"
          style={{ color }}
        >
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </motion.span>
        <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">
          countdown
        </span>
      </div>
    </div>
  );
}

// ================================================================
// SINGLE GAME MODE
// ================================================================

interface ModeState {
  timeLeft: number;
  roundIndex: number;
  history: RoundResult[];
  personalBets: PersonalBet[];
  pendingBet: {
    selection: BetSelection;
    amount: number;
    multiplier: number;
    period: string;
  } | null;
  lastResult: RoundResult | null;
  showResult: boolean;
}

function useGameMode(mode: GameMode) {
  const total = GAME_DURATIONS[mode];
  const roundIndexRef = useRef(
    Math.floor(Date.now() / (total * 1000)) % 100000,
  );
  const [state, setState] = useState<ModeState>({
    timeLeft: total - (Math.floor(Date.now() / 1000) % total),
    roundIndex: roundIndexRef.current,
    history: [],
    personalBets: [],
    pendingBet: null,
    lastResult: null,
    showResult: false,
  });

  // Settle bet when round ends
  const settleRound = useCallback(
    (
      result: RoundResult,
      pendingBet: ModeState["pendingBet"],
      addTransaction: (
        type: "Casino Win" | "Casino Loss",
        amount: number,
        description: string,
        isCredit: boolean,
      ) => void,
      updateBalance: (delta: number) => void,
    ) => {
      if (!pendingBet) return null;

      const { selection, amount, multiplier } = pendingBet;
      let won = false;
      let payout = 0;

      if (selection.type === "color") {
        const betColor = selection.value;
        const resultColor = result.color;
        // Check if bet color matches result (including violet combos)
        if (
          betColor === "red" &&
          (resultColor === "red" || resultColor === "violet+red")
        ) {
          won = true;
          payout = amount * 2;
        } else if (
          betColor === "green" &&
          (resultColor === "green" || resultColor === "violet+green")
        ) {
          won = true;
          payout = amount * 2;
        } else if (
          betColor === "violet" &&
          (resultColor === "violet+red" || resultColor === "violet+green")
        ) {
          won = true;
          payout = amount * 4.5;
        }
      } else if (selection.type === "number") {
        if (selection.value === result.number) {
          won = true;
          payout = amount * 9;
        }
      } else if (selection.type === "size") {
        if (selection.value === result.bigSmall.toLowerCase()) {
          won = true;
          payout = amount * 2;
        }
      }

      if (won) {
        addTransaction(
          "Casino Win",
          payout,
          `Win Go: Won ${result.period}`,
          true,
        );
        updateBalance(payout);
        toast.success(`🎉 You won ₹${payout.toFixed(2)}!`);
      } else {
        addTransaction(
          "Casino Loss",
          amount,
          `Win Go: Lost ${result.period}`,
          false,
        );
        toast.error(`Result: ${result.number} — Better luck next round!`);
      }

      const selectionStr =
        selection.type === "color"
          ? selection.value
          : selection.type === "number"
            ? `#${selection.value}`
            : selection.value === "big"
              ? "Big"
              : "Small";

      return {
        period: pendingBet.period,
        selection: selectionStr,
        point: amount * multiplier,
        result,
        status: (won ? "Won" : "Lost") as "Won" | "Lost",
        profit: won ? payout - amount : -amount,
      } satisfies PersonalBet;
    },
    [],
  );

  return { state, setState, total, settleRound };
}

// ================================================================
// GAME MODE PANEL
// ================================================================

interface GameModePanelProps {
  mode: GameMode;
  isActive: boolean;
}

function GameModePanel({ mode, isActive }: GameModePanelProps) {
  const { user, addTransaction, updateUserBalance } = useBetting();
  const total = GAME_DURATIONS[mode];
  const { state, setState, settleRound } = useGameMode(mode);

  // Bet form state
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [betAmount, setBetAmount] = useState("10");
  const [multiplier, setMultiplier] = useState(1);
  const [confirming, setConfirming] = useState(false);

  const currentPeriod = generatePeriod(mode, state.roundIndex);

  // Deduct balance helper
  const deductBalance = useCallback(
    (amount: number) => {
      if (!user) return;
      updateUserBalance(user.id, user.balance - amount);
    },
    [user, updateUserBalance],
  );

  // Credit balance helper
  const creditBalance = useCallback(
    (amount: number) => {
      if (!user) return;
      updateUserBalance(user.id, user.balance + amount);
    },
    [user, updateUserBalance],
  );

  // Timer countdown
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          // Round ends — generate result
          const num = Math.floor(Math.random() * 10);
          const color = getNumberColor(num);
          const bigSmall = getResultBigSmall(num);
          const newRoundIndex = prev.roundIndex + 1;

          const result: RoundResult = {
            period: generatePeriod(mode, prev.roundIndex),
            number: num,
            color,
            bigSmall,
          };

          // Settle pending bet
          let newPersonalBet: PersonalBet | null = null;
          if (prev.pendingBet) {
            newPersonalBet = settleRound(
              result,
              prev.pendingBet,
              (type, amount, desc, isCredit) =>
                addTransaction(type, amount, desc, isCredit),
              creditBalance,
            );
          }

          return {
            timeLeft: total,
            roundIndex: newRoundIndex,
            history: [result, ...prev.history].slice(0, 50),
            personalBets: newPersonalBet
              ? [newPersonalBet, ...prev.personalBets].slice(0, 50)
              : prev.personalBets,
            pendingBet: null,
            lastResult: result,
            showResult: true,
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isActive,
    mode,
    total,
    addTransaction,
    creditBalance,
    settleRound,
    setState,
  ]);

  // Hide result flash after 3s
  useEffect(() => {
    if (state.showResult) {
      const t = setTimeout(() => {
        setState((prev) => ({ ...prev, showResult: false }));
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [state.showResult, setState]);

  const handlePlaceBet = () => {
    if (!user) {
      toast.error("Please log in to place a bet");
      return;
    }
    if (!selectedBet) {
      toast.error("Please select a bet first");
      return;
    }
    const amount = Number.parseFloat(betAmount) * multiplier;
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bet amount");
      return;
    }
    if (user.balance < amount) {
      toast.error("Insufficient balance");
      return;
    }
    if (state.pendingBet) {
      toast.error("You already have a bet on this round");
      return;
    }
    if (state.timeLeft <= 5) {
      toast.error("Betting closed — wait for next round");
      return;
    }

    setConfirming(true);
    setTimeout(() => {
      // Deduct balance
      deductBalance(amount);
      addTransaction(
        "Casino Loss",
        amount,
        `Win Go: Placed bet on ${currentPeriod}`,
        false,
      );

      const selectionLabel =
        selectedBet.type === "color"
          ? selectedBet.value
          : selectedBet.type === "number"
            ? `#${selectedBet.value}`
            : selectedBet.value === "big"
              ? "Big"
              : "Small";

      const pendingPersonalBet: PersonalBet = {
        period: currentPeriod,
        selection: selectionLabel,
        point: amount,
        result: null,
        status: "Pending",
        profit: 0,
      };

      setState((prev) => ({
        ...prev,
        pendingBet: {
          selection: selectedBet,
          amount,
          multiplier,
          period: currentPeriod,
        },
        personalBets: [pendingPersonalBet, ...prev.personalBets].slice(0, 50),
      }));

      toast.success(`Bet placed! ₹${amount.toFixed(2)} on ${selectionLabel}`);
      setSelectedBet(null);
      setConfirming(false);
    }, 400);
  };

  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  const isBettingClosed = state.timeLeft <= 5;

  return (
    <div className="space-y-4">
      {/* Round info + Timer */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Timer */}
          <div className="flex flex-col items-center gap-2">
            <TimerCircle timeLeft={state.timeLeft} total={total} />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Period
              </p>
              <p className="text-xs font-mono font-bold text-foreground">
                {currentPeriod}
              </p>
            </div>
          </div>

          {/* Last results strip */}
          <div className="flex-1 w-full">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Recent Results
            </p>
            {state.history.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Waiting for first result...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {state.history.slice(0, 12).map((r, i) => (
                  <motion.div
                    key={r.period}
                    initial={i === 0 ? { scale: 0, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex items-center gap-1 bg-secondary border border-border rounded-sm px-2 py-1"
                  >
                    <ColorDot color={r.color} size="sm" />
                    <span className="text-xs font-bold">{r.number}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result flash */}
        <AnimatePresence>
          {state.showResult && state.lastResult && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              className="mt-4 p-3 rounded-sm border flex items-center gap-3"
              style={{
                background: "oklch(0.16 0.015 264)",
                borderColor: "oklch(0.88 0.23 155 / 30%)",
              }}
            >
              <ColorDot color={state.lastResult.color} size="lg" />
              <div>
                <p className="text-sm font-bold text-neon">
                  Round Result: Number {state.lastResult.number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.lastResult.bigSmall} ·{" "}
                  {String(state.lastResult.color).replace("+", " + ")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Betting UI */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-sm">Place Bet</h3>
          {isBettingClosed ? (
            <Badge className="bg-loss/20 text-loss border-loss/30 text-[10px]">
              Betting Closed
            </Badge>
          ) : state.pendingBet ? (
            <Badge className="bg-neon/20 text-neon border-neon/30 text-[10px]">
              Bet Placed ✓
            </Badge>
          ) : (
            <Badge className="bg-secondary border-border text-muted-foreground text-[10px]">
              Open for Bets
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Color buttons */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Color
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["red", "green", "violet"] as BetColor[]).map((color) => {
                const isSelected =
                  selectedBet?.type === "color" && selectedBet.value === color;
                const colorStyles: Record<
                  BetColor,
                  {
                    bg: string;
                    border: string;
                    text: string;
                    glow: string;
                    payout: string;
                  }
                > = {
                  red: {
                    bg: isSelected
                      ? "oklch(0.65 0.22 22 / 20%)"
                      : "oklch(0.65 0.22 22 / 8%)",
                    border: isSelected
                      ? "oklch(0.65 0.22 22)"
                      : "oklch(0.65 0.22 22 / 40%)",
                    text: "oklch(0.75 0.22 22)",
                    glow: isSelected
                      ? "0 0 16px oklch(0.65 0.22 22 / 50%)"
                      : "none",
                    payout: "2x",
                  },
                  green: {
                    bg: isSelected
                      ? "oklch(0.75 0.2 145 / 20%)"
                      : "oklch(0.75 0.2 145 / 8%)",
                    border: isSelected
                      ? "oklch(0.75 0.2 145)"
                      : "oklch(0.75 0.2 145 / 40%)",
                    text: "oklch(0.85 0.2 145)",
                    glow: isSelected
                      ? "0 0 16px oklch(0.75 0.2 145 / 50%)"
                      : "none",
                    payout: "2x",
                  },
                  violet: {
                    bg: isSelected
                      ? "oklch(0.6 0.25 290 / 20%)"
                      : "oklch(0.6 0.25 290 / 8%)",
                    border: isSelected
                      ? "oklch(0.6 0.25 290)"
                      : "oklch(0.6 0.25 290 / 40%)",
                    text: "oklch(0.75 0.22 290)",
                    glow: isSelected
                      ? "0 0 16px oklch(0.6 0.25 290 / 50%)"
                      : "none",
                    payout: "4.5x",
                  },
                };
                const s = colorStyles[color];
                return (
                  <button
                    key={color}
                    type="button"
                    disabled={isBettingClosed || !!state.pendingBet}
                    onClick={() =>
                      setSelectedBet({ type: "color", value: color })
                    }
                    className="py-3 rounded-sm border font-bold text-sm capitalize transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
                    style={{
                      background: s.bg,
                      borderColor: s.border,
                      color: s.text,
                      boxShadow: s.glow,
                    }}
                  >
                    <span className="capitalize">{color}</span>
                    <span className="text-[10px] opacity-70 font-medium">
                      {s.payout}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number buttons */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Number (9x)
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const numColor = getNumberColor(num);
                const primaryColor = getPrimaryColor(numColor);
                const isSelected =
                  selectedBet?.type === "number" && selectedBet.value === num;

                const colorMap: Record<BetColor, string> = {
                  red: "oklch(0.65 0.22 22)",
                  green: "oklch(0.75 0.2 145)",
                  violet: "oklch(0.6 0.25 290)",
                };
                const c = colorMap[primaryColor];

                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isBettingClosed || !!state.pendingBet}
                    onClick={() =>
                      setSelectedBet({ type: "number", value: num })
                    }
                    className="aspect-square rounded-full border font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{
                      background: isSelected ? `${c}33` : `${c}15`,
                      borderColor: isSelected ? c : `${c}66`,
                      color: c,
                      boxShadow: isSelected ? `0 0 10px ${c}55` : "none",
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big / Small */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Big / Small (2x)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["big", "small"] as BetSize[]).map((sz) => {
                const isSelected =
                  selectedBet?.type === "size" && selectedBet.value === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={isBettingClosed || !!state.pendingBet}
                    onClick={() => setSelectedBet({ type: "size", value: sz })}
                    className="py-2.5 rounded-sm border font-bold text-sm capitalize transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: isSelected
                        ? "oklch(0.82 0.2 68 / 20%)"
                        : "oklch(0.82 0.2 68 / 8%)",
                      borderColor: isSelected
                        ? "oklch(0.82 0.2 68)"
                        : "oklch(0.82 0.2 68 / 40%)",
                      color: "oklch(0.88 0.18 68)",
                      boxShadow: isSelected
                        ? "0 0 12px oklch(0.82 0.2 68 / 40%)"
                        : "none",
                    }}
                  >
                    {sz === "big" ? "🔴 Big (5–9)" : "🟢 Small (0–4)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bet amount */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Bet Amount
            </p>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {[10, 50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBetAmount(String(preset))}
                  className={`px-3 py-1.5 text-xs font-bold border rounded-sm transition-all ${
                    betAmount === String(preset)
                      ? "border-neon bg-neon/10 text-neon"
                      : "border-border bg-secondary text-muted-foreground hover:border-neon/50"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="pl-7 bg-secondary border-border rounded-sm"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {/* Quantity multiplier */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
              Quantity
            </p>
            <div className="flex gap-1.5">
              {[1, 5, 10, 20].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setMultiplier(q)}
                  className={`flex-1 py-1.5 text-xs font-bold border rounded-sm transition-all ${
                    multiplier === q
                      ? "border-purple bg-purple/10 text-purple"
                      : "border-border bg-secondary text-muted-foreground hover:border-purple/50"
                  }`}
                >
                  ×{q}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedBet && user && (
            <div className="p-3 bg-secondary rounded-sm border border-border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bet:</span>
                <span className="font-bold text-gold">
                  {fmt(Number.parseFloat(betAmount || "0") * multiplier)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance After:</span>
                <span className="font-bold">
                  {fmt(
                    user.balance -
                      Number.parseFloat(betAmount || "0") * multiplier,
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Confirm button */}
          {user ? (
            <Button
              onClick={handlePlaceBet}
              disabled={
                !selectedBet ||
                confirming ||
                isBettingClosed ||
                !!state.pendingBet
              }
              className="w-full h-11 font-bold rounded-sm text-sm"
              style={{
                background: "oklch(0.6 0.25 290)",
                color: "white",
                opacity:
                  !selectedBet || isBettingClosed || !!state.pendingBet
                    ? 0.5
                    : 1,
              }}
            >
              {confirming
                ? "Placing..."
                : state.pendingBet
                  ? `Bet on ${state.pendingBet.selection.type === "color" ? state.pendingBet.selection.value : state.pendingBet.selection.type === "number" ? `#${state.pendingBet.selection.value}` : state.pendingBet.selection.value === "big" ? "Big" : "Small"} ✓`
                  : isBettingClosed
                    ? "⏳ Betting Closed"
                    : selectedBet
                      ? "Confirm Bet"
                      : "Select a bet first"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-sm"
              onClick={() => toast.error("Please log in to place a bet")}
            >
              Log in to play
            </Button>
          )}
        </div>
      </div>

      {/* History Tabs */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Tabs defaultValue="all">
          <div className="px-4 pt-3">
            <TabsList className="bg-secondary h-8">
              <TabsTrigger value="all" className="text-xs h-6">
                All Orders
              </TabsTrigger>
              <TabsTrigger value="my" className="text-xs h-6">
                My Orders
              </TabsTrigger>
            </TabsList>
          </div>

          {/* All Orders */}
          <TabsContent value="all" className="mt-0">
            {state.history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No results yet — first round in progress
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2">
                        Period
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2 text-center">
                        Number
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2 text-center">
                        Big/Small
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2 text-center">
                        Color
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.history.slice(0, 20).map((r) => (
                      <TableRow
                        key={r.period}
                        className="border-border hover:bg-secondary/50"
                      >
                        <TableCell className="text-[11px] font-mono py-2 text-muted-foreground">
                          {r.period}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span
                            className="font-black text-sm"
                            style={{
                              color:
                                r.color === "red" || r.color === "violet+red"
                                  ? "oklch(0.75 0.22 22)"
                                  : r.color === "green" ||
                                      r.color === "violet+green"
                                    ? "oklch(0.85 0.2 145)"
                                    : "oklch(0.75 0.22 290)",
                            }}
                          >
                            {r.number}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${
                              r.bigSmall === "Big"
                                ? "bg-orange-500/15 text-orange-400"
                                : "bg-sky-500/15 text-sky-400"
                            }`}
                          >
                            {r.bigSmall}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex items-center justify-center">
                            <ColorDot color={r.color} size="sm" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* My Orders */}
          <TabsContent value="my" className="mt-0">
            {!user ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Log in to see your bet history
              </p>
            ) : state.personalBets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No bets placed yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2">
                        Period
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2">
                        Select
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2 text-right">
                        Point
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2 text-center">
                        Result
                      </TableHead>
                      <TableHead className="text-[11px] text-muted-foreground font-medium py-2 text-right">
                        Profit
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.personalBets.slice(0, 20).map((b, i) => (
                      <TableRow
                        key={`${b.period}-${i}`}
                        className="border-border hover:bg-secondary/50"
                      >
                        <TableCell className="text-[11px] font-mono py-2 text-muted-foreground">
                          {b.period}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-[11px] font-bold capitalize">
                            {b.selection}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <span className="text-[11px] font-bold text-gold">
                            ₹{b.point.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {b.result ? (
                            <div className="flex items-center justify-center gap-1">
                              <ColorDot color={b.result.color} size="sm" />
                              <span className="text-[11px] font-bold">
                                {b.result.number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          {b.status === "Pending" ? (
                            <span className="text-[10px] text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <span
                              className={`text-[11px] font-bold ${b.profit > 0 ? "text-neon" : "text-loss"}`}
                            >
                              {b.profit > 0 ? "+" : ""}₹
                              {Math.abs(b.profit).toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ================================================================
// MAIN EXPORT
// ================================================================

export function ColorPredictionGame() {
  const [activeMode, setActiveMode] = useState<GameMode>("1min");

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="flex">
          {(["1min", "3min", "5min"] as GameMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(mode)}
              className="flex-1 py-3 text-sm font-bold transition-all border-b-2 relative"
              style={{
                borderBottomColor:
                  activeMode === mode ? "oklch(0.6 0.25 290)" : "transparent",
                background:
                  activeMode === mode
                    ? "oklch(0.6 0.25 290 / 10%)"
                    : "transparent",
                color:
                  activeMode === mode
                    ? "oklch(0.75 0.22 290)"
                    : "oklch(0.55 0.01 264)",
              }}
            >
              {GAME_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Active mode panel — always render all, but only the active one ticks */}
      {(["1min", "3min", "5min"] as GameMode[]).map((mode) => (
        <div
          key={mode}
          style={{ display: activeMode === mode ? "block" : "none" }}
        >
          <GameModePanel mode={mode} isActive={activeMode === mode} />
        </div>
      ))}
    </div>
  );
}
