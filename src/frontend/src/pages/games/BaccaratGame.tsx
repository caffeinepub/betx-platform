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

const CARD_VALUES: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 0,
  J: 0,
  Q: 0,
  K: 0,
};

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

function handValue(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + CARD_VALUES[c.rank], 0) % 10;
}

function suitColor(suit: Suit) {
  return suit === "♥" || suit === "♦" ? "text-red-400" : "text-slate-200";
}

function CardFace({ card }: { card: Card }) {
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-11 h-16 rounded border border-border bg-card flex flex-col items-center justify-center shadow-md gap-0.5"
    >
      <span
        className={`text-[11px] font-black leading-none ${suitColor(card.suit)}`}
      >
        {card.rank}
      </span>
      <span className={`text-base leading-none ${suitColor(card.suit)}`}>
        {card.suit}
      </span>
    </motion.div>
  );
}

type BetChoice = "Player" | "Banker" | "Tie";
type GameOutcome = "Player" | "Banker" | "Tie";

const BET_OPTIONS: {
  id: BetChoice;
  label: string;
  payout: string;
  color: string;
}[] = [
  {
    id: "Player",
    label: "Player",
    payout: "2x",
    color: "border-blue-500 bg-blue-500/15 text-blue-400",
  },
  {
    id: "Banker",
    label: "Banker",
    payout: "1.95x",
    color: "border-red-500 bg-red-500/15 text-red-400",
  },
  {
    id: "Tie",
    label: "Tie",
    payout: "8x",
    color: "border-gold bg-gold/15 text-gold",
  },
];

export function BaccaratGame() {
  const {
    user,
    withdraw,
    deposit,
    addTransaction,
    setCurrentPage,
    gameSettings,
  } = useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [betChoice, setBetChoice] = useState<BetChoice>("Player");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [result, setResult] = useState<null | {
    outcome: GameOutcome;
    playerVal: number;
    bankerVal: number;
    won: boolean;
    amount: number;
    winAmount: number;
  }>(null);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const handleDeal = () => {
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

    setIsDealing(true);
    setResult(null);
    setPlayerHand([]);
    setBankerHand([]);

    const deck = shuffle(buildDeck());
    let idx = 0;
    const deal = () => deck[idx++];

    const p1 = deal();
    const b1 = deal();
    const p2 = deal();
    const b2 = deal();

    setTimeout(() => setPlayerHand([p1]), 300);
    setTimeout(() => setBankerHand([b1]), 500);
    setTimeout(() => setPlayerHand([p1, p2]), 700);
    setTimeout(() => setBankerHand([b1, b2]), 900);

    setTimeout(() => {
      let pCards = [p1, p2];
      let bCards = [b1, b2];
      const pVal = handValue(pCards);
      const bVal = handValue(bCards);

      // Third card rules (simplified)
      let p3: Card | null = null;
      let b3: Card | null = null;

      if (pVal <= 5 && pVal !== 8 && pVal !== 9 && bVal !== 8 && bVal !== 9) {
        p3 = deal();
        pCards = [...pCards, p3];
      }
      if (bVal <= 5 && bVal !== 8 && bVal !== 9 && pVal !== 8 && pVal !== 9) {
        b3 = deal();
        bCards = [...bCards, b3];
      }

      const finalP = handValue(pCards);
      const finalB = handValue(bCards);

      let outcome: GameOutcome;
      if (finalP === finalB) outcome = "Tie";
      else if (finalP > finalB) outcome = "Player";
      else outcome = "Banker";

      const won = betChoice === outcome;
      let winAmount = 0;
      if (won) {
        const multiplier =
          betChoice === "Tie" ? 8 : betChoice === "Banker" ? 1.95 : 2;
        winAmount = Number.parseFloat((amount * multiplier).toFixed(2));
      }

      if (p3) {
        setTimeout(() => setPlayerHand([p1, p2, p3 as Card]), 1100);
      }
      if (b3) {
        setTimeout(() => setBankerHand([b1, b2, b3 as Card]), 1300);
      }

      setTimeout(
        () => {
          if (won && winAmount > 0) {
            deposit(winAmount);
            addTransaction(
              "Casino Win",
              winAmount,
              `Baccarat — ${outcome} wins (${finalP} vs ${finalB})`,
              true,
            );
            toast.success(`🂡 ${outcome} wins! You won ${fmt(winAmount)}!`);
          } else {
            addTransaction(
              "Casino Loss",
              amount,
              `Baccarat — ${outcome} wins, you bet ${betChoice}`,
              false,
            );
            toast.error(`${outcome} wins. You lost ${fmt(amount)}.`);
          }
          setResult({
            outcome,
            playerVal: finalP,
            bankerVal: finalB,
            won,
            amount,
            winAmount,
          });
          setIsDealing(false);
        },
        p3 || b3 ? 1500 : 1100,
      );
    }, 1000);
  };

  if (gameSettings?.baccarat?.enabled === false) {
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
      <div
        className="p-5 border-b border-border flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.1 0.03 20 / 50%) 0%, oklch(0.13 0.01 264) 100%)",
        }}
      >
        <div>
          <h2 className="font-display font-bold text-lg">🂡 Baccarat</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Player 2x · Banker 1.95x · Tie 8x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Bet choice */}
        <div className="flex gap-2 mb-5">
          {BET_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.id}
              onClick={() => setBetChoice(opt.id)}
              disabled={isDealing}
              className={`flex-1 py-2 text-xs font-bold border rounded-sm transition-all disabled:opacity-40 ${
                betChoice === opt.id
                  ? opt.color
                  : "border-border bg-secondary text-muted-foreground hover:border-border/80"
              }`}
            >
              <div>{opt.label}</div>
              <div className="text-[10px] opacity-70">{opt.payout}</div>
            </button>
          ))}
        </div>

        {/* Hands */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            {
              label: "Player",
              cards: playerHand,
              val: handValue(playerHand),
              color: "text-blue-400",
            },
            {
              label: "Banker",
              cards: bankerHand,
              val: handValue(bankerHand),
              color: "text-red-400",
            },
          ].map(({ label, cards, val, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${color}`}>{label}</span>
                {cards.length > 0 && (
                  <span className="text-lg font-black text-gold">{val}</span>
                )}
              </div>
              <div className="flex gap-1.5 min-h-[64px] flex-wrap">
                <AnimatePresence>
                  {cards.map((card, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable card position
                    <CardFace key={i} card={card} />
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
                {result.outcome} wins ({result.playerVal} vs {result.bankerVal})
                {" · "}
                {result.won
                  ? `+${fmt(result.winAmount)}`
                  : `-${fmt(result.amount)}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet presets */}
        <div className="flex gap-2 mb-3">
          {BET_PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setBetAmount(String(p))}
              disabled={isDealing}
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
            disabled={isDealing}
            className="pl-7 bg-secondary border-border rounded-sm"
            placeholder="Bet amount"
          />
        </div>

        {user ? (
          <Button
            onClick={handleDeal}
            disabled={isDealing}
            className="w-full bg-gold/10 border border-gold text-gold hover:bg-gold/20 font-bold rounded-sm h-11"
          >
            {isDealing
              ? "Dealing..."
              : result
                ? "🂡 Deal Again"
                : "🂡 Deal Cards"}
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
