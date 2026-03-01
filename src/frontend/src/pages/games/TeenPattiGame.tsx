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
  A: 14,
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
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: RANK_VALUES[rank] });
    }
  }
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

type HandRank =
  | "Trail"
  | "Pure Sequence"
  | "Sequence"
  | "Color"
  | "Pair"
  | "High Card";

interface HandResult {
  rank: HandRank;
  multiplier: number;
}

function evaluateHand(cards: Card[]): HandResult {
  const [a, b, c] = cards.sort((x, y) => y.value - x.value);
  const sameSuit = a.suit === b.suit && b.suit === c.suit;
  const vals = [a.value, b.value, c.value];
  const isSequence = vals[0] - vals[1] === 1 && vals[1] - vals[2] === 1;
  // Ace-2-3 sequence
  const isAceLow = vals[0] === 14 && vals[1] === 3 && vals[2] === 2;

  if (a.rank === b.rank && b.rank === c.rank)
    return { rank: "Trail", multiplier: 5 };
  if (sameSuit && (isSequence || isAceLow))
    return { rank: "Pure Sequence", multiplier: 4 };
  if (isSequence || isAceLow) return { rank: "Sequence", multiplier: 3 };
  if (sameSuit) return { rank: "Color", multiplier: 2 };
  if (a.rank === b.rank || b.rank === c.rank || a.rank === c.rank)
    return { rank: "Pair", multiplier: 1.5 };
  return { rank: "High Card", multiplier: 0 };
}

function suitColor(suit: Suit) {
  return suit === "♥" || suit === "♦" ? "text-red-400" : "text-slate-200";
}

