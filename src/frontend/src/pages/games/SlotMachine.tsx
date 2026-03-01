import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

const SYMBOLS = ["7️⃣", "💎", "🍒", "🔔", "🍋", "⭐", "🎰", "🍊"];

const PAYOUTS: Record<string, number> = {
  "7️⃣": 50,
  "💎": 20,
  "🍒": 10,
  "🔔": 8,
  "🍋": 5,
  "⭐": 5,
  "🎰": 5,
  "🍊": 5,
};

// 2-of-a-kind payouts
const TWO_PAYOUTS: Record<string, number> = {
  "7️⃣": 3,
  "💎": 2,
};

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function calcPayout(reels: string[]): { mult: number; label: string } {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    const mult = PAYOUTS[a] ?? 5;
    return { mult, label: `3x ${a} — ${mult}x payout!` };
  }
  // Two of a kind checks
  for (const [sym, mult] of Object.entries(TWO_PAYOUTS)) {
    const count = reels.filter((r) => r === sym).length;
    if (count >= 2) {
      return { mult, label: `2x ${sym} — ${mult}x payout!` };
    }
  }
  return { mult: 0, label: "No win — try again!" };
}

const BET_PRESETS = [1, 5, 10, 25];

export function SlotMachine() {
  const { user, deposit, withdraw, addTransaction, setCurrentPage } =
    useBetting();

  const [betAmount, setBetAmount] = useState("5");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ mult: number; label: string } | null>(
    null,
  );
  const [jackpot, setJackpot] = useState(false);

  // Each reel has a visible window of 3 symbols (top, center/payline, bottom)
  const [reelWindows, setReelWindows] = useState<[string, string, string][]>([
    ["🍊", "🍒", "⭐"],
    ["🍋", "🔔", "💎"],
    ["🎰", "🍋", "7️⃣"],
  ]);

  const intervalRefs = useRef<(ReturnType<typeof setInterval> | null)[]>([
    null,
    null,
    null,
  ]);

  const spin = useCallback(() => {
    if (!user) {
      toast.error("Log in to play");
      return;
    }
    const amount = Number.parseFloat(betAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bet amount");
      return;
    }
    if (user.balance < amount) {
      toast.error("Insufficient balance");
      return;
    }
    if (!withdraw(amount)) return;

    setSpinning(true);
    setResult(null);
    setJackpot(false);

    // Animate all reels spinning
    const stopTimes = [800, 1200, 1600];
    const finalSymbols = [
      getRandomSymbol(),
      getRandomSymbol(),
      getRandomSymbol(),
    ];

    // Spin each reel independently
    const reelResults: string[] = [];
    const newWindows: [string, string, string][] = [
      ["🍊", "🍒", "⭐"],
      ["🍋", "🔔", "💎"],
      ["🎰", "🍋", "7️⃣"],
    ];

    for (let r = 0; r < 3; r++) {
      const rIndex = r;
      intervalRefs.current[rIndex] = setInterval(() => {
        const top = getRandomSymbol();
        const center = getRandomSymbol();
        const bottom = getRandomSymbol();
        setReelWindows((prev) => {
          const updated = [...prev] as [string, string, string][];
          updated[rIndex] = [top, center, bottom];
          return updated;
        });
      }, 80);

      setTimeout(() => {
        if (intervalRefs.current[rIndex]) {
          clearInterval(intervalRefs.current[rIndex]!);
          intervalRefs.current[rIndex] = null;
        }
        const sym = finalSymbols[rIndex];
        reelResults[rIndex] = sym;
        const win = [getRandomSymbol(), sym, getRandomSymbol()];
        newWindows[rIndex] = win as [string, string, string];
        setReelWindows((prev) => {
          const updated = [...prev] as [string, string, string][];
          updated[rIndex] = win as [string, string, string];
          return updated;
        });

        if (rIndex === 2) {
          // All reels stopped
          setTimeout(() => {
            const { mult, label } = calcPayout(finalSymbols);

            if (mult > 0) {
              const winAmount = Number.parseFloat((amount * mult).toFixed(2));
              deposit(winAmount);
              addTransaction("Casino Win", winAmount, `Slots — ${label}`, true);
              toast.success(`🎰 ${label} Won $${winAmount.toFixed(2)}!`);
              if (finalSymbols.every((s) => s === "7️⃣")) {
                setJackpot(true);
                setTimeout(() => setJackpot(false), 3000);
              }
            } else {
              addTransaction("Casino Loss", amount, "Slots — No win", false);
              toast.error("No win. Spin again!");
            }

            setResult({ mult, label });
            setSpinning(false);
          }, 100);
        }
      }, stopTimes[r]);
    }
  }, [user, betAmount, withdraw, deposit, addTransaction]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">🎰 Slot Machine</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            3 reels · Triple 7s = 50x jackpot
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* JACKPOT overlay */}
        <AnimatePresence>
          {jackpot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-sm pointer-events-none"
            >
              <div className="text-center">
                <motion.p
                  animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] }}
                  transition={{ repeat: 5, duration: 0.4 }}
                  className="font-display font-black text-5xl text-gold"
                  style={{ textShadow: "0 0 30px oklch(0.82 0.2 68 / 80%)" }}
                >
                  🏆 JACKPOT!
                </motion.p>
                <p className="text-neon text-xl font-bold mt-2">50x WIN!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slot display */}
        <div className="relative flex justify-center gap-2 mb-5">
          {/* Payline indicator */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gold/30 pointer-events-none" />
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />

          {reelWindows.map((window, rIdx) => (
            <div
              key={["reel-left", "reel-center", "reel-right"][rIdx]}
              className={`flex-1 border-2 rounded-sm overflow-hidden ${
                result && result.mult > 0 ? "border-neon" : "border-border"
              }`}
              style={{
                background: "oklch(0.10 0.01 264)",
              }}
            >
              <motion.div
                animate={
                  spinning && !intervalRefs.current[rIdx] === false
                    ? { y: [0, -10, 0] }
                    : {}
                }
              >
                {window.map((sym, sIdx) => (
                  <div
                    key={`${["top", "mid", "bot"][sIdx]}-${window[0]}-${sIdx}`}
                    className={`flex items-center justify-center text-3xl h-16 ${
                      sIdx === 1 ? "bg-secondary/50" : "opacity-50"
                    }`}
                  >
                    {sym}
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && !spinning && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 p-3 rounded-sm ${
                result.mult > 0
                  ? "bg-neon/10 border border-neon/20"
                  : "bg-loss/10 border border-loss/20"
              }`}
            >
              <p
                className={`font-bold text-sm ${result.mult > 0 ? "text-neon" : "text-loss"}`}
              >
                {result.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet presets */}
        <div className="flex gap-2 mb-3">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBetAmount(String(p))}
              disabled={spinning}
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
            disabled={spinning}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {/* Payout reference */}
        <div className="grid grid-cols-4 gap-1 mb-4 text-xs">
          {Object.entries(PAYOUTS)
            .slice(0, 4)
            .map(([sym, mult]) => (
              <div
                key={sym}
                className="text-center p-1.5 bg-secondary/50 rounded-sm"
              >
                <div className="text-base">{sym}</div>
                <div className="text-gold font-bold">{mult}x</div>
              </div>
            ))}
        </div>

        {user ? (
          <Button
            onClick={spin}
            disabled={spinning}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
          >
            {spinning ? "🎰 Spinning..." : "🎰 Spin!"}
          </Button>
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
