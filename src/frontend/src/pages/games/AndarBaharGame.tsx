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

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
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

function SmallCard({
  card,
  revealed = true,
}: { card?: Card; revealed?: boolean }) {
  if (!revealed || !card) {
    return (
      <div className="w-10 h-14 rounded border border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground">
        🂠
      </div>
    );
  }
  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.8 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="w-10 h-14 rounded border border-border bg-card flex flex-col items-center justify-center shadow"
    >
      <span className={`text-[11px] font-black ${suitColor(card.suit)}`}>
        {card.rank}
      </span>
      <span className={`text-sm ${suitColor(card.suit)}`}>{card.suit}</span>
    </motion.div>
  );
}

export function AndarBaharGame() {
  const { user, withdraw, deposit, addTransaction, setCurrentPage } =
    useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [side, setSide] = useState<"Andar" | "Bahar">("Andar");
  const [joker, setJoker] = useState<Card | null>(null);
  const [andarCards, setAndarCards] = useState<Card[]>([]);
  const [baharCards, setBaharCards] = useState<Card[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [winnerSide, setWinnerSide] = useState<"Andar" | "Bahar" | null>(null);
  const [result, setResult] = useState<null | {
    won: boolean;
    amount: number;
    side: "Andar" | "Bahar";
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

    setIsPlaying(true);
    setResult(null);
    setAndarCards([]);
    setBaharCards([]);
    setWinnerSide(null);

    const deck = shuffle(buildDeck());
    const jokerCard = deck[0];
    setJoker(jokerCard);
    const remaining = deck.slice(1);

    // Simulate dealing with delays
    const andar: Card[] = [];
    const bahar: Card[] = [];
    let matchSide: "Andar" | "Bahar" | null = null;
    let idx = 0;
    const betSide = side;

    const dealNext = () => {
      if (matchSide !== null) return;
      if (idx >= remaining.length) {
        // Fallback — shouldn't happen
        setIsPlaying(false);
        return;
      }

      const card = remaining[idx];
      idx++;

      if (idx % 2 === 1) {
        andar.push(card);
        setAndarCards([...andar]);
        if (card.rank === jokerCard.rank) {
          matchSide = "Andar";
        }
      } else {
        bahar.push(card);
        setBaharCards([...bahar]);
        if (card.rank === jokerCard.rank) {
          matchSide = "Bahar";
        }
      }

      if (matchSide !== null) {
        setWinnerSide(matchSide);
        const won = matchSide === betSide;
        const winAmount = won
          ? Number.parseFloat((amount * 1.95).toFixed(2))
          : 0;

        setTimeout(() => {
          if (won && winAmount > 0) {
            deposit(winAmount);
            addTransaction(
              "Casino Win",
              winAmount,
              `Andar Bahar — ${matchSide} wins`,
              true,
            );
            toast.success(`🎴 ${matchSide} wins! You won ${fmt(winAmount)}!`);
          } else {
            addTransaction(
              "Casino Loss",
              amount,
              `Andar Bahar — ${matchSide} wins, you bet ${betSide}`,
              false,
            );
            toast.error(`${matchSide} wins. Better luck next time!`);
          }
          setResult({ won, amount, side: matchSide as "Andar" | "Bahar" });
          setIsPlaying(false);
        }, 300);
        return;
      }

      // Continue dealing with delay
      if (idx < remaining.length) {
        setTimeout(dealNext, 250);
      }
    };

    setTimeout(dealNext, 500);
  };

  const reset = () => {
    setJoker(null);
    setAndarCards([]);
    setBaharCards([]);
    setWinnerSide(null);
    setResult(null);
  };

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div
        className="p-5 border-b border-border flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.02 290 / 50%) 0%, oklch(0.13 0.01 264) 100%)",
        }}
      >
        <div>
          <h2 className="font-display font-bold text-lg">🎴 Andar Bahar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Match the Joker — win 1.95x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Joker card */}
        <div className="flex flex-col items-center mb-5">
          <p className="text-xs text-muted-foreground mb-2">Joker Card</p>
          {joker ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-22 rounded-lg border-2 border-gold bg-gold/10 flex flex-col items-center justify-center p-2 shadow-gold"
            >
              <span
                className={`text-2xl font-black ${
                  joker.suit === "♥" || joker.suit === "♦"
                    ? "text-red-400"
                    : "text-slate-200"
                }`}
              >
                {joker.rank}
              </span>
              <span
                className={`text-lg ${
                  joker.suit === "♥" || joker.suit === "♦"
                    ? "text-red-400"
                    : "text-slate-200"
                }`}
              >
                {joker.suit}
              </span>
            </motion.div>
          ) : (
            <div className="w-16 h-20 rounded-lg border-2 border-gold/30 bg-gold/5 flex items-center justify-center text-3xl">
              🎴
            </div>
          )}
        </div>

        {/* Andar / Bahar columns */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(["Andar", "Bahar"] as const).map((s) => (
            <div key={s}>
              <div
                className={`text-center text-xs font-bold mb-2 py-1 rounded-sm border ${
                  winnerSide === s
                    ? "border-neon bg-neon/10 text-neon"
                    : s === "Andar"
                      ? "border-blue-500/40 text-blue-400"
                      : "border-orange-500/40 text-orange-400"
                }`}
              >
                {s} {winnerSide === s && "✓"}
              </div>
              <div className="flex flex-wrap gap-1 min-h-[60px]">
                <AnimatePresence>
                  {(s === "Andar" ? andarCards : baharCards).map((card, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable card position
                    <SmallCard key={i} card={card} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
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
                  ? `🎉 Won ${fmt(result.amount * 1.95)}!`
                  : `Lost ${fmt(result.amount)}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side select */}
        <div className="flex gap-2 mb-3">
          {(["Andar", "Bahar"] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSide(s)}
              disabled={isPlaying}
              className={`flex-1 py-2.5 text-sm font-bold border rounded-sm transition-all disabled:opacity-40 ${
                side === s
                  ? s === "Andar"
                    ? "border-blue-500 bg-blue-500/15 text-blue-400"
                    : "border-orange-500 bg-orange-500/15 text-orange-400"
                  : "border-border bg-secondary text-muted-foreground hover:border-border/80"
              }`}
            >
              {s === "Andar" ? "⬅ Andar" : "Bahar ➡"}
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
              disabled={isPlaying}
              className={`flex-1 py-1.5 text-xs font-bold border rounded-sm transition-all disabled:opacity-40 ${
                betAmount === String(p)
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-secondary text-muted-foreground hover:border-gold/50"
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
            disabled={isPlaying}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {user ? (
          result ? (
            <Button
              onClick={() => {
                reset();
              }}
              className="w-full bg-secondary border border-border font-bold rounded-sm h-11 hover:border-gold/50"
            >
              🎴 Play Again
            </Button>
          ) : (
            <Button
              onClick={handlePlay}
              disabled={isPlaying}
              className="w-full font-bold rounded-sm h-11 border"
              style={{
                background: "oklch(0.65 0.25 290 / 15%)",
                borderColor: "oklch(0.65 0.25 290)",
                color: "oklch(0.65 0.25 290)",
              }}
            >
              {isPlaying ? "Dealing..." : "🎴 Place Bet"}
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