function CardDisplay({
  card,
  faceDown = false,
}: {
  card?: Card;
  faceDown?: boolean;
}) {
  if (faceDown || !card) {
    return (
      <div className="w-14 h-20 rounded border-2 border-purple/50 bg-purple/10 flex items-center justify-center">
        <span className="text-purple text-2xl">🂠</span>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-14 h-20 rounded border-2 border-border bg-card flex flex-col items-center justify-center gap-0.5 shadow-md"
    >
      <span
        className={`text-xs font-black leading-none ${suitColor(card.suit)}`}
      >
        {card.rank}
      </span>
      <span className={`text-xl leading-none ${suitColor(card.suit)}`}>
        {card.suit}
      </span>
    </motion.div>
  );
}

const HAND_RANK_COLORS: Record<HandRank, string> = {
  Trail: "text-yellow-400",
  "Pure Sequence": "text-purple",
  Sequence: "text-neon",
  Color: "text-blue-400",
  Pair: "text-gold",
  "High Card": "text-loss",
};

export function TeenPattiGame() {
  const { user, withdraw, deposit, addTransaction, setCurrentPage } =
    useBetting();
  const [betAmount, setBetAmount] = useState("10");
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [result, setResult] = useState<null | {
    playerHand: HandResult;
    dealerHand: HandResult;
    won: boolean;
    amount: number;
    winAmount: number;
  }>(null);
  const [showDealer, setShowDealer] = useState(false);

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
    setShowDealer(false);

    const deck = shuffle(buildDeck());
    const pCards = deck.slice(0, 3);
    const dCards = deck.slice(3, 6);

    setPlayerCards(pCards);
    setDealerCards(dCards);

    setTimeout(() => {
      const playerHand = evaluateHand(pCards);
      const dealerHand = evaluateHand(dCards);

      const won =
        playerHand.multiplier > 0 &&
        playerHand.multiplier >= dealerHand.multiplier;
      const winAmount = won
        ? Number.parseFloat((amount * playerHand.multiplier).toFixed(2))
        : 0;

      if (won && winAmount > 0) {
        deposit(winAmount);
        addTransaction(
          "Casino Win",
          winAmount,
          `Teen Patti — ${playerHand.rank} (${playerHand.multiplier}x)`,
          true,
        );
        toast.success(`🃏 ${playerHand.rank}! Won ${fmt(winAmount)}!`);
      } else {
        addTransaction(
          "Casino Loss",
          amount,
          `Teen Patti — ${playerHand.rank} vs Dealer ${dealerHand.rank}`,
          false,
        );
        toast.error(`Dealer wins with ${dealerHand.rank}`);
      }

      setResult({ playerHand, dealerHand, won, amount, winAmount });
      setShowDealer(true);
      setIsDealing(false);
    }, 1200);
  };

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      {/* Header */}
      <div
        className="p-5 border-b border-border flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.02 290 / 60%) 0%, oklch(0.13 0.01 264) 100%)",
        }}
      >
        <div>
          <h2 className="font-display font-bold text-lg">🃏 Teen Patti</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indian Poker · Trail wins 5x
          </p>
        </div>
        {user && (
          <span className="text-sm text-gold font-bold">
            {fmt(user.balance)}
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Hand rank guide */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {(
            [
              ["Trail", "5x", "text-yellow-400"],
              ["Pure Seq", "4x", "text-purple"],
              ["Sequence", "3x", "text-neon"],
              ["Color", "2x", "text-blue-400"],
              ["Pair", "1.5x", "text-gold"],
            ] as const
          ).map(([label, mult, color]) => (
            <span
              key={label}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-sm bg-secondary border border-border ${color}`}
            >
              {label} {mult}
            </span>
          ))}
        </div>

        {/* Cards area */}
        <div className="space-y-4 mb-5">
          {/* Player cards */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Your Hand
            </p>
            <div className="flex gap-2">
              {playerCards.length > 0
                ? playerCards.map((card, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable positional cards
                    <CardDisplay key={i} card={card} />
                  ))
                : [0, 1, 2].map((i) => <CardDisplay key={i} faceDown />)}
            </div>
          </div>

          {/* Dealer cards */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Dealer Hand
            </p>
            <div className="flex gap-2">
              {dealerCards.length > 0 && showDealer
                ? dealerCards.map((card, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable positional cards
                    <CardDisplay key={i} card={card} />
                  ))
                : dealerCards.length > 0
                  ? // biome-ignore lint/suspicious/noArrayIndexKey: stable face-down placeholders
                    dealerCards.map((_, i) => <CardDisplay key={i} faceDown />)
                  : [0, 1, 2].map((i) => <CardDisplay key={i} faceDown />)}
            </div>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-3 rounded-sm border ${
                result.won
                  ? "bg-neon/10 border-neon/30"
                  : "bg-loss/10 border-loss/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-xs font-bold ${HAND_RANK_COLORS[result.playerHand.rank]}`}
                  >
                    You: {result.playerHand.rank}
                  </span>
                  <span className="text-xs text-muted-foreground mx-2">vs</span>
                  <span
                    className={`text-xs font-bold ${HAND_RANK_COLORS[result.dealerHand.rank]}`}
                  >
                    Dealer: {result.dealerHand.rank}
                  </span>
                </div>
                <span
                  className={`font-bold text-sm ${result.won ? "text-neon" : "text-loss"}`}
                >
                  {result.won
                    ? `+${fmt(result.winAmount)}`
                    : `-${fmt(result.amount)}`}
                </span>
              </div>
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
              className={`flex-1 py-1.5 text-xs font-bold border rounded-sm transition-all ${
                betAmount === String(p)
                  ? "border-purple bg-purple/10 text-purple"
                  : "border-border bg-secondary text-muted-foreground hover:border-purple/50"
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

        {user ? (
          <Button
            onClick={handleDeal}
            disabled={isDealing}
            className="w-full font-bold rounded-sm h-11 border"
            style={{
              background: "oklch(0.65 0.25 290 / 15%)",
              borderColor: "oklch(0.65 0.25 290)",
              color: "oklch(0.65 0.25 290)",
            }}
          >
            {isDealing
              ? "Dealing..."
              : result
                ? "🃏 Deal Again"
                : "🃏 Deal Cards"}
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
