import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

// European roulette: 0-36
// Red numbers
const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getNumberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

interface BetOption {
  id: string;
  label: string;
  emoji: string;
  payout: number;
  check: (n: number) => boolean;
}

const BET_OPTIONS: BetOption[] = [
  {
    id: "red",
    label: "Red",
    emoji: "🔴",
    payout: 2,
    check: (n) => n !== 0 && RED_NUMBERS.has(n),
  },
  {
    id: "black",
    label: "Black",
    emoji: "⚫",
    payout: 2,
    check: (n) => n !== 0 && !RED_NUMBERS.has(n),
  },
  {
    id: "green",
    label: "Green (0)",
    emoji: "🟢",
    payout: 35,
    check: (n) => n === 0,
  },
  {
    id: "odd",
    label: "Odd",
    emoji: "🔢",
    payout: 2,
    check: (n) => n !== 0 && n % 2 !== 0,
  },
  {
    id: "even",
    label: "Even",
    emoji: "🔢",
    payout: 2,
    check: (n) => n !== 0 && n % 2 === 0,
  },
  {
    id: "low",
    label: "1–18",
    emoji: "⬇️",
    payout: 2,
    check: (n) => n >= 1 && n <= 18,
  },
  {
    id: "high",
    label: "19–36",
    emoji: "⬆️",
    payout: 2,
    check: (n) => n >= 19 && n <= 36,
  },
];

interface PlacedChip {
  betId: string;
  amount: number;
}

type RoulettePhase = "betting" | "spinning" | "result";

const BET_PRESETS = [5, 10, 25, 50];

