import { Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useBetting } from "../context/BettingContext";
import { ColorPredictionGame } from "./games/ColorPredictionGame";

export function PredictionPage() {
  const { user, setCurrentPage } = useBetting();

  const formatBalance = (balance: number) =>
    `₹${balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  return (
    <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎯</span>
              <h1
                className="font-display font-black text-2xl lg:text-3xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.22 22), oklch(0.75 0.22 290), oklch(0.85 0.2 145))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Win Go — Color Prediction
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Predict the color and number. Win big every minute!
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => setCurrentPage("wallet")}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-sm text-sm self-start sm:self-auto"
            >
              <Wallet className="w-4 h-4 text-gold" />
              <span className="font-bold text-gold">
                {formatBalance(user.balance)}
              </span>
            </button>
          )}
        </div>

        {/* Payout info banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 rounded-sm border overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.14 0.015 264), oklch(0.12 0.01 264))",
            borderColor: "oklch(0.22 0.015 264)",
          }}
        >
          <div className="flex items-center flex-wrap gap-0 text-center">
            <div
              className="flex-1 px-4 py-3 border-r"
              style={{ borderColor: "oklch(0.22 0.015 264)" }}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Red / Green
              </p>
              <p
                className="text-lg font-black"
                style={{ color: "oklch(0.75 0.2 145)" }}
              >
                2×
              </p>
            </div>
            <div
              className="flex-1 px-4 py-3 border-r"
              style={{ borderColor: "oklch(0.22 0.015 264)" }}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Violet
              </p>
              <p
                className="text-lg font-black"
                style={{ color: "oklch(0.75 0.22 290)" }}
              >
                4.5×
              </p>
            </div>
            <div className="flex-1 px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Number
              </p>
              <p
                className="text-lg font-black"
                style={{ color: "oklch(0.82 0.2 68)" }}
              >
                9×
              </p>
            </div>
          </div>
        </motion.div>

        {/* Number color guide */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-3 p-3 bg-card border border-border rounded-sm"
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
            Number Color Guide
          </p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const colorMap: Record<number, { bg: string; label: string }> = {
                0: { bg: "oklch(0.6 0.25 290 / 20%)", label: "Violet+Red" },
                1: { bg: "oklch(0.75 0.2 145 / 20%)", label: "Green" },
                2: { bg: "oklch(0.65 0.22 22 / 20%)", label: "Red" },
                3: { bg: "oklch(0.75 0.2 145 / 20%)", label: "Green" },
                4: { bg: "oklch(0.65 0.22 22 / 20%)", label: "Red" },
                5: { bg: "oklch(0.6 0.25 290 / 20%)", label: "Violet+Green" },
                6: { bg: "oklch(0.65 0.22 22 / 20%)", label: "Red" },
                7: { bg: "oklch(0.75 0.2 145 / 20%)", label: "Green" },
                8: { bg: "oklch(0.65 0.22 22 / 20%)", label: "Red" },
                9: { bg: "oklch(0.75 0.2 145 / 20%)", label: "Green" },
              };
              const borderMap: Record<number, string> = {
                0: "oklch(0.6 0.25 290 / 50%)",
                1: "oklch(0.75 0.2 145 / 50%)",
                2: "oklch(0.65 0.22 22 / 50%)",
                3: "oklch(0.75 0.2 145 / 50%)",
                4: "oklch(0.65 0.22 22 / 50%)",
                5: "oklch(0.6 0.25 290 / 50%)",
                6: "oklch(0.65 0.22 22 / 50%)",
                7: "oklch(0.75 0.2 145 / 50%)",
                8: "oklch(0.65 0.22 22 / 50%)",
                9: "oklch(0.75 0.2 145 / 50%)",
              };
              return (
                <div
                  key={n}
                  className="flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-medium"
                  style={{
                    background: colorMap[n].bg,
                    borderColor: borderMap[n],
                  }}
                >
                  <span className="font-black text-foreground">{n}</span>
                  <span className="text-muted-foreground">
                    {colorMap[n].label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Main game */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ColorPredictionGame />
      </motion.div>
    </div>
  );
}
