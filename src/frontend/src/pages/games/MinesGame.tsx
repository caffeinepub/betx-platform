import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

const GRID_SIZE = 25; // 5x5
const MINE_OPTIONS = [3, 5, 8, 10] as const;

type TileState = "hidden" | "safe" | "mine";

interface TileData {
  id: number;
  isMine: boolean;
  state: TileState;
}

function calcMultiplier(safeRevealed: number, totalMines: number): number {
  const safeTiles = GRID_SIZE - totalMines;
  const remaining = safeTiles - safeRevealed;
  if (remaining <= 0) return 100;
  // House edge factor
  const houseFactor = 0.97;
  let mult = 1.0;
  for (let i = 0; i < safeRevealed; i++) {
    const tilesLeft = GRID_SIZE - i;
    const safeLeft = safeTiles - i;
    mult *= (tilesLeft / safeLeft) * houseFactor;
  }
  return Number.parseFloat(mult.toFixed(2));
}

function nextMultiplier(safeRevealed: number, totalMines: number): number {
  return calcMultiplier(safeRevealed + 1, totalMines);
}

function generateGrid(mineCount: number): TileData[] {
  const tiles: TileData[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
    id: i,
    isMine: false,
    state: "hidden" as TileState,
  }));

  // Place mines randomly
  const mineIndices = new Set<number>();
  while (mineIndices.size < mineCount) {
    mineIndices.add(Math.floor(Math.random() * GRID_SIZE));
  }
  for (const idx of mineIndices) {
    tiles[idx].isMine = true;
  }

  return tiles;
}

type GamePhase = "idle" | "playing" | "won" | "lost";

const BET_PRESETS = [5, 10, 25, 50];

