import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

interface FishType {
  emoji: string;
  name: string;
  chance: number;
  minMult: number;
  maxMult: number;
}

const FISH_TYPES: FishType[] = [
  { emoji: "🐟", name: "Small Fish", chance: 0.6, minMult: 1.2, maxMult: 1.5 },
  {
    emoji: "🐠",
    name: "Medium Fish",
    chance: 0.25,
    minMult: 2.0,
    maxMult: 3.0,
  },
  { emoji: "🐡", name: "Big Fish", chance: 0.12, minMult: 5.0, maxMult: 8.0 },
  {
    emoji: "🦈",
    name: "Legendary Shark",
    chance: 0.03,
    minMult: 15.0,
    maxMult: 25.0,
  },
];

function catchFish(): { fish: FishType; multiplier: number } {
  const rand = Math.random();
  let cumulative = 0;
  for (const fish of FISH_TYPES) {
    cumulative += fish.chance;
    if (rand < cumulative) {
      const mult = fish.minMult + Math.random() * (fish.maxMult - fish.minMult);
      return { fish, multiplier: Number.parseFloat(mult.toFixed(2)) };
    }
  }
  const fish = FISH_TYPES[0];
  return {
    fish,
    multiplier: Number.parseFloat(
      (fish.minMult + Math.random() * (fish.maxMult - fish.minMult)).toFixed(2),
    ),
  };
}

type GameState = "idle" | "casting" | "caught";

const BET_PRESETS = [5, 10, 25, 50];

// Decorative fish that swim in the background
const BACKGROUND_FISH = [
  { id: "fish-10-60", emoji: "🐟", x: 10, y: 60, delay: 0 },
  { id: "fish-40-75", emoji: "🐠", x: 40, y: 75, delay: 1.5 },
  { id: "fish-70-65", emoji: "🐟", x: 70, y: 65, delay: 0.8 },
  { id: "fish-55-80", emoji: "🐡", x: 55, y: 80, delay: 2.2 },
  { id: "fish-25-72", emoji: "🐟", x: 25, y: 72, delay: 1.0 },
];

// Static bubble positions
const BUBBLES = Array.from({ length: 8 }, (_, i) => ({
  id: `bubble-${i * 13}`,
  width: 4 + (i % 3) * 3,
  height: 4 + (i % 3) * 3,
  left: 10 + ((i * 13) % 80),
  bottom: 5 + ((i * 7) % 40),
  duration: 2 + i * 0.3,
  delay: i * 0.4,
}));