// Wheel segment colors for display (simplified ring)
const WHEEL_SEGMENTS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export function RouletteGame() {
  const {
    user,
    deposit,
    withdraw,
    addTransaction,
    setCurrentPage,
    gameSettings,
  } = useBetting();

  const [chips, setChips] = useState<PlacedChip[]>([]);
  const [betAmount, setBetAmount] = useState("10");
  const [phase, setPhase] = useState<RoulettePhase>("betting");
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [history, setHistory] = useState<{ id: string; n: number }[]>([]);

  const toggleChip = (betId: string) => {
    if (phase !== "betting") return;
    const amount = Number.parseFloat(betAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid chip amount");
      return;
    }

    setChips((prev) => {
      const existing = prev.find((c) => c.betId === betId);
      if (existing) {
        return prev.filter((c) => c.betId !== betId);
      }
      return [...prev, { betId, amount }];
    });
  };

  const totalBet = chips.reduce((sum, c) => sum + c.amount, 0);

  const spin = useCallback(() => {
    if (!user) {
      toast.error("Log in to play");
      return;
    }
    if (chips.length === 0) {
      toast.error("Place at least one chip");
      return;
    }
    if (user.balance < totalBet) {
      toast.error("Insufficient balance");
      return;
    }
    if (!withdraw(totalBet)) return;
    addTransaction("Casino Loss", totalBet, "Roulette — Bets placed", false);

    // Random result
    const result = Math.floor(Math.random() * 37);
    const segmentIndex = WHEEL_SEGMENTS.indexOf(result);
    const targetAngle = spinAngle + 720 + (segmentIndex / 37) * 360;

    setPhase("spinning");
    setSpinAngle(targetAngle);

    setTimeout(() => {
      setResultNumber(result);
      setHistory((prev) => [
        { id: `spin-${Date.now()}`, n: result },
        ...prev.slice(0, 9),
      ]);

      // Calculate winnings
      let totalWin = 0;
      const winningBets: string[] = [];

      for (const chip of chips) {
        const betOption = BET_OPTIONS.find((b) => b.id === chip.betId);
        if (betOption?.check(result)) {
          totalWin += chip.amount * betOption.payout;
          winningBets.push(betOption.label);
        }
      }

      if (totalWin > 0) {
        deposit(totalWin);
        addTransaction(
          "Casino Win",
          totalWin,
          `Roulette — Won on ${winningBets.join(", ")} (${result})`,
          true,
        );
        toast.success(
          `🎡 ${result}! Won on ${winningBets.join(", ")}! +$${totalWin.toFixed(2)}`,
        );
      } else {
        toast.error(`🎡 ${result} — No win this spin.`);
      }

      setPhase("result");
    }, 2500);
  }, [user, chips, totalBet, spinAngle, withdraw, deposit, addTransaction]);

  const resetBets = () => {
    setChips([]);
    setPhase("betting");
    setResultNumber(null);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const resultColor =
    resultNumber !== null ? getNumberColor(resultNumber) : null;

  if (gameSettings?.roulette?.enabled === false) {
    return (
      <div className="bg-card border border-border rounded-sm flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">🔒</div>
        <h3 className="font-display font-bold text-lg">
          Game Temporarily Unavailable
        </h3>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          This game has been paused by the admin. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">🎡 Roulette</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            European · 0–36 · Red/Black pays 2x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* History */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {history.length === 0 ? (
            <span className="text-xs text-muted-foreground">No rounds yet</span>
          ) : (
            history.map((entry) => {
              const color = getNumberColor(entry.n);
              return (
                <span
                  key={entry.id}
                  className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center ${
                    color === "green"
                      ? "bg-neon/20 text-neon border border-neon/30"
                      : color === "red"
                        ? "bg-loss/20 text-loss border border-loss/30"
                        : "bg-secondary text-foreground border border-border"
                  }`}
                >
                  {entry.n}
                </span>
              );
            })
          )}
        </div>

        {/* Wheel display */}
        <div className="flex justify-center mb-5">
          <div className="relative w-36 h-36">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: spinAngle }}
              transition={
                phase === "spinning"
                  ? { duration: 2.5, ease: [0.2, 0, 0.1, 1] }
                  : { duration: 0 }
              }
              className="w-36 h-36 rounded-full border-4 border-gold/40 overflow-hidden"
              style={{
                background: `conic-gradient(${WHEEL_SEGMENTS.map((n, i) => {
                  const color =
                    n === 0
                      ? "oklch(0.65 0.2 145)"
                      : RED_NUMBERS.has(n)
                        ? "oklch(0.55 0.22 22)"
                        : "oklch(0.15 0.01 264)";
                  const pct = (i / WHEEL_SEGMENTS.length) * 100;
                  const nextPct = ((i + 1) / WHEEL_SEGMENTS.length) * 100;
                  return `${color} ${pct}% ${nextPct}%`;
                }).join(", ")})`,
              }}
            >
              {/* Center */}
              <div className="absolute inset-4 rounded-full bg-card border border-border flex items-center justify-center">
                <AnimatePresence>
                  {resultNumber !== null ? (
                    <motion.span
                      key={resultNumber}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`font-display font-black text-2xl ${
                        resultColor === "green"
                          ? "text-neon"
                          : resultColor === "red"
                            ? "text-loss"
                            : "text-foreground"
                      }`}
                    >
                      {resultNumber}
                    </motion.span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Spin!</span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Ball indicator */}
            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-lg" />
          </div>
        </div>

        {/* Result overlay */}
        <AnimatePresence>
          {phase === "result" && resultNumber !== null && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 p-3 rounded-sm border ${
                resultColor === "green"
                  ? "bg-neon/10 border-neon/20"
                  : resultColor === "red"
                    ? "bg-loss/10 border-loss/20"
                    : "bg-secondary border-border"
              }`}
            >
              <p className="font-display font-bold text-lg">
                <span
                  className={
                    resultColor === "green"
                      ? "text-neon"
                      : resultColor === "red"
                        ? "text-loss"
                        : "text-foreground"
                  }
                >
                  {resultColor === "green"
                    ? "🟢"
                    : resultColor === "red"
                      ? "🔴"
                      : "⚫"}{" "}
                  {resultNumber}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chip amount */}
        <div className="flex gap-2 mb-3">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBetAmount(String(p))}
              disabled={phase === "spinning"}
              className={`flex-1 py-1.5 text-xs font-bold border rounded-sm transition-all disabled:opacity-40 ${
                betAmount === String(p)
                  ? "border-neon bg-neon/10 text-neon"
                  : "border-border bg-secondary text-muted-foreground hover:border-neon/50"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={phase === "spinning"}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Chip amount"
          />
        </div>

        {/* Betting zones */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {BET_OPTIONS.map((opt) => {
            const placed = chips.find((c) => c.betId === opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleChip(opt.id)}
                disabled={phase === "spinning"}
                className={`p-2 text-center rounded-sm border transition-all text-xs font-bold disabled:opacity-40 ${
                  placed
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-border bg-secondary text-muted-foreground hover:border-gold/50"
                }`}
              >
                <div className="text-base">{opt.emoji}</div>
                <div>{opt.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {opt.payout}x
                </div>
                {placed && (
                  <div className="text-[10px] text-gold font-black">
                    ${placed.amount}
                  </div>
                )}
              </button>
            );
          })}
          {/* Spacer */}
          <div />
        </div>

        {totalBet > 0 && (
          <p className="text-xs text-muted-foreground text-center mb-3">
            Total bet:{" "}
            <span className="text-gold font-bold">{fmt(totalBet)}</span>
          </p>
        )}

        {user ? (
          <div className="space-y-2">
            {phase === "result" ? (
              <Button
                onClick={resetBets}
                className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
              >
                🔄 New Round
              </Button>
            ) : (
              <Button
                onClick={spin}
                disabled={phase === "spinning" || chips.length === 0}
                className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11 disabled:opacity-50"
              >
                {phase === "spinning" ? "🎡 Spinning..." : "🎡 Spin Wheel"}
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={() => setCurrentPage("home")}
            variant="outline"
            className="w-full rounded-sm"
          >
            Log in to play
          </Button>
        )}
      </div>
    </div>
  );
}
