import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../context/BettingContext";
import { AndarBaharGame } from "./games/AndarBaharGame";
import { AviatorGame } from "./games/AviatorGame";
import { BaccaratGame } from "./games/BaccaratGame";
import { DragonTigerGame } from "./games/DragonTigerGame";
import { FishingGame } from "./games/FishingGame";
import { MinesGame } from "./games/MinesGame";
import { PlinkoGame } from "./games/PlinkoGame";
import { RouletteGame } from "./games/RouletteGame";
import { SlotMachine } from "./games/SlotMachine";
import { TeenPattiGame } from "./games/TeenPattiGame";

// ---- Coin Flip ----
function CoinFlip() {
  const { user, deposit, addTransaction, setCurrentPage } = useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [choice, setChoice] = useState<"Heads" | "Tails">("Heads");
  const [result, setResult] = useState<null | {
    outcome: "Heads" | "Tails";
    won: boolean;
    amount: number;
  }>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
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

    setIsFlipping(true);
    setResult(null);

    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? "Heads" : "Tails";
      const won = outcome === choice;

      if (won) {
        deposit(amount);
        addTransaction(
          "Casino Win",
          amount * 2,
          `Coin Flip — Won ${choice}`,
          true,
        );
      } else {
        addTransaction(
          "Casino Loss",
          amount,
          `Coin Flip — Lost (${outcome})`,
          false,
        );
      }

      setResult({ outcome, won, amount });
      setIsFlipping(false);

      if (won) {
        toast.success(`🎉 ${outcome}! You won $${(amount * 2).toFixed(2)}!`);
      } else {
        toast.error(`${outcome}. Better luck next time!`);
      }
    }, 1000);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">🪙 Coin Flip</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Guess Heads or Tails — win 2x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            {isFlipping ? (
              <motion.div
                key="flipping"
                animate={{ rotateY: [0, 360, 720, 1080, 1440, 1800] }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-gold/20 border-4 border-gold flex items-center justify-center text-3xl"
                style={{ perspective: 200 }}
              >
                🪙
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center ${
                  result.won
                    ? "border-neon bg-neon/10"
                    : "border-loss bg-loss/10"
                }`}
              >
                <span className="text-3xl">
                  {result.outcome === "Heads" ? "👑" : "🌟"}
                </span>
                <span className="text-[10px] font-bold mt-1 uppercase">
                  {result.outcome}
                </span>
              </motion.div>
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-gold/30 bg-gold/5 flex items-center justify-center text-4xl">
                🪙
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 p-3 rounded-sm ${
                result.won
                  ? "bg-neon/10 border border-neon/20"
                  : "bg-loss/10 border border-loss/20"
              }`}
            >
              <p
                className={`font-bold ${result.won ? "text-neon" : "text-loss"}`}
              >
                {result.won
                  ? `Won ${fmt(result.amount * 2)}! (+${fmt(result.amount)} profit)`
                  : `Lost ${fmt(result.amount)}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mb-4">
          {(["Heads", "Tails"] as const).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setChoice(c)}
              className={`flex-1 py-2.5 text-sm font-bold border rounded-sm transition-all ${
                choice === c
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border bg-secondary text-muted-foreground hover:border-gold/50"
              }`}
            >
              {c === "Heads" ? "👑 Heads" : "🌟 Tails"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {[5, 10, 25, 50].map((p) => (
            <button
              type="button"
              key={p}
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
        <div className="relative mb-4">
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

        {user && (
          <p className="text-xs text-muted-foreground mb-3">
            Balance:{" "}
            <span className="text-gold font-bold">{fmt(user.balance)}</span>
            {" · "}Potential win:{" "}
            <span className="text-neon font-bold">
              {fmt(Number.parseFloat(betAmount || "0") * 2)}
            </span>
          </p>
        )}

        {user ? (
          <Button
            onClick={handleFlip}
            disabled={isFlipping}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
          >
            {isFlipping ? "Flipping..." : "🪙 Flip Coin"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentPage("home")}
            variant="outline"
            className="w-full rounded-sm"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Log in to play
          </Button>
        )}
      </div>
    </div>
  );
}

// ---- Dice Roll ----
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function DiceRoll() {
  const { user, deposit, addTransaction, setCurrentPage } = useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [choice, setChoice] = useState<"Over" | "Under">("Over");
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<null | {
    total: number;
    won: boolean;
    amount: number;
  }>(null);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRoll = () => {
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

    setIsRolling(true);
    setResult(null);

    rollIntervalRef.current = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 80);

    setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      const total = d1 + d2;
      const won =
        (choice === "Over" && total > 7) || (choice === "Under" && total < 7);

      if (won) {
        deposit(amount * 1.8);
        addTransaction(
          "Casino Win",
          amount * 1.8,
          `Dice Roll — ${total} (${choice} 7)`,
          true,
        );
      }
      addTransaction(
        won ? "Casino Win" : "Casino Loss",
        amount,
        `Dice Roll — Total: ${total}, bet ${choice} 7`,
        false,
      );

      setResult({ total, won, amount });
      setIsRolling(false);

      if (won) {
        toast.success(`🎲 Total: ${total}! You won!`);
      } else {
        toast.error(`🎲 Total: ${total}. House wins.`);
      }
    }, 700);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">🎲 Dice Roll</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Predict Over or Under 7 — win 1.8x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-center gap-4 mb-6">
          {dice.map((d, idx) => (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: dice are positionally stable
              key={idx}
              animate={isRolling ? { rotate: [0, 180, 360] } : { rotate: 0 }}
              transition={
                isRolling
                  ? { duration: 0.2, repeat: Number.POSITIVE_INFINITY }
                  : { duration: 0 }
              }
              className={`w-16 h-16 flex items-center justify-center text-4xl border-2 rounded-sm ${
                result
                  ? result.won
                    ? "border-neon bg-neon/5"
                    : "border-loss bg-loss/5"
                  : "border-border bg-secondary"
              }`}
            >
              {DICE_FACES[d - 1]}
            </motion.div>
          ))}
          <div className="flex items-center">
            <span className="font-display font-black text-2xl text-gold">
              = {dice[0] + dice[1]}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 p-3 rounded-sm ${
                result.won
                  ? "bg-neon/10 border border-neon/20"
                  : "bg-loss/10 border border-loss/20"
              }`}
            >
              <p
                className={`font-bold ${result.won ? "text-neon" : "text-loss"}`}
              >
                {result.won
                  ? `Won ${fmt(result.amount * 1.8)}! Total was ${result.total}`
                  : `Lost ${fmt(result.amount)}. Total was ${result.total}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mb-4">
          {(["Under", "Over"] as const).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setChoice(c)}
              className={`flex-1 py-2.5 text-sm font-bold border rounded-sm transition-all ${
                choice === c
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border bg-secondary text-muted-foreground hover:border-gold/50"
              }`}
            >
              {c === "Under" ? "⬇ Under 7" : "⬆ Over 7"}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mb-4">
          Roll of 7 = Push (House wins tie)
        </p>

        <div className="flex gap-2 mb-4">
          {[5, 10, 25, 50].map((p) => (
            <button
              type="button"
              key={p}
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
        <div className="relative mb-4">
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

        {user && (
          <p className="text-xs text-muted-foreground mb-3">
            Balance:{" "}
            <span className="text-gold font-bold">{fmt(user.balance)}</span>
            {" · "}Win:{" "}
            <span className="text-neon font-bold">
              {fmt(Number.parseFloat(betAmount || "0") * 1.8)}
            </span>
          </p>
        )}

        {user ? (
          <Button
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
          >
            {isRolling ? "Rolling..." : "🎲 Roll Dice"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentPage("home")}
            variant="outline"
            className="w-full rounded-sm"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Log in to play
          </Button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// GAME LOBBY DATA
// ================================================================

type GameCategory =
  | "All"
  | "Crash"
  | "Slots"
  | "Table"
  | "Fishing"
  | "Cards"
  | "Other";

interface GameInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: GameCategory;
  multRange: string;
  isNew?: boolean;
  isHot?: boolean;
  component: React.ComponentType;
}

const GAMES: GameInfo[] = [
  {
    id: "aviator",
    name: "Aviator",
    emoji: "✈️",
    description: "Crash game — cash out before the plane flies away!",
    category: "Crash",
    multRange: "1.1x – 20x",
    isHot: true,
    component: AviatorGame,
  },
  {
    id: "slots",
    name: "Slot Machine",
    emoji: "🎰",
    description: "3-reel classic slots — triple 7s = 50x jackpot",
    category: "Slots",
    multRange: "2x – 50x",
    isHot: true,
    component: SlotMachine,
  },
  {
    id: "fishing",
    name: "Fishing",
    emoji: "🎣",
    description: "Cast your line and catch fish for big multipliers",
    category: "Fishing",
    multRange: "1.2x – 25x",
    isNew: true,
    component: FishingGame,
  },
  {
    id: "mines",
    name: "Mines",
    emoji: "💣",
    description: "Reveal safe tiles — cash out before you hit a bomb",
    category: "Other",
    multRange: "1.2x – 100x",
    isHot: true,
    component: MinesGame,
  },
  {
    id: "roulette",
    name: "Roulette",
    emoji: "🎡",
    description: "European roulette — red, black or lucky zero",
    category: "Table",
    multRange: "2x – 35x",
    component: RouletteGame,
  },
  {
    id: "plinko",
    name: "Plinko",
    emoji: "🎯",
    description: "Drop a ball through pegs — land in multiplier buckets",
    category: "Other",
    multRange: "0.1x – 10x",
    isNew: true,
    component: PlinkoGame,
  },
  {
    id: "coinflip",
    name: "Coin Flip",
    emoji: "🪙",
    description: "50/50 odds — guess heads or tails",
    category: "Other",
    multRange: "2x",
    component: CoinFlip,
  },
  {
    id: "dice",
    name: "Dice Roll",
    emoji: "🎲",
    description: "Over or under 7 with two dice",
    category: "Table",
    multRange: "1.8x",
    component: DiceRoll,
  },
  {
    id: "teenpatti",
    name: "Teen Patti",
    emoji: "🃏",
    description: "Indian Poker — Trail wins 5x, Pure Sequence 4x",
    category: "Cards",
    multRange: "1.5x – 5x",
    isHot: true,
    component: TeenPattiGame,
  },
  {
    id: "andarbahr",
    name: "Andar Bahar",
    emoji: "🎴",
    description: "Pick Andar or Bahar — match the Joker card",
    category: "Cards",
    multRange: "1.95x",
    isNew: true,
    component: AndarBaharGame,
  },
  {
    id: "baccarat",
    name: "Baccarat",
    emoji: "🂡",
    description: "Player, Banker or Tie — classic card game",
    category: "Cards",
    multRange: "1.95x – 8x",
    component: BaccaratGame,
  },
  {
    id: "dragontiger",
    name: "Dragon Tiger",
    emoji: "🐉",
    description: "One card each — highest card wins instantly",
    category: "Cards",
    multRange: "2x – 8x",
    isHot: true,
    component: DragonTigerGame,
  },
];

const CATEGORIES: { id: GameCategory; label: string; emoji: string }[] = [
  { id: "All", label: "All Games", emoji: "🎮" },
  { id: "Cards", label: "Cards", emoji: "🃏" },
  { id: "Crash", label: "Crash", emoji: "✈️" },
  { id: "Slots", label: "Slots", emoji: "🎰" },
  { id: "Table", label: "Table", emoji: "🎡" },
  { id: "Fishing", label: "Fishing", emoji: "🎣" },
  { id: "Other", label: "Other", emoji: "🎯" },
];

// ================================================================
// BIG WINS TICKER DATA
// ================================================================

const BIG_WINS = [
  { player: "RajKing99", game: "Aviator", amount: "$842", emoji: "🚀" },
  { player: "Lucky_Priya", game: "Teen Patti", amount: "$450", emoji: "🃏" },
  { player: "AnkitBet", game: "Dragon Tiger", amount: "$320", emoji: "🐉" },
  { player: "SunilHero", game: "Slot Machine", amount: "$1,250", emoji: "🎰" },
  { player: "MegaPlayer7", game: "Andar Bahar", amount: "$195", emoji: "🎴" },
  { player: "BigWinner_X", game: "Baccarat", amount: "$560", emoji: "🂡" },
  { player: "CricketKing", game: "Mines", amount: "$720", emoji: "💣" },
  { player: "StarBet21", game: "Roulette", amount: "$385", emoji: "🎡" },
  { player: "IndiaLucks", game: "Fishing", amount: "$210", emoji: "🎣" },
  { player: "VIPPlayer_A", game: "Teen Patti", amount: "$930", emoji: "🃏" },
];

// ================================================================
// CASINO PAGE
// ================================================================

export function CasinoPage() {
  const { user, setCurrentPage } = useBetting();
  const [activeCategory, setActiveCategory] = useState<GameCategory>("All");
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  const filteredGames =
    activeCategory === "All"
      ? GAMES
      : GAMES.filter((g) => g.category === activeCategory);

  const activeGame = activeGameId
    ? GAMES.find((g) => g.id === activeGameId)
    : null;

  const openGame = (id: string) => {
    setActiveGameId(id);
    setTimeout(() => {
      gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl">
            🎰 Casino
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {GAMES.length} games · Instant payouts · Demo balance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-sm">
              <Wallet className="w-4 h-4 text-gold" />
              <span className="text-gold font-bold text-sm">
                {fmt(user.balance)}
              </span>
            </div>
          ) : (
            <Button
              onClick={() => setCurrentPage("home")}
              className="border border-gold bg-gold/10 text-gold hover:bg-gold/20 rounded-sm font-bold"
            >
              Log in to play
            </Button>
          )}
        </div>
      </div>

      {!user && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gold/5 border border-gold/20 rounded-sm"
        >
          <p className="text-sm font-medium text-gold">
            🎲 Register and get $1,000 demo balance — no deposit needed!
          </p>
        </motion.div>
      )}

      {/* Big Wins Ticker */}
      <div
        className="mb-6 rounded-sm overflow-hidden border border-border"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.12 0.015 264), oklch(0.1 0.008 264))",
        }}
      >
        <div className="flex items-center">
          <div
            className="shrink-0 px-3 py-2 text-[11px] font-black tracking-widest border-r border-border"
            style={{
              color: "oklch(0.88 0.23 155)",
              background: "oklch(0.88 0.23 155 / 10%)",
            }}
          >
            🏆 BIG WINS
          </div>
          <div className="overflow-hidden flex-1 py-2 px-1">
            <div className="wins-ticker flex gap-8 whitespace-nowrap w-max">
              {[...BIG_WINS, ...BIG_WINS].map((w, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: duplicated for marquee
                  key={i}
                  className="text-[12px] font-medium"
                  style={{ color: "oklch(0.88 0.23 155)" }}
                >
                  {w.emoji} <span className="font-bold">{w.player}</span>{" "}
                  <span className="opacity-70">just won</span>{" "}
                  <span className="font-black text-gold">{w.amount}</span>{" "}
                  <span className="opacity-70">on</span>{" "}
                  <span className="font-semibold">{w.game}</span>
                  <span className="opacity-30 ml-8">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.id);
              if (activeGameId) {
                const current = GAMES.find((g) => g.id === activeGameId);
                if (
                  current &&
                  cat.id !== "All" &&
                  current.category !== cat.id
                ) {
                  setActiveGameId(null);
                }
              }
            }}
            className={`px-4 py-2 text-sm font-bold border rounded-sm transition-all ${
              activeCategory === cat.id
                ? "border-neon bg-neon/10 text-neon"
                : "border-border bg-secondary text-muted-foreground hover:border-neon/50 hover:text-foreground"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Active game display */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            ref={gameRef}
            key={activeGame.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setActiveGameId(null)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to lobby
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-bold">
                {activeGame.emoji} {activeGame.name}
              </span>
            </div>
            <div className="max-w-lg">
              <activeGame.component />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredGames.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`group bg-card border rounded-sm overflow-hidden cursor-pointer transition-all hover:border-gold/40 ${
              activeGameId === game.id ? "active-game-card" : "border-border"
            }`}
            onClick={() => openGame(game.id)}
          >
            {/* Game preview area */}
            <div
              className="h-28 flex items-center justify-center relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.12 0.015 264) 0%, oklch(0.16 0.02 264) 100%)",
              }}
            >
              {/* Decorative background */}
              <div className="absolute inset-0 opacity-20">
                {game.id === "aviator" && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at 80% 50%, oklch(0.3 0.1 240 / 50%) 0%, transparent 70%)",
                    }}
                  />
                )}
                {game.id === "slots" && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 text-5xl tracking-widest">
                    🎰🎰🎰
                  </div>
                )}
                {game.id === "fishing" && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1/2"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, oklch(0.2 0.06 230 / 60%))",
                    }}
                  />
                )}
              </div>
              <span
                className="text-5xl relative z-10 transition-transform group-hover:scale-110 duration-200"
                style={{ filter: "drop-shadow(0 4px 8px oklch(0 0 0 / 40%))" }}
              >
                {game.emoji}
              </span>
              {game.isNew && (
                <Badge className="absolute top-2 left-2 bg-neon/20 text-neon border-neon/30 text-[10px] px-1.5 py-0">
                  NEW
                </Badge>
              )}
              {game.isHot && !game.isNew && (
                <Badge className="absolute top-2 left-2 bg-loss/20 text-loss border-loss/30 text-[10px] px-1.5 py-0">
                  🔥 HOT
                </Badge>
              )}
              {activeGameId === game.id && (
                <Badge
                  className="absolute top-2 right-2 text-[10px] px-1.5 py-0"
                  style={{
                    background: "oklch(0.65 0.25 290 / 20%)",
                    color: "oklch(0.65 0.25 290)",
                    borderColor: "oklch(0.65 0.25 290 / 40%)",
                  }}
                >
                  ACTIVE
                </Badge>
              )}
            </div>

            {/* Game info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display font-bold text-sm">{game.name}</h3>
                <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-sm whitespace-nowrap border border-gold/20">
                  {game.multRange}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {game.description}
              </p>
              <button
                type="button"
                style={
                  activeGameId === game.id
                    ? {
                        borderColor: "oklch(0.65 0.25 290)",
                        background: "oklch(0.65 0.25 290 / 10%)",
                        color: "oklch(0.65 0.25 290)",
                      }
                    : {}
                }
                className={`w-full py-2 text-xs font-bold border rounded-sm transition-all ${
                  activeGameId === game.id
                    ? ""
                    : "border-border bg-secondary text-muted-foreground group-hover:border-gold/50 group-hover:text-gold"
                }`}
              >
                {activeGameId === game.id ? "▶ Playing Now" : "▶ Play Game"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Responsible gaming */}
      <div className="p-4 bg-secondary border border-border rounded-sm">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">
            🛡 Responsible Gaming:{" "}
          </span>
          All games use virtual demo currency only. No real money is involved.
          Set personal limits and play within your means. If gaming affects your
          well-being, please seek help.{" "}
          <span className="text-gold">18+ only.</span>
        </p>
      </div>
    </div>
  );
}
