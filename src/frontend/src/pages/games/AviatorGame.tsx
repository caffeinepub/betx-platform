import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

const BET_PRESETS = [5, 10, 25, 50];

const STAR_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
  id: `star-pos-${(i * 37 + 11) % 100}-${(i * 23 + 7) % 60}`,
  x: (i * 37 + 11) % 100,
  y: (i * 23 + 7) % 60,
}));

type GamePhase = "idle" | "flying" | "crashed" | "cashedout";

interface RoundResult {
  id: string;
  crash: number;
  won: boolean;
  cashout?: number;
}

function getMultiplierColor(mult: number) {
  if (mult < 1.5) return "text-loss";
  if (mult < 3) return "text-gold";
  return "text-neon";
}

export function AviatorGame() {
  const {
    user,
    deposit,
    withdraw,
    addTransaction,
    setCurrentPage,
    gameSettings,
  } = useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashRef = useRef<number>(0);
  const betRef = useRef<number>(0);
  const phaseRef = useRef<GamePhase>("idle");

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startGame = useCallback(() => {
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

    if (!withdraw(amount)) {
      toast.error("Could not place bet");
      return;
    }
    addTransaction("Casino Loss", amount, "Aviator — Bet placed", false);

    // Calculate crash point: use forced value from admin or weighted random
    const forced = gameSettings?.aviator?.forcedCrashPoint;
    const crash =
      forced && forced > 1
        ? forced
        : Math.max(1.1, Math.random() * Math.random() * 20 + 1);
    crashRef.current = crash;
    betRef.current = amount;

    const newPhase: GamePhase = "flying";
    setPhase(newPhase);
    phaseRef.current = newPhase;
    setMultiplier(1.0);
    setCrashPoint(0);
    setCashedOutAt(null);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newMult = Math.max(1.0, 1 + 0.08 * elapsed ** 1.4);
      setMultiplier(Number.parseFloat(newMult.toFixed(2)));

      if (newMult >= crashRef.current) {
        clearTimer();
        setCrashPoint(Number.parseFloat(crashRef.current.toFixed(2)));
        setPhase("crashed");
        phaseRef.current = "crashed";
        setMultiplier(Number.parseFloat(crashRef.current.toFixed(2)));

        setHistory((prev) => [
          {
            id: `round-${Date.now()}`,
            crash: Number.parseFloat(crashRef.current.toFixed(2)),
            won: false,
          },
          ...prev.slice(0, 9),
        ]);

        addTransaction(
          "Casino Loss",
          betRef.current,
          `Aviator — Crashed @ ${crashRef.current.toFixed(2)}x`,
          false,
        );

        toast.error(`💥 Crashed at ${crashRef.current.toFixed(2)}x!`);
      }
    }, 50);
  }, [user, betAmount, withdraw, addTransaction, clearTimer, gameSettings]);

  const cashOut = useCallback(() => {
    if (phaseRef.current !== "flying") return;
    clearTimer();

    const mult = multiplier;
    const amount = betRef.current;
    const winAmount = Number.parseFloat((amount * mult).toFixed(2));

    deposit(winAmount);
    addTransaction(
      "Casino Win",
      winAmount,
      `Aviator — Cashed out @ ${mult.toFixed(2)}x`,
      true,
    );

    setCashedOutAt(mult);
    setPhase("cashedout");
    phaseRef.current = "cashedout";
    setHistory((prev) => [
      {
        id: `round-${Date.now()}`,
        crash: Number.parseFloat(crashRef.current.toFixed(2)),
        won: true,
        cashout: mult,
      },
      ...prev.slice(0, 9),
    ]);

    toast.success(
      `🚀 Cashed out @ ${mult.toFixed(2)}x! Won $${winAmount.toFixed(2)}`,
    );
  }, [multiplier, deposit, addTransaction, clearTimer]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const potentialWin = Number.parseFloat(betAmount || "0") * multiplier;

  if (gameSettings?.aviator?.enabled === false) {
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
          <h2 className="font-display font-bold text-lg">✈️ Aviator</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cash out before the plane crashes!
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      {/* History badges */}
      <div className="px-5 pt-3 flex gap-1.5 flex-wrap">
        {history.length === 0 ? (
          <span className="text-xs text-muted-foreground">No rounds yet</span>
        ) : (
          history.map((r) => (
            <span
              key={r.id}
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                r.won
                  ? "border-neon/40 text-neon bg-neon/10"
                  : r.crash < 1.5
                    ? "border-loss/40 text-loss bg-loss/10"
                    : "border-gold/40 text-gold bg-gold/10"
              }`}
            >
              {r.won && r.cashout
                ? `↑${r.cashout.toFixed(2)}x`
                : `${r.crash.toFixed(2)}x`}
            </span>
          ))
        )}
      </div>

      {/* Plane & Multiplier display */}
      <div className="mx-5 mt-4 mb-4 relative h-48 bg-secondary/40 rounded-sm border border-border overflow-hidden">
        {/* Sky gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.08 0.02 240) 0%, oklch(0.14 0.015 240) 100%)",
          }}
        />
        {/* Stars */}
        {STAR_POSITIONS.map((s) => (
          <div
            key={s.id}
            className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          />
        ))}

        {/* Curve path indicator */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Flight path trail"
        >
          <defs>
            <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor="oklch(0.88 0.23 155)"
                stopOpacity="0"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.88 0.23 155)"
                stopOpacity="0.5"
              />
            </linearGradient>
          </defs>
          {phase === "flying" && (
            <path
              d="M 0,190 Q 80,150 160,100 T 320,40"
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Plane */}
        <AnimatePresence>
          {(phase === "flying" || phase === "cashedout") && (
            <motion.div
              key="plane"
              initial={{ x: 0, y: 170, opacity: 0 }}
              animate={
                phase === "flying"
                  ? {
                      x: [0, 60, 130, 200, 260],
                      y: [170, 130, 90, 50, 20],
                      opacity: 1,
                    }
                  : { x: 320, y: -20, opacity: 0 }
              }
              transition={
                phase === "flying"
                  ? { duration: 30, ease: "linear" }
                  : { duration: 0.5, ease: "easeOut" }
              }
              className="absolute text-3xl"
              style={{
                filter: "drop-shadow(0 0 8px oklch(0.88 0.23 155 / 60%))",
              }}
            >
              ✈️
            </motion.div>
          )}
          {phase === "crashed" && (
            <motion.div
              key="crash"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl"
            >
              💥
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multiplier center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={phase}
            animate={
              phase === "flying"
                ? {
                    scale: [1, 1.05, 1],
                    transition: {
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 0.5,
                    },
                  }
                : {}
            }
            className={`font-display font-black text-5xl tabular-nums ${
              phase === "crashed"
                ? "text-loss"
                : phase === "cashedout"
                  ? "text-neon"
                  : getMultiplierColor(multiplier)
            }`}
            style={{
              textShadow:
                phase === "crashed"
                  ? "0 0 20px oklch(0.65 0.22 22 / 60%)"
                  : phase === "flying"
                    ? "0 0 20px oklch(0.88 0.23 155 / 40%)"
                    : "none",
            }}
          >
            {phase === "crashed"
              ? `${crashPoint}x`
              : `${multiplier.toFixed(2)}x`}
          </motion.div>
          {phase === "crashed" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-loss text-sm font-bold mt-1"
            >
              CRASHED!
            </motion.p>
          )}
          {phase === "cashedout" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-neon text-sm font-bold mt-1"
            >
              CASHED OUT @ {cashedOutAt?.toFixed(2)}x
            </motion.p>
          )}
          {phase === "flying" && (
            <p className="text-xs text-muted-foreground mt-1">
              Potential win:{" "}
              <span className="text-neon font-bold">{fmt(potentialWin)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-5 pt-0 space-y-3">
        <div className="flex gap-2">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBetAmount(String(p))}
              disabled={phase === "flying"}
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

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={phase === "flying"}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {user ? (
          phase === "flying" ? (
            <Button
              onClick={cashOut}
              className="w-full bg-neon/10 border border-neon text-neon hover:bg-neon/20 font-black rounded-sm h-12 text-base glow-neon"
            >
              💰 Cash Out @ {multiplier.toFixed(2)}x
            </Button>
          ) : (
            <Button
              onClick={startGame}
              className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
            >
              {phase === "idle"
                ? "🚀 Bet & Fly"
                : phase === "crashed"
                  ? "🔄 Play Again"
                  : "🎉 Play Again"}
            </Button>
          )
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
