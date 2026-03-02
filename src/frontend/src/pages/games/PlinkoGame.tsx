import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

type RiskLevel = "Low" | "Medium" | "High";

const MULTIPLIERS: Record<RiskLevel, number[]> = {
  Low: [0.5, 1, 1.5, 2, 3, 2, 1.5, 1, 0.5],
  Medium: [0.3, 0.5, 1, 2, 5, 2, 1, 0.5, 0.3],
  High: [0.1, 0.3, 0.5, 1, 10, 1, 0.5, 0.3, 0.1],
};

function getBucketColor(mult: number): string {
  if (mult >= 5) return "border-neon text-neon bg-neon/15";
  if (mult >= 2) return "border-gold text-gold bg-gold/15";
  if (mult >= 1) return "border-foreground/40 text-foreground bg-secondary";
  return "border-loss/40 text-loss bg-loss/10";
}

const ROWS = 8;
const BUCKETS = 9;

// Generate peg positions for display
function getPegPositions() {
  const pegs: { row: number; col: number; x: number; y: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    const pegsInRow = row + 2;
    for (let col = 0; col < pegsInRow; col++) {
      const totalWidth = 100;
      const spacing = totalWidth / (pegsInRow + 1);
      const x = spacing * (col + 1);
      const y = ((row + 1) / (ROWS + 2)) * 100;
      pegs.push({ row, col, x, y });
    }
  }
  return pegs;
}

const PEG_POSITIONS = getPegPositions();

interface BallPath {
  positions: { x: number; y: number }[];
  bucketIndex: number;
}

function generateBallPath(riskLevel: RiskLevel): BallPath {
  const positions: { x: number; y: number }[] = [];
  let x = 50; // Start center
  const startY = 0;

  positions.push({ x, y: startY });

  // Bounce through each row
  for (let row = 0; row < ROWS; row++) {
    const pegsInRow = row + 2;
    const totalWidth = 100;
    const spacing = totalWidth / (pegsInRow + 1);
    const rowY = ((row + 1) / (ROWS + 2)) * 100;

    // Move left or right
    const direction = Math.random() < 0.5 ? -1 : 1;
    x = Math.max(5, Math.min(95, x + direction * (spacing * 0.5)));
    positions.push({ x, y: rowY });
  }

  // Determine bucket based on final x position
  const bucketIndex = Math.min(BUCKETS - 1, Math.floor((x / 100) * BUCKETS));

  // Final position at bucket
  const bucketY = 92;
  const bucketX = ((bucketIndex + 0.5) / BUCKETS) * 100;
  positions.push({ x: bucketX, y: bucketY });

  // Bias toward center for Low risk
  if (riskLevel === "Low") {
    const centerBias = Math.floor(BUCKETS / 2);
    const biasedBucket = Math.round(bucketIndex * 0.6 + centerBias * 0.4);
    return {
      positions,
      bucketIndex: Math.min(BUCKETS - 1, Math.max(0, biasedBucket)),
    };
  }

  return { positions, bucketIndex };
}

type GameState = "idle" | "dropping" | "landed";

const BET_PRESETS = [5, 10, 25, 50];

