import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Download,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type BetStatus, useBetting } from "../context/BettingContext";

type TabFilter = "Open" | "Settled" | "All";

export function MyBetsPage() {
  const { bets, user, setCurrentPage } = useBetting();
  const [activeTab, setActiveTab] = useState<TabFilter>("All");

  if (!user) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-16 flex flex-col items-center justify-center gap-4">
        <Receipt className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="font-display font-bold text-xl mb-2">
            Log in to see your bets
          </h2>
          <p className="text-muted-foreground text-sm">
            Track all your open and settled bets in one place
          </p>
        </div>
      </div>
    );
  }

  const filteredBets = bets.filter((bet) => {
    if (activeTab === "Open") return bet.status === "Pending";
    if (activeTab === "Settled")
      return bet.status === "Won" || bet.status === "Lost";
    return true;
  });

  const totalWon = bets
    .filter((b) => b.status === "Won")
    .reduce((sum, b) => sum + b.potentialWin, 0);
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const pendingBets = bets.filter((b) => b.status === "Pending").length;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const downloadBetsCSV = () => {
    const headers = [
      "Event",
      "Selection",
      "Odds",
      "Stake",
      "Potential Win",
      "Status",
      "Placed At",
    ];
    const rows = bets.map((b) => [
      `"${b.eventName}"`,
      b.selectionName,
      b.odds.toFixed(2),
      b.stake.toFixed(2),
      b.potentialWin.toFixed(2),
      b.status,
      new Date(b.placedAt).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "betx-bets.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bet history downloaded!");
  };

  const statusBadge = (status: BetStatus) => {
    const map = {
      Won: "bg-win/15 text-win border-win/30",
      Lost: "bg-loss/15 text-loss border-loss/30",
      Pending: "bg-gold/15 text-gold border-gold/30",
      Cancelled: "bg-muted text-muted-foreground border-border",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold border rounded-sm ${map[status]}`}
      >
        {status === "Won" && <TrendingUp className="w-3 h-3" />}
        {status === "Lost" && <TrendingDown className="w-3 h-3" />}
        {status === "Pending" && <Clock className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl">My Bets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your betting history
          </p>
        </div>
        {bets.length > 0 && (
          <Button
            onClick={downloadBetsCSV}
            variant="outline"
            size="sm"
            className="border-neon/40 text-neon hover:bg-neon/10 rounded-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download CSV
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Bets",
            value: bets.length,
            color: "text-foreground",
          },
          { label: "Open Bets", value: pendingBets, color: "text-gold" },
          {
            label: "Total Won",
            value: fmt(totalWon),
            color: "text-win",
          },
          {
            label: "Total Staked",
            value: fmt(totalStaked),
            color: "text-muted-foreground",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-sm p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className={`font-display font-black text-xl ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary rounded-sm p-0.5 w-fit mb-5">
        {(["All", "Open", "Settled"] as TabFilter[]).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${
              activeTab === tab
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab === "Open" && pendingBets > 0 && (
              <span className="ml-1.5 bg-gold/20 text-gold text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingBets}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredBets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <Receipt className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">No bets yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Head over to Sports and place your first bet
            </p>
            <button
              type="button"
              onClick={() => setCurrentPage("home")}
              className="mt-4 text-neon text-sm font-medium hover:underline"
            >
              Browse Events →
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium">
                    Event
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">
                    Selection
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">
                    Odds
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">
                    Stake
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">
                    Potential Win
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">
                    Placed
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBets.map((bet) => (
                  <TableRow
                    key={bet.id}
                    className={`border-border ${
                      bet.status === "Won"
                        ? "bg-win/5"
                        : bet.status === "Lost"
                          ? "bg-loss/5"
                          : ""
                    }`}
                  >
                    <TableCell className="text-sm font-medium max-w-[180px]">
                      <span className="truncate block">{bet.eventName}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bet.selectionName}
                    </TableCell>
                    <TableCell className="text-sm text-right font-bold text-gold">
                      {bet.odds.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {fmt(bet.stake)}
                    </TableCell>
                    <TableCell
                      className={`text-sm text-right font-semibold ${
                        bet.status === "Won"
                          ? "text-win"
                          : bet.status === "Lost"
                            ? "text-loss line-through text-muted-foreground"
                            : "text-neon"
                      }`}
                    >
                      {fmt(bet.potentialWin)}
                    </TableCell>
                    <TableCell>{statusBadge(bet.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(bet.placedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
