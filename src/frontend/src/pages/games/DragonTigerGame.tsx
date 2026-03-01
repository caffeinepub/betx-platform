import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../../context/BettingContext";

const BET_PRESETS = [5, 10, 25, 50];

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const RANK_VALUES: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ rank, suit, value: RANK_VALUES[rank] });
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function suitColor(suit: Suit) {
  return suit === "♥" || suit === "♦" ? "text-red-400" : "text-slate-200";
}

type BetChoice = "Dragon" | "Tiger" | "Tie";
type Outcome = "Dragon" | "Tiger" | "Tie";

export function DragonTigerGame() {
  const { user, withdraw, deposit, addTransaction, setCurrentPage } =
    useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [betChoice, setBetChoice] = useState<BetChoice>("Dragon");
  const [dragonCard, setDragonCard] = useState<Card | null>(null);
  const [tigerCard, setTigerCard] = useState<Card | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [result, setResult] = useState<null | {
    outcome: Outcome;
    won: boolean;
    amount: number;
    winAmount: number;
  }>(null);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const handlePlay = () => {
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

    setIsRevealing(true);
    setResult(null);
    setDragonCard(null);
    setTigerCard(null);

    const deck = shuffle(buildDeck());
    const dc = deck[0];
    const tc = deck[1];

    setTimeout(() => setDragonCard(dc), 400);
    setTimeout(() => setTigerCard(tc), 800);

    setTimeout(() => {
      let outcome: Outcome;
      if (dc.value > tc.value) outcome = "Dragon";
      else if (tc.value > dc.value) outcome = "Tiger";
      else outcome = "Tie";

      const won = betChoice === outcome;
      const multiplier = outcome === "Tie" ? 8 : 2;
      const winAmount = won
        ? Number.parseFloat((amount * multiplier).toFixed(2))
        : 0;

      if (won && winAmount > 0) {
        deposit(winAmount);
        addTransaction(
          "Casino Win",
          winAmount,
          `Dragon Tiger — ${outcome} wins (${dc.rank} vs ${tc.rank})`,
          true,
        );
        toast.success(
          `${outcome === "Dragon" ? "🐉" : outcome === "Tiger" ? "🐯" : "🤝"} ${outcome} wins! You won ${fmt(winAmount)}!`,
        );
      } else {
        addTransaction(
          "Casino Loss",
          amount,
          `Dragon Tiger — ${outcome} wins, you bet ${betChoice}`,
          false,
        );
        toast.error(`${outcome} wins. You lost ${fmt(amount)}.`);
      }

      setResult({ outcome, won, amount, winAmount });
      setIsRevealing(false);
    }, 1200);
  };

  const BET_OPTS: {
    id: BetChoice;
    emoji: string;
    payout: string;
    activeClass: string;
  }[] = [
    {
      id: "Dragon",
      emoji: "🐉",
      payout: "2x",
      activeClass: "border-red-500 bg-red-500/15 text-red-400",
    },
    {
      id: "Tie",
      emoji: "🤝",
      payout: "8x",
      activeClass: "border-gold bg-gold/15 text-gold",
    },
    {
      id: "Tiger",
      emoji: "🐯",
      payout: "2x",
      activeClass: "border-orange-500 bg-orange-500/15 text-orange-400",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div
        className="p-5 border-b border-border flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.025 25 / 50%) 0%, oklch(0.13 0.01 264) 100%)",
        }}
      >
        <div>
          <h2 className="font-display font-bold text-lg">🐉 Dragon Tiger</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            One card each — highest wins · 2x or 8x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Main card display */}
        <div className="flex items-center justify-around mb-6">
          {/* Dragon */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-red-400">🐉 DRAGON</span>
            <AnimatePresence mode="wait">
              {dragonCard ? (
                <motion.div
                  key="dragon-card"
                  initial={{ rotateY: 90, scale: 0.8 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className={`w-20 h-28 rounded-lg border-2 bg-card flex flex-col items-center justify-center shadow-lg gap-1 ${
                    result?.outcome === "Dragon"
                      ? "border-neon shadow-[0_0_12px_oklch(0.88_0.23_155_/_30%)]"
                      : "border-red-500/60"
                  }`}
                >
                  <span
                    className={`text-2xl font-black ${suitColor(dragonCard.suit)}`}
                  >
                    {dragonCard.rank}
                  </span>
                  <span className={`text-3xl ${suitColor(dragonCard.suit)}`}>
                    {dragonCard.suit}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="dragon-back"
                  className="w-20 h-28 rounded-lg border-2 border-red-500/30 bg-red-500/5 flex items-center justify-center"
                >
                  <span className="text-3xl opacity-40">🂠</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-black text-xl text-muted-foreground">VS</span>
            {result && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  result.won ? "bg-neon/20 text-neon" : "bg-loss/20 text-loss"
                }`}
              >
                {result.outcome}
              </motion.div>
            )}
          </div>

          {/* Tiger */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-orange-400">🐯 TIGER</span>
            <AnimatePresence mode="wait">
              {tigerCard ? (
                <motion.div
                  key="tiger-card"
                  initial={{ rotateY: 90, scale: 0.8 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className={`w-20 h-28 rounded-lg border-2 bg-card flex flex-col items-center justify-center shadow-lg gap-1 ${
                    result?.outcome === "Tiger"
                      ? "border-neon shadow-[0_0_12px_oklch(0.88_0.23_155_/_30%)]"
                      : "border-orange-500/60"
                  }`}
                >
                  <span
                    className={`text-2xl font-black ${suitColor(tigerCard.suit)}`}
                  >
                    {tigerCard.rank}
                  </span>
                  <span className={`text-3xl ${suitColor(tigerCard.suit)}`}>
                    {tigerCard.suit}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="tiger-back"
                  className="w-20 h-28 rounded-lg border-2 border-orange-500/30 bg-orange-500/5 flex items-center justify-center"
                >
                  <span className="text-3xl opacity-40">🂠</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-3 rounded-sm border text-center ${
                result.won
                  ? "bg-neon/10 border-neon/30"
                  : "bg-loss/10 border-loss/30"
              }`}
            >
              <p
                className={`font-bold text-sm ${result.won ? "text-neon" : "text-loss"}`}
              >
                {result.won
                  ? `🎉 ${result.outcome} wins! +${fmt(result.winAmount)}`
                  : `${result.outcome} wins. Lost ${fmt(result.amount)}.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet choice */}
        <div className="flex gap-2 mb-4">
          {BET_OPTS.map((opt) => (
            <button
              type="button"
              key={opt.id}
              onClick={() => setBetChoice(opt.id)}
              disabled={isRevealing}
              className={`flex-1 py-2 text-xs font-bold border rounded-sm transition-all disabled:opacity-40 ${
                betChoice === opt.id
                  ? opt.activeClass
                  : "border-border bg-secondary text-muted-foreground hover:border-border/80"
              }`}
            >
              <div className="text-base">{opt.emoji}</div>
              <div>{opt.id}</div>
              <div className="opacity-70">{opt.payout}</div>
            </button>
          ))}
        </div>

        {/* Bet presets */}
        <div className="flex gap-2 mb-3">
          {BET_PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setBetAmount(String(p))}
              disabled={isRevealing}
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
            disabled={isRevealing}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {user ? (
          <Button
            onClick={handlePlay}
            disabled={isRevealing}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
          >
            {isRevealing
              ? "Revealing..."
              : result
                ? "🐉 Play Again"
                : "🐉 Deal Cards"}
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