export function FishingGame() {
  const {
    user,
    deposit,
    withdraw,
    addTransaction,
    setCurrentPage,
    gameSettings,
  } = useBetting();

  const [betAmount, setBetAmount] = useState("10");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [catchResult, setCatchResult] = useState<{
    fish: FishType;
    multiplier: number;
    winAmount: number;
  } | null>(null);

  const castLine = useCallback(() => {
    if (!user) {
      toast.error("Log in to play");
      return;
    }
    const amount = Number.parseFloat(betAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bet");
      return;
    }
    if (user.balance < amount) {
      toast.error("Insufficient balance");
      return;
    }
    if (!withdraw(amount)) return;
    addTransaction("Casino Loss", amount, "Fishing — Cast line", false);

    setGameState("casting");
    setCatchResult(null);

    // Hook descends animation
    const catchDelay = 2000 + Math.random() * 1000;

    setTimeout(() => {
      const { fish, multiplier } = catchFish();
      const winAmount = Number.parseFloat((amount * multiplier).toFixed(2));

      deposit(winAmount);
      addTransaction(
        "Casino Win",
        winAmount,
        `Fishing — Caught ${fish.name} @ ${multiplier}x`,
        true,
      );

      setCatchResult({ fish, multiplier, winAmount });
      setGameState("caught");

      if (fish.name === "Legendary Shark") {
        toast.success(
          `🦈 LEGENDARY! ${fish.emoji} ${fish.name} @ ${multiplier}x! Won $${winAmount.toFixed(2)}!`,
        );
      } else if (multiplier >= 5) {
        toast.success(
          `🎣 Big catch! ${fish.emoji} ${fish.name} @ ${multiplier}x! Won $${winAmount.toFixed(2)}!`,
        );
      } else {
        toast.success(
          `🎣 Caught ${fish.emoji} ${fish.name} @ ${multiplier}x! Won $${winAmount.toFixed(2)}`,
        );
      }
    }, catchDelay);
  }, [user, betAmount, withdraw, deposit, addTransaction]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  if (gameSettings?.fishing?.enabled === false) {
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
          <h2 className="font-display font-bold text-lg">🎣 Fishing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cast your line · Catch fish for big multipliers
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Ocean scene */}
        <div className="relative h-52 rounded-sm overflow-hidden mb-4 border border-border">
          {/* Sky */}
          <div
            className="absolute top-0 left-0 right-0 h-16"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.12 0.03 240) 0%, oklch(0.16 0.025 210) 100%)",
            }}
          />
          {/* Water surface line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "60px",
              height: "3px",
              background:
                "linear-gradient(90deg, oklch(0.4 0.15 220 / 0%), oklch(0.6 0.2 220 / 80%), oklch(0.4 0.15 220 / 0%))",
            }}
          />
          {/* Water */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              top: "62px",
              background:
                "linear-gradient(180deg, oklch(0.18 0.08 225) 0%, oklch(0.12 0.06 240) 100%)",
            }}
          />

          {/* Bubbles */}
          {BUBBLES.map((b) => (
            <motion.div
              key={b.id}
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${b.width}px`,
                height: `${b.height}px`,
                left: `${b.left}%`,
                bottom: `${b.bottom}%`,
                background: "oklch(0.8 0.05 220 / 10%)",
              }}
              animate={{
                y: [0, -30, -60],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                duration: b.duration,
                repeat: Number.POSITIVE_INFINITY,
                delay: b.delay,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Background fish swimming */}
          {BACKGROUND_FISH.map((f) => (
            <motion.div
              key={f.id}
              className="absolute text-xl"
              style={{ top: `${f.y}%`, left: `${f.x}%` }}
              animate={{ x: [-20, 20, -20] }}
              transition={{
                duration: 3 + f.delay,
                repeat: Number.POSITIVE_INFINITY,
                delay: f.delay,
                ease: "easeInOut",
              }}
            >
              {f.emoji}
            </motion.div>
          ))}

          {/* Fishing rod */}
          <div className="absolute" style={{ top: "2px", right: "24px" }}>
            <div
              className="w-0.5 h-14 rounded"
              style={{
                background: "oklch(0.65 0.08 68)",
                transformOrigin: "top",
                transform: "rotate(20deg)",
              }}
            />
          </div>

          {/* Fishing line & hook */}
          <AnimatePresence>
            {(gameState === "casting" || gameState === "caught") && (
              <>
                {/* Line */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: gameState === "caught" ? 120 : 140 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute"
                  style={{
                    top: "14px",
                    right: "30px",
                    width: "1px",
                    background: "oklch(0.8 0 0 / 60%)",
                  }}
                />
                {/* Hook */}
                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{
                    y: gameState === "caught" ? 100 : 140,
                    opacity: 1,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute right-7 text-lg"
                  style={{ top: "14px" }}
                >
                  {gameState === "caught" && catchResult
                    ? catchResult.fish.emoji
                    : "🪝"}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Result overlay */}
          <AnimatePresence>
            {gameState === "caught" && catchResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "oklch(0 0 0 / 50%)" }}
              >
                <div className="text-center p-4">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl mb-2"
                  >
                    {catchResult.fish.emoji}
                  </motion.div>
                  <p className="font-display font-black text-xl text-gold">
                    {catchResult.fish.name}
                  </p>
                  <p className="text-neon font-black text-2xl">
                    {catchResult.multiplier}x
                  </p>
                  <p className="text-neon text-sm font-bold">
                    +{fmt(catchResult.winAmount)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Casting animation */}
          {gameState === "casting" && !catchResult && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground animate-pulse">
              Waiting for a bite...
            </div>
          )}
        </div>

        {/* Fish type reference */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {FISH_TYPES.map((fish) => (
            <div
              key={fish.name}
              className="text-center p-2 bg-secondary/50 rounded-sm border border-border/50"
            >
              <div className="text-lg">{fish.emoji}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {fish.name.split(" ")[0]}
              </div>
              <div className="text-[10px] text-gold font-bold">
                {fish.minMult}–{fish.maxMult}x
              </div>
            </div>
          ))}
        </div>

        {/* Bet presets */}
        <div className="flex gap-2 mb-3">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBetAmount(String(p))}
              disabled={gameState === "casting"}
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
            disabled={gameState === "casting"}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {user ? (
          <Button
            onClick={() => {
              if (gameState === "idle" || gameState === "caught") {
                setGameState("idle");
                castLine();
              }
            }}
            disabled={gameState === "casting"}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
          >
            {gameState === "casting"
              ? "🎣 Waiting for bite..."
              : gameState === "caught"
                ? "🔄 Cast Again"
                : "🎣 Cast Line"}
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