export function PlinkoGame() {
  const {
    user,
    deposit,
    withdraw,
    addTransaction,
    setCurrentPage,
    gameSettings,
  } = useBetting();

  const [betAmount, setBetAmount] = useState("10");
  const [risk, setRisk] = useState<RiskLevel>("Medium");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [ballPath, setBallPath] = useState<BallPath | null>(null);
  const [ballStep, setBallStep] = useState(0);
  const [result, setResult] = useState<{ mult: number; win: number } | null>(
    null,
  );
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  const dropBall = useCallback(() => {
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
    addTransaction("Casino Loss", amount, `Plinko — ${risk} risk`, false);

    clearTimeouts();

    const path = generateBallPath(risk);
    setBallPath(path);
    setBallStep(0);
    setActiveBucket(null);
    setResult(null);
    setGameState("dropping");

    // Animate ball step by step
    path.positions.forEach((_, stepIdx) => {
      const timeout = setTimeout(() => {
        setBallStep(stepIdx);

        if (stepIdx === path.positions.length - 1) {
          // Ball landed
          const mult = MULTIPLIERS[risk][path.bucketIndex];
          const winAmount = Number.parseFloat((amount * mult).toFixed(2));

          setActiveBucket(path.bucketIndex);
          setGameState("landed");
          setResult({ mult, win: winAmount });

          if (mult > 0) {
            deposit(winAmount);
            addTransaction(
              winAmount > amount ? "Casino Win" : "Casino Loss",
              winAmount,
              `Plinko — ${mult}x (${risk} risk)`,
              true,
            );

            if (mult >= 5) {
              toast.success(`🎯 ${mult}x! HUGE WIN! +$${winAmount.toFixed(2)}`);
            } else if (mult >= 1) {
              toast.success(`🎯 ${mult}x! Won $${winAmount.toFixed(2)}`);
            } else {
              toast.error(`🎯 ${mult}x — $${winAmount.toFixed(2)} back`);
            }
          }
        }
      }, stepIdx * 200);
      timeoutsRef.current.push(timeout);
    });
  }, [user, betAmount, risk, withdraw, deposit, addTransaction, clearTimeouts]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const mults = MULTIPLIERS[risk];
  const currentBallPos =
    ballPath && ballStep < ballPath.positions.length
      ? ballPath.positions[ballStep]
      : null;

  if (gameSettings?.plinko?.enabled === false) {
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
          <h2 className="font-display font-bold text-lg">🎯 Plinko</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drop the ball · Land in a multiplier bucket
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Board */}
        <div
          className="relative w-full mb-4 rounded-sm border border-border overflow-hidden"
          style={{
            height: "260px",
            background:
              "linear-gradient(180deg, oklch(0.10 0.01 264) 0%, oklch(0.13 0.015 264) 100%)",
          }}
        >
          {/* Pegs */}
          {PEG_POSITIONS.map((peg) => (
            <div
              key={`peg-${peg.row}-${peg.col}`}
              className="absolute w-2 h-2 rounded-full bg-secondary border border-border/60"
              style={{
                left: `${peg.x}%`,
                top: `${peg.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Ball */}
          <AnimatePresence>
            {currentBallPos && gameState === "dropping" && (
              <motion.div
                key={ballStep}
                initial={false}
                animate={{
                  left: `${currentBallPos.x}%`,
                  top: `${currentBallPos.y}%`,
                }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="absolute w-4 h-4 rounded-full bg-gold border-2 border-gold/60"
                style={{
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 8px oklch(0.82 0.2 68 / 60%)",
                  zIndex: 10,
                }}
              />
            )}
          </AnimatePresence>

          {/* Buckets at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 flex"
            style={{ height: "36px" }}
          >
            {mults.map((mult, i) => (
              <motion.div
                key={`bucket-${risk}-pos${i}-val${mult}`}
                animate={
                  activeBucket === i
                    ? { scale: [1, 1.1, 1], transition: { duration: 0.3 } }
                    : {}
                }
                className={`flex-1 flex items-center justify-center text-[10px] font-black border-t border-x first:border-l-0 last:border-r-0 transition-all ${
                  activeBucket === i
                    ? `${getBucketColor(mult)} border-current`
                    : "text-muted-foreground bg-secondary/50 border-border/40"
                }`}
              >
                {mult}x
              </motion.div>
            ))}
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && gameState === "landed" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 p-3 rounded-sm ${
                result.mult >= 1
                  ? "bg-neon/10 border border-neon/20"
                  : "bg-loss/10 border border-loss/20"
              }`}
            >
              <p
                className={`font-bold text-sm ${result.mult >= 1 ? "text-neon" : "text-loss"}`}
              >
                {result.mult}x —{" "}
                {result.mult >= 1
                  ? `Won ${fmt(result.win)}`
                  : `Got back ${fmt(result.win)}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Risk selector */}
        <div className="flex gap-2 mb-3">
          {(["Low", "Medium", "High"] as RiskLevel[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRisk(r)}
              disabled={gameState === "dropping"}
              className={`flex-1 py-2 text-sm font-bold border rounded-sm transition-all disabled:opacity-40 ${
                risk === r
                  ? r === "Low"
                    ? "border-neon bg-neon/10 text-neon"
                    : r === "Medium"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-loss bg-loss/10 text-loss"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Bet presets */}
        <div className="flex gap-2 mb-3">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBetAmount(String(p))}
              disabled={gameState === "dropping"}
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
            disabled={gameState === "dropping"}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {user ? (
          <Button
            onClick={dropBall}
            disabled={gameState === "dropping"}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11 disabled:opacity-50"
          >
            {gameState === "dropping" ? "🎯 Dropping..." : "🎯 Drop Ball"}
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