export function MinesGame() {
  const { user, deposit, withdraw, addTransaction, setCurrentPage } =
    useBetting();

  const [betAmount, setBetAmount] = useState("10");
  const [mineCount, setMineCount] = useState<(typeof MINE_OPTIONS)[number]>(5);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [safeRevealed, setSafeRevealed] = useState(0);
  const [currentMult, setCurrentMult] = useState(1.0);
  const [betRef, setBetRef] = useState(0);

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
    if (!withdraw(amount)) return;
    addTransaction(
      "Casino Loss",
      amount,
      `Mines — Bet placed (${mineCount} mines)`,
      false,
    );

    const newGrid = generateGrid(mineCount);
    setTiles(newGrid);
    setPhase("playing");
    setSafeRevealed(0);
    setCurrentMult(1.0);
    setBetRef(amount);
  }, [user, betAmount, mineCount, withdraw, addTransaction]);

  const revealTile = useCallback(
    (tileId: number) => {
      if (phase !== "playing") return;
      const tile = tiles[tileId];
      if (!tile || tile.state !== "hidden") return;

      if (tile.isMine) {
        // Game over! Reveal all mines
        setTiles((prev) =>
          prev.map((t) => ({
            ...t,
            state:
              t.state === "hidden" && t.isMine
                ? "mine"
                : t.state === "hidden"
                  ? t.state
                  : t.state,
          })),
        );

        // Reveal the clicked mine immediately
        setTiles((prev) =>
          prev.map((t) => ({
            ...t,
            state: t.id === tileId ? "mine" : t.isMine ? "mine" : t.state,
          })),
        );

        addTransaction(
          "Casino Loss",
          betRef,
          `Mines — Hit a mine! (${safeRevealed} safe tiles revealed)`,
          false,
        );

        setPhase("lost");
        toast.error("💣 BOOM! You hit a mine!");
      } else {
        const newSafeCount = safeRevealed + 1;
        const newMult = calcMultiplier(newSafeCount, mineCount);

        setTiles((prev) =>
          prev.map((t) => (t.id === tileId ? { ...t, state: "safe" } : t)),
        );
        setSafeRevealed(newSafeCount);
        setCurrentMult(newMult);

        // Check if all safe tiles revealed
        const totalSafe = GRID_SIZE - mineCount;
        if (newSafeCount >= totalSafe) {
          const winAmount = Number.parseFloat((betRef * newMult).toFixed(2));
          deposit(winAmount);
          addTransaction(
            "Casino Win",
            winAmount,
            `Mines — All safe tiles! ${newMult}x`,
            true,
          );
          setPhase("won");
          toast.success(
            `🎉 All safe tiles revealed! Won $${winAmount.toFixed(2)}!`,
          );
        }
      }
    },
    [phase, tiles, safeRevealed, mineCount, betRef, deposit, addTransaction],
  );

  const cashOut = useCallback(() => {
    if (phase !== "playing" || safeRevealed === 0) return;
    const winAmount = Number.parseFloat((betRef * currentMult).toFixed(2));
    deposit(winAmount);
    addTransaction(
      "Casino Win",
      winAmount,
      `Mines — Cashed out @ ${currentMult}x`,
      true,
    );

    // Reveal all mines
    setTiles((prev) =>
      prev.map((t) => ({
        ...t,
        state: t.isMine ? "mine" : t.state,
      })),
    );

    setPhase("won");
    toast.success(
      `💰 Cashed out @ ${currentMult}x! Won $${winAmount.toFixed(2)}!`,
    );
  }, [phase, safeRevealed, betRef, currentMult, deposit, addTransaction]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">💣 Mines</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reveal safe tiles · Cash out anytime
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Multiplier display (when playing) */}
        <AnimatePresence>
          {phase === "playing" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between mb-4 p-3 bg-secondary/50 rounded-sm border border-border"
            >
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-display font-black text-2xl text-neon">
                  {currentMult.toFixed(2)}x
                </p>
                <p className="text-xs text-neon">
                  = {fmt(betRef * currentMult)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next tile</p>
                <p className="font-display font-black text-2xl text-gold">
                  {nextMultiplier(safeRevealed, mineCount).toFixed(2)}x
                </p>
                <p className="text-xs text-gold">
                  = {fmt(betRef * nextMultiplier(safeRevealed, mineCount))}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game grid */}
        {phase !== "idle" && (
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {tiles.map((tile) => (
              <motion.button
                key={tile.id}
                type="button"
                onClick={() => revealTile(tile.id)}
                disabled={phase !== "playing" || tile.state !== "hidden"}
                whileHover={
                  phase === "playing" && tile.state === "hidden"
                    ? { scale: 1.05 }
                    : {}
                }
                whileTap={
                  phase === "playing" && tile.state === "hidden"
                    ? { scale: 0.95 }
                    : {}
                }
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: tile.id * 0.01 }}
                className={`aspect-square flex items-center justify-center text-xl rounded-sm border transition-all ${
                  tile.state === "hidden"
                    ? "border-border bg-secondary hover:border-gold/50 hover:bg-gold/5 cursor-pointer"
                    : tile.state === "safe"
                      ? "border-neon/40 bg-neon/10 cursor-default"
                      : "border-loss/40 bg-loss/10 cursor-default"
                }`}
              >
                {tile.state === "safe" ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    💎
                  </motion.span>
                ) : tile.state === "mine" ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    💣
                  </motion.span>
                ) : (
                  <span className="opacity-0">·</span>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Setup (idle state) */}
        {phase === "idle" && (
          <div className="space-y-4 mb-4">
            {/* Mines selector */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Number of mines
              </p>
              <div className="flex gap-2">
                {MINE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMineCount(n)}
                    className={`flex-1 py-2 text-sm font-bold border rounded-sm transition-all ${
                      mineCount === n
                        ? "border-loss bg-loss/10 text-loss"
                        : "border-border bg-secondary text-muted-foreground hover:border-loss/50"
                    }`}
                  >
                    {n} 💣
                  </button>
                ))}
              </div>
            </div>

            {/* Bet presets */}
            <div className="flex gap-2">
              {BET_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBetAmount(String(p))}
                  className={`flex-1 py-1.5 text-xs font-bold border rounded-sm transition-all ${
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
                className="pl-7 bg-secondary border-border rounded-sm"
                placeholder="Bet amount"
              />
            </div>
          </div>
        )}

        {/* Result messages */}
        <AnimatePresence>
          {(phase === "lost" || phase === "won") && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 p-3 rounded-sm ${
                phase === "won"
                  ? "bg-neon/10 border border-neon/20"
                  : "bg-loss/10 border border-loss/20"
              }`}
            >
              <p
                className={`font-bold ${phase === "won" ? "text-neon" : "text-loss"}`}
              >
                {phase === "won"
                  ? `Won ${fmt(betRef * currentMult)} @ ${currentMult}x!`
                  : `Hit a mine! ${safeRevealed} safe tile${safeRevealed !== 1 ? "s" : ""} revealed.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {user ? (
          <div className="space-y-2">
            {phase === "playing" && safeRevealed > 0 && (
              <Button
                onClick={cashOut}
                className="w-full bg-neon/10 border border-neon text-neon hover:bg-neon/20 font-bold rounded-sm h-11 glow-neon"
              >
                💰 Cash Out {fmt(betRef * currentMult)} @{" "}
                {currentMult.toFixed(2)}x
              </Button>
            )}
            {(phase === "idle" || phase === "lost" || phase === "won") && (
              <Button
                onClick={() => {
                  setPhase("idle");
                  startGame();
                }}
                className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
              >
                {phase === "idle" ? "💣 Start Game" : "🔄 Play Again"}
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
