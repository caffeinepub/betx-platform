import { Crown, Medal, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useBetting } from "../context/BettingContext";

export function LeaderboardPage() {
  const { leaderboard, user } = useBetting();

  const fmt = (n: number) =>
    `$${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-gold" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3)
      return <Medal className="w-5 h-5" style={{ color: "#cd7f32" }} />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">
        {rank}
      </span>
    );
  };

  const maxWon = leaderboard[0]?.totalWon || 1;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-gold" />
          <h1 className="font-display font-black text-2xl">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Top players by total winnings
        </p>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-10 max-w-lg mx-auto">
          {/* 2nd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-secondary border-2 border-muted-foreground mx-auto mb-2 flex items-center justify-center font-display font-black text-xl">
              {leaderboard[1]?.displayName?.[0] ?? "?"}
            </div>
            <p className="text-sm font-bold truncate">
              {leaderboard[1]?.displayName}
            </p>
            <p className="text-xs text-neon font-bold">
              {fmt(leaderboard[1]?.totalWon ?? 0)}
            </p>
            <div className="mt-2 bg-muted-foreground/20 border border-muted-foreground/30 rounded-sm py-4">
              <Medal className="w-5 h-5 text-muted-foreground mx-auto" />
            </div>
          </motion.div>

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex-1 text-center"
          >
            <Crown className="w-5 h-5 text-gold mx-auto mb-1" />
            <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold mx-auto mb-2 flex items-center justify-center font-display font-black text-2xl">
              {leaderboard[0]?.displayName?.[0] ?? "?"}
            </div>
            <p className="text-sm font-bold truncate">
              {leaderboard[0]?.displayName}
            </p>
            <p className="text-xs text-gold font-bold text-lg">
              {fmt(leaderboard[0]?.totalWon ?? 0)}
            </p>
            <div className="mt-2 bg-gold/10 border border-gold/30 rounded-sm py-6">
              <Crown className="w-6 h-6 text-gold mx-auto" />
            </div>
          </motion.div>

          {/* 3rd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 text-center"
          >
            <div
              className="w-14 h-14 rounded-full bg-secondary border-2 mx-auto mb-2 flex items-center justify-center font-display font-black text-xl"
              style={{ borderColor: "#cd7f32" }}
            >
              {leaderboard[2]?.displayName?.[0] ?? "?"}
            </div>
            <p className="text-sm font-bold truncate">
              {leaderboard[2]?.displayName}
            </p>
            <p className="text-xs text-neon font-bold">
              {fmt(leaderboard[2]?.totalWon ?? 0)}
            </p>
            <div
              className="mt-2 bg-secondary border rounded-sm py-3"
              style={{ borderColor: "#cd7f32" + "44" }}
            >
              <Medal className="w-5 h-5 mx-auto" style={{ color: "#cd7f32" }} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Full table */}
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-muted-foreground">
            Top 10 Players
          </h2>
        </div>
        <div className="divide-y divide-border">
          {leaderboard.map((entry, idx) => {
            const isCurrentUser = user?.username === entry.username;
            const pct = Math.round((entry.totalWon / maxWon) * 100);
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`flex items-center gap-4 px-4 py-3 ${
                  isCurrentUser ? "bg-neon/5 border-l-2 border-neon" : ""
                } ${entry.rank === 1 ? "bg-gold/5" : ""}`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  {rankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-sm flex items-center justify-center font-display font-black text-sm flex-shrink-0 ${
                    entry.rank === 1
                      ? "bg-gold/20 text-gold"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {entry.displayName[0].toUpperCase()}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-semibold text-sm ${isCurrentUser ? "text-neon" : ""}`}
                    >
                      {entry.displayName}
                    </p>
                    {isCurrentUser && (
                      <span className="text-[10px] bg-neon/20 text-neon px-1.5 py-0.5 rounded-sm font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.04 + 0.3 }}
                        className={`h-full rounded-full ${
                          entry.rank === 1 ? "bg-gold" : "bg-neon/50"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {entry.totalBets} bets
                    </span>
                  </div>
                </div>

                {/* Total won */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-display font-bold text-sm ${
                      entry.rank === 1 ? "text-gold" : "text-neon"
                    }`}
                  >
                    {fmt(entry.totalWon)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">total won</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {user && !leaderboard.find((e) => e.username === user.username) && (
        <div className="max-w-2xl mx-auto mt-4 p-3 bg-secondary border border-border rounded-sm text-center">
          <p className="text-sm text-muted-foreground">
            Keep betting to appear on the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}
