import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  CheckCircle,
  CreditCard,
  Database,
  Gamepad2,
  Globe,
  Image,
  PlusCircle,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type EventStatus,
  type GameSettings,
  type PaymentMethodConfig,
  type PaymentSettings,
  type Sport,
  type WebsiteSettings,
  useBetting,
} from "../context/BettingContext";

type AdminTab =
  | "overview"
  | "events"
  | "bets"
  | "transactions"
  | "users"
  | "payments"
  | "website"
  | "games";

export function AdminPage() {
  const {
    user,
    users: ctxUsers,
    events,
    bets,
    transactions,
    addEvent,
    settleEvent,
    seedDemoData,
    updateUserBalance,
    setCurrentPage,
    paymentSettings,
    updatePaymentSettings,
    websiteSettings,
    updateWebsiteSettings,
    gameSettings,
    updateGameSettings,
  } = useBetting();

  // Always read fresh users from localStorage so admin sees all registered users
  const [freshUsers, setFreshUsers] = useState<typeof ctxUsers>(() => {
    try {
      return JSON.parse(localStorage.getItem("rangbaazi_users") || "[]");
    } catch {
      return ctxUsers;
    }
  });

  // Merge context users with fresh localStorage users (union by id)
  const users = (() => {
    const map = new Map<string, (typeof ctxUsers)[0]>();
    for (const u of freshUsers) map.set(u.id, u);
    for (const u of ctxUsers) map.set(u.id, u);
    return Array.from(map.values());
  })();

  const refreshUsers = () => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("rangbaazi_users") || "[]",
      );
      setFreshUsers(stored);
      toast.success(`Users refreshed — ${stored.length} accounts found`);
    } catch {
      toast.error("Could not refresh users");
    }
  };

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [settleResult, setSettleResult] = useState<
    Record<string, "Home" | "Draw" | "Away">
  >({});

  const [newEvent, setNewEvent] = useState({
    sport: "Football" as Sport,
    league: "",
    homeTeam: "",
    awayTeam: "",
    homeFlag: "⚽",
    awayFlag: "⚽",
    startTime: "Today 20:00",
    status: "Upcoming" as EventStatus,
    oddsHome: "2.00",
    oddsDraw: "3.40",
    oddsAway: "3.00",
  });

  if (!user?.isAdmin) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-16 flex flex-col items-center justify-center gap-4">
        <ShieldCheck className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="font-display font-bold text-xl mb-2">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground text-sm">
            Only the admin account can access this panel. Please login with your
            admin credentials.
          </p>
          <button
            type="button"
            onClick={() => setCurrentPage("home")}
            className="mt-4 text-neon text-sm font-medium hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalWagered = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalPayouts = bets
    .filter((b) => b.status === "Won")
    .reduce((sum, b) => sum + b.potentialWin, 0);
  const profit = totalWagered - totalPayouts;
  const liveEvents = events.filter((e) => e.status === "Live").length;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.homeTeam || !newEvent.awayTeam || !newEvent.league) {
      toast.error("Fill all required fields");
      return;
    }
    addEvent({
      sport: newEvent.sport,
      league: newEvent.league,
      homeTeam: newEvent.homeTeam,
      awayTeam: newEvent.awayTeam,
      homeFlag: newEvent.homeFlag,
      awayFlag: newEvent.awayFlag,
      startTime: newEvent.startTime,
      status: newEvent.status,
      odds: {
        home: Number.parseFloat(newEvent.oddsHome) || 2,
        draw: Number.parseFloat(newEvent.oddsDraw) || 3.4,
        away: Number.parseFloat(newEvent.oddsAway) || 3,
      },
    });
    toast.success("Event created!");
    setNewEvent((p) => ({
      ...p,
      league: "",
      homeTeam: "",
      awayTeam: "",
    }));
  };

  const handleSettle = (eventId: string) => {
    const result = settleResult[eventId];
    if (!result) {
      toast.error("Select a result first");
      return;
    }
    settleEvent(eventId, result);
    toast.success("Event settled!");
  };

  const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "events", label: "Events", icon: TrendingUp },
    { id: "bets", label: "Bets", icon: CheckCircle },
    { id: "transactions", label: "Transactions", icon: Wallet },
    { id: "users", label: "Users", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "website", label: "Website", icon: Globe },
    { id: "games", label: "Games", icon: Gamepad2 },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-neon" />
          <div>
            <h1 className="font-display font-black text-2xl">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Platform management — logged in as {user.displayName}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            seedDemoData();
            toast.success("Demo events seeded!");
          }}
          variant="outline"
          size="sm"
          className="border-neon/50 text-neon hover:bg-neon/10 rounded-sm"
        >
          <Database className="w-4 h-4 mr-1.5" />
          Seed Demo Data
        </Button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-secondary rounded-sm p-0.5 w-fit mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                label: "Total Users",
                value: users.length,
                icon: Users,
                color: "text-neon",
              },
              {
                label: "Total Bets",
                value: bets.length,
                icon: TrendingUp,
                color: "text-gold",
              },
              {
                label: "Total Wagered",
                value: fmt(totalWagered),
                icon: Wallet,
                color: "text-foreground",
              },
              {
                label: "Platform Profit",
                value: fmt(profit),
                icon: TrendingUp,
                color: profit >= 0 ? "text-win" : "text-loss",
              },
              {
                label: "Live Events",
                value: liveEvents,
                icon: Activity,
                color: "text-live",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-sm p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <p className={`font-display font-black text-xl ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-sm p-4">
              <h3 className="font-display font-bold mb-3">Recent Bets</h3>
              <div className="space-y-2">
                {bets.slice(0, 5).map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {bet.eventName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{fmt(bet.stake)}</span>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${
                          bet.status === "Won"
                            ? "bg-win/10 text-win"
                            : bet.status === "Lost"
                              ? "bg-loss/10 text-loss"
                              : "bg-gold/10 text-gold"
                        }`}
                      >
                        {bet.status}
                      </span>
                    </div>
                  </div>
                ))}
                {bets.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No bets placed yet
                  </p>
                )}
              </div>
            </div>
            <div className="bg-card border border-border rounded-sm p-4">
              <h3 className="font-display font-bold mb-3">Event Status</h3>
              <div className="space-y-2">
                {(["Live", "Upcoming", "Finished"] as EventStatus[]).map(
                  (status) => {
                    const count = events.filter(
                      (e) => e.status === status,
                    ).length;
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">
                          {status}
                        </span>
                        <span className="font-bold text-sm">{count}</span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Management */}
      {activeTab === "events" && (
        <div className="space-y-6">
          {/* Create event form */}
          <div className="bg-card border border-border rounded-sm p-5">
            <h2 className="font-display font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-neon" />
              Create Event
            </h2>
            <form onSubmit={handleAddEvent}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-xs mb-1 block">Sport</Label>
                  <Select
                    value={newEvent.sport}
                    onValueChange={(v) =>
                      setNewEvent((p) => ({ ...p, sport: v as Sport }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-secondary border-border rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {["Football", "Basketball", "Tennis", "Cricket"].map(
                        (s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">League</Label>
                  <Input
                    value={newEvent.league}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, league: e.target.value }))
                    }
                    placeholder="e.g. Premier League"
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Status</Label>
                  <Select
                    value={newEvent.status}
                    onValueChange={(v) =>
                      setNewEvent((p) => ({
                        ...p,
                        status: v as EventStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-secondary border-border rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {["Upcoming", "Live"].map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Home Team</Label>
                  <Input
                    value={newEvent.homeTeam}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        homeTeam: e.target.value,
                      }))
                    }
                    placeholder="Home team name"
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Away Team</Label>
                  <Input
                    value={newEvent.awayTeam}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        awayTeam: e.target.value,
                      }))
                    }
                    placeholder="Away team name"
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Start Time</Label>
                  <Input
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        startTime: e.target.value,
                      }))
                    }
                    placeholder="e.g. Today 20:00"
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Home Odds</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newEvent.oddsHome}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        oddsHome: e.target.value,
                      }))
                    }
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Draw Odds</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newEvent.oddsDraw}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        oddsDraw: e.target.value,
                      }))
                    }
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Away Odds</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newEvent.oddsAway}
                    onChange={(e) =>
                      setNewEvent((p) => ({
                        ...p,
                        oddsAway: e.target.value,
                      }))
                    }
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Create Event
              </Button>
            </form>
          </div>

          {/* Events list */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-bold">
                All Events ({events.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground">
                      Event
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      League
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Odds
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Settle
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="border-border">
                      <TableCell className="text-sm font-medium">
                        {event.homeTeam} vs {event.awayTeam}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {event.league}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${
                            event.status === "Live"
                              ? "bg-live/10 text-live"
                              : event.status === "Upcoming"
                                ? "bg-gold/10 text-gold"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {event.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gold font-bold">
                        {event.odds.home} / {event.odds.draw} /{" "}
                        {event.odds.away}
                      </TableCell>
                      <TableCell>
                        {event.status !== "Finished" ? (
                          <div className="flex items-center gap-1">
                            <Select
                              value={settleResult[event.id] ?? ""}
                              onValueChange={(v) =>
                                setSettleResult((p) => ({
                                  ...p,
                                  [event.id]: v as "Home" | "Draw" | "Away",
                                }))
                              }
                            >
                              <SelectTrigger className="h-7 w-24 text-xs bg-secondary border-border rounded-sm">
                                <SelectValue placeholder="Result" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="Home" className="text-xs">
                                  Home
                                </SelectItem>
                                <SelectItem value="Draw" className="text-xs">
                                  Draw
                                </SelectItem>
                                <SelectItem value="Away" className="text-xs">
                                  Away
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleSettle(event.id)}
                              className="h-7 text-xs bg-neon text-panel-dark hover:bg-neon/90 rounded-sm px-2"
                            >
                              Settle
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Finished
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Bets Overview */}
      {activeTab === "bets" && (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold">All Bets ({bets.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">
                    Event
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Selection
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Odds
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Stake
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Payout
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bets.map((bet) => (
                  <TableRow key={bet.id} className="border-border">
                    <TableCell className="text-sm max-w-[180px]">
                      <span className="truncate block">{bet.eventName}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {bet.selectionName}
                    </TableCell>
                    <TableCell className="text-xs text-right text-gold font-bold">
                      {bet.odds.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {fmt(bet.stake)}
                    </TableCell>
                    <TableCell className="text-xs text-right text-neon font-bold">
                      {fmt(bet.potentialWin)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${
                          bet.status === "Won"
                            ? "bg-win/10 text-win"
                            : bet.status === "Lost"
                              ? "bg-loss/10 text-loss"
                              : "bg-gold/10 text-gold"
                        }`}
                      >
                        {bet.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {bets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground text-sm py-8"
                    >
                      No bets placed yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeTab === "transactions" && (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold">
              All Transactions ({transactions.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Description
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-border">
                    <TableCell className="text-xs font-medium">
                      {tx.type}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      <span className="truncate block">{tx.description}</span>
                    </TableCell>
                    <TableCell
                      className={`text-xs text-right font-bold ${
                        tx.isCredit ? "text-win" : "text-loss"
                      }`}
                    >
                      {tx.isCredit ? "+" : "-"}
                      {fmt(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-muted-foreground">
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground text-sm py-8"
                    >
                      No transactions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold">
              All Users ({users.length})
            </h2>
            <Button
              onClick={refreshUsers}
              variant="outline"
              size="sm"
              className="border-neon/40 text-neon hover:bg-neon/10 rounded-sm text-xs"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
          {users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No registered users yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground">
                      User
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Username
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Balance
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Adjust Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onUpdateBalance={updateUserBalance}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === "payments" && (
        <PaymentSettingsPanel
          paymentSettings={paymentSettings}
          onSave={updatePaymentSettings}
        />
      )}

      {/* Website Settings */}
      {activeTab === "website" && (
        <WebsiteSettingsPanel
          websiteSettings={websiteSettings}
          onSave={updateWebsiteSettings}
        />
      )}

      {/* Games Control */}
      {activeTab === "games" && (
        <GamesControlPanel
          gameSettings={gameSettings}
          onSave={updateGameSettings}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  onUpdateBalance,
}: {
  user: {
    id: string;
    displayName: string;
    username: string;
    balance: number;
    isAdmin: boolean;
  };
  onUpdateBalance: (userId: string, balance: number) => void;
}) {
  const [adjustAmount, setAdjustAmount] = useState("");
  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  const handleAdjust = () => {
    const amount = Number.parseFloat(adjustAmount);
    if (!amount) return;
    onUpdateBalance(user.id, Math.max(0, user.balance + amount));
    toast.success(`Balance adjusted by ${fmt(amount)}`);
    setAdjustAmount("");
  };

  return (
    <TableRow className="border-border">
      <TableCell className="text-sm font-medium">{user.displayName}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        @{user.username}
      </TableCell>
      <TableCell className="text-sm text-right font-bold text-gold">
        {fmt(user.balance)}
      </TableCell>
      <TableCell>
        <span
          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${
            user.isAdmin
              ? "bg-neon/10 text-neon"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {user.isAdmin ? "Admin" : "User"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="±amount"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="h-7 w-24 text-xs bg-secondary border-border rounded-sm"
          />
          <Button
            size="sm"
            onClick={handleAdjust}
            className="h-7 text-xs bg-secondary border border-border hover:border-neon/50 rounded-sm px-2"
          >
            Apply
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ================================================================
// GAMES CONTROL PANEL
// ================================================================

const GAME_EMOJIS: Record<string, string> = {
  aviator: "✈️",
  slots: "🎰",
  fishing: "🎣",
  mines: "💣",
  roulette: "🎡",
  plinko: "🎯",
  wingo: "🎨",
  teenPatti: "🃏",
  andarBahar: "🀄",
  baccarat: "🎴",
  dragonTiger: "🐉",
};

function GamesControlPanel({
  gameSettings,
  onSave,
}: {
  gameSettings: GameSettings;
  onSave: (settings: GameSettings) => void;
}) {
  const [local, setLocal] = useState<GameSettings>(() =>
    JSON.parse(JSON.stringify(gameSettings)),
  );

  const updateGame = (
    gameId: string,
    field: string,
    value: boolean | number | string | null,
  ) => {
    setLocal((prev) => ({
      ...prev,
      [gameId]: { ...prev[gameId], [field]: value },
    }));
  };

  const handleSave = () => {
    onSave(local);
    toast.success("Game settings saved!");
  };

  const gameIds = Object.keys(local);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-neon" />
          <div>
            <h2 className="font-display font-bold text-lg">Games Control</h2>
            <p className="text-xs text-muted-foreground">
              Enable/disable games and configure house edge & forced results
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          data-ocid="admin.games.save_button"
          className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
        >
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {gameIds.map((gameId) => {
          const game = local[gameId];
          const emoji = GAME_EMOJIS[gameId] ?? "🎮";
          return (
            <div
              key={gameId}
              data-ocid="admin.games.card"
              className={`bg-card border rounded-sm overflow-hidden transition-all ${
                game.enabled ? "border-border" : "border-loss/40"
              }`}
            >
              {/* Card header */}
              <div
                className={`flex items-center justify-between px-4 py-3 border-b ${
                  game.enabled
                    ? "border-border bg-secondary/20"
                    : "border-loss/20 bg-loss/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <p className="text-sm font-bold">{game.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {gameId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!game.enabled && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-loss/15 text-loss border border-loss/30">
                      Disabled
                    </span>
                  )}
                  <Label
                    htmlFor={`game-enabled-${gameId}`}
                    className="text-xs text-muted-foreground sr-only"
                  >
                    {game.enabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id={`game-enabled-${gameId}`}
                    data-ocid="admin.games.toggle"
                    checked={game.enabled}
                    onCheckedChange={(checked) =>
                      updateGame(gameId, "enabled", checked)
                    }
                  />
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 space-y-3">
                {/* House Edge */}
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground w-28 shrink-0">
                    House Edge (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={game.houseEdge}
                    onChange={(e) =>
                      updateGame(
                        gameId,
                        "houseEdge",
                        Math.min(
                          50,
                          Math.max(0, Number.parseFloat(e.target.value) || 0),
                        ),
                      )
                    }
                    data-ocid="admin.games.input"
                    className="h-8 text-xs bg-secondary border-border rounded-sm w-24"
                  />
                  <span className="text-xs text-muted-foreground">(0–50%)</span>
                </div>

                {/* Win Go: Forced Result */}
                {gameId === "wingo" && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground w-28 shrink-0">
                      Force Next Result
                    </Label>
                    <Select
                      value={game.forcedResult ?? "Random"}
                      onValueChange={(v) =>
                        updateGame(gameId, "forcedResult", v)
                      }
                    >
                      <SelectTrigger
                        data-ocid="admin.games.select"
                        className="h-8 text-xs bg-secondary border-border rounded-sm w-32"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Random" className="text-xs">
                          🎲 Random
                        </SelectItem>
                        <SelectItem value="Red" className="text-xs">
                          🔴 Red
                        </SelectItem>
                        <SelectItem value="Green" className="text-xs">
                          🟢 Green
                        </SelectItem>
                        <SelectItem value="Violet" className="text-xs">
                          🟣 Violet
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Aviator: Forced Crash Point */}
                {gameId === "aviator" && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground w-28 shrink-0">
                      Force Crash Point
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={game.forcedCrashPoint ?? 0}
                      onChange={(e) => {
                        const v = Number.parseFloat(e.target.value);
                        updateGame(
                          gameId,
                          "forcedCrashPoint",
                          Number.isNaN(v) || v <= 0 ? null : v,
                        );
                      }}
                      data-ocid="admin.games.input"
                      placeholder="Auto (0 = random)"
                      className="h-8 text-xs bg-secondary border-border rounded-sm w-32"
                    />
                    <span className="text-xs text-muted-foreground">
                      0 = auto
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          onClick={handleSave}
          data-ocid="admin.games.submit_button"
          className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
        >
          Save All Game Settings
        </Button>
      </div>
    </div>
  );
}

// ================================================================
// WEBSITE SETTINGS PANEL
// ================================================================

function WebsiteSettingsPanel({
  websiteSettings,
  onSave,
}: {
  websiteSettings: WebsiteSettings;
  onSave: (settings: WebsiteSettings) => void;
}) {
  const [local, setLocal] = useState<WebsiteSettings>(() =>
    JSON.parse(JSON.stringify(websiteSettings)),
  );

  const set = (key: keyof WebsiteSettings, value: string | number | boolean) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave(local);
    toast.success("Website settings saved!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-neon" />
          <div>
            <h2 className="font-display font-bold text-lg">Website Settings</h2>
            <p className="text-xs text-muted-foreground">
              Manage site identity, limits, bonuses, and support details
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
        >
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Site Identity */}
        <div className="bg-card border border-border rounded-sm p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-neon" />
            Site Identity
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Site Name
              </Label>
              <Input
                value={local.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                className="h-8 text-xs bg-secondary border-border rounded-sm"
                placeholder="e.g. RangBaazi"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Tagline
              </Label>
              <Input
                value={local.siteTagline}
                onChange={(e) => set("siteTagline", e.target.value)}
                className="h-8 text-xs bg-secondary border-border rounded-sm"
                placeholder="e.g. India's Premier Betting Platform"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Logo Text
              </Label>
              <Input
                value={local.logoText}
                onChange={(e) => set("logoText", e.target.value)}
                className="h-8 text-xs bg-secondary border-border rounded-sm"
                placeholder="e.g. RANGBAAZI"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Support Email
              </Label>
              <Input
                value={local.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
                className="h-8 text-xs bg-secondary border-border rounded-sm"
                placeholder="support@betx.app"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Support WhatsApp Number
              </Label>
              <Input
                value={local.supportWhatsApp}
                onChange={(e) => set("supportWhatsApp", e.target.value)}
                className="h-8 text-xs bg-secondary border-border rounded-sm"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Deposit & Withdrawal Limits */}
        <div className="bg-card border border-border rounded-sm p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gold" />
            Deposit & Withdrawal Limits
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Min Deposit (₹)
              </Label>
              <Input
                type="number"
                value={local.minDeposit}
                onChange={(e) =>
                  set("minDeposit", Number.parseInt(e.target.value) || 0)
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Max Deposit (₹)
              </Label>
              <Input
                type="number"
                value={local.maxDeposit}
                onChange={(e) =>
                  set("maxDeposit", Number.parseInt(e.target.value) || 0)
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Min Withdrawal (₹)
              </Label>
              <Input
                type="number"
                value={local.minWithdrawal}
                onChange={(e) =>
                  set("minWithdrawal", Number.parseInt(e.target.value) || 0)
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Max Withdrawal (₹)
              </Label>
              <Input
                type="number"
                value={local.maxWithdrawal}
                onChange={(e) =>
                  set("maxWithdrawal", Number.parseInt(e.target.value) || 0)
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* Bonus Settings */}
        <div className="bg-card border border-border rounded-sm p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neon" />
            Bonus Amounts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Welcome Bonus (₹)
              </Label>
              <Input
                type="number"
                value={local.welcomeBonusAmount}
                onChange={(e) =>
                  set(
                    "welcomeBonusAmount",
                    Number.parseInt(e.target.value) || 0,
                  )
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Daily Bonus (₹)
              </Label>
              <Input
                type="number"
                value={local.dailyBonusAmount}
                onChange={(e) =>
                  set("dailyBonusAmount", Number.parseInt(e.target.value) || 0)
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Referral Bonus (₹)
              </Label>
              <Input
                type="number"
                value={local.referralBonusAmount}
                onChange={(e) =>
                  set(
                    "referralBonusAmount",
                    Number.parseInt(e.target.value) || 0,
                  )
                }
                className="h-8 text-xs bg-secondary border-border rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="bg-card border border-border rounded-sm p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-live" />
            Announcement Banner
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Show announcement to all users
              </Label>
              <Switch
                checked={local.announcementEnabled}
                onCheckedChange={(checked) =>
                  set("announcementEnabled", checked)
                }
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Announcement Text
              </Label>
              <Textarea
                value={local.announcementText}
                onChange={(e) => set("announcementText", e.target.value)}
                className="text-xs bg-secondary border-border rounded-sm min-h-[70px] resize-none"
                placeholder="e.g. New IPL season odds are live! Deposit now and get 100% bonus."
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-card border border-border rounded-sm p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-loss">Maintenance Mode</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, users will see a maintenance message. Admin can
                still access the panel.
              </p>
            </div>
            <Switch
              checked={local.maintenanceMode}
              onCheckedChange={(checked) => set("maintenanceMode", checked)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          onClick={handleSave}
          className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
        >
          Save All Website Settings
        </Button>
      </div>
    </div>
  );
}

// ================================================================
// PAYMENT SETTINGS PANEL
// ================================================================

function PaymentSettingsPanel({
  paymentSettings,
  onSave,
}: {
  paymentSettings: PaymentSettings;
  onSave: (settings: PaymentSettings) => void;
}) {
  const [localSettings, setLocalSettings] = useState<PaymentSettings>(() =>
    JSON.parse(JSON.stringify(paymentSettings)),
  );

  const updateMethod = (
    methodIdx: number,
    field: keyof PaymentMethodConfig,
    value: string | boolean,
  ) => {
    setLocalSettings((prev) => {
      const updated = { ...prev };
      updated.methods = prev.methods.map((m, i) => {
        if (i !== methodIdx) return m;
        return { ...m, [field]: value };
      });
      return updated;
    });
  };

  const updateDetail = (
    methodIdx: number,
    detailIdx: number,
    field: "label" | "value",
    value: string,
  ) => {
    setLocalSettings((prev) => {
      const updated = { ...prev };
      updated.methods = prev.methods.map((m, i) => {
        if (i !== methodIdx) return m;
        const newDetails = m.details.map((d, di) => {
          if (di !== detailIdx) return d;
          return { ...d, [field]: value };
        });
        return { ...m, details: newDetails };
      });
      return updated;
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    toast.success("Payment settings saved!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-neon" />
          <div>
            <h2 className="font-display font-bold text-lg">Payment Settings</h2>
            <p className="text-xs text-muted-foreground">
              Configure payment methods shown to users during deposit/withdrawal
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
        >
          Save Settings
        </Button>
      </div>

      <div className="space-y-4">
        {localSettings.methods.map((method, methodIdx) => (
          <div
            key={method.id}
            className="bg-card border border-border rounded-sm overflow-hidden"
          >
            {/* Method header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <span className="text-lg">{method.icon}</span>
                <div>
                  <p className="text-sm font-bold">{method.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    ID: {method.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`method-active-${method.id}`}
                  className="text-xs text-muted-foreground"
                >
                  {method.active ? "Active" : "Inactive"}
                </Label>
                <Switch
                  id={`method-active-${method.id}`}
                  checked={method.active}
                  onCheckedChange={(checked) =>
                    updateMethod(methodIdx, "active", checked)
                  }
                />
              </div>
            </div>

            {/* Method details */}
            <div className="p-4 space-y-3">
              {/* Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Display Label
                  </Label>
                  <Input
                    value={method.label}
                    onChange={(e) =>
                      updateMethod(methodIdx, "label", e.target.value)
                    }
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                    placeholder="e.g. UPI / PayTM"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Icon (emoji)
                  </Label>
                  <Input
                    value={method.icon}
                    onChange={(e) =>
                      updateMethod(methodIdx, "icon", e.target.value)
                    }
                    className="h-8 text-xs bg-secondary border-border rounded-sm"
                    placeholder="e.g. 📲"
                  />
                </div>
              </div>

              {/* UPI-specific fields */}
              {method.id === "UPI" && (
                <div className="bg-neon/5 border border-neon/20 rounded-sm p-3 space-y-3">
                  <p className="text-xs font-bold text-neon flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    UPI QR Code Settings
                  </p>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      UPI ID (auto-generates QR code)
                    </Label>
                    <Input
                      value={method.upiId ?? ""}
                      onChange={(e) =>
                        updateMethod(methodIdx, "upiId", e.target.value)
                      }
                      className="h-8 text-xs bg-secondary border-border rounded-sm font-mono"
                      placeholder="e.g. yourname@paytm"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Users will see a scannable QR code generated from this UPI
                      ID
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Custom QR Image URL (optional — overrides auto-generated
                      QR)
                    </Label>
                    <Input
                      value={method.qrImageUrl ?? ""}
                      onChange={(e) =>
                        updateMethod(methodIdx, "qrImageUrl", e.target.value)
                      }
                      className="h-8 text-xs bg-secondary border-border rounded-sm"
                      placeholder="https://example.com/your-qr-code.png"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Paste a direct image link to your QR code screenshot.
                      Leave empty to use auto-generated QR.
                    </p>
                  </div>
                </div>
              )}

              {/* Detail lines */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Detail Lines
                </p>
                <div className="space-y-2">
                  {method.details.map((detail, detailIdx) => (
                    <div
                      key={`${method.id}-detail-${detailIdx}`}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
                          Label
                        </Label>
                        <Input
                          value={detail.label}
                          onChange={(e) =>
                            updateDetail(
                              methodIdx,
                              detailIdx,
                              "label",
                              e.target.value,
                            )
                          }
                          className="h-7 text-xs bg-secondary border-border rounded-sm"
                          placeholder="Field label"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
                          Value
                        </Label>
                        <Input
                          value={detail.value}
                          onChange={(e) =>
                            updateDetail(
                              methodIdx,
                              detailIdx,
                              "value",
                              e.target.value,
                            )
                          }
                          className="h-7 text-xs bg-secondary border-border rounded-sm font-mono"
                          placeholder="Field value"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Note (shown to users)
                </Label>
                <Textarea
                  value={method.note ?? ""}
                  onChange={(e) =>
                    updateMethod(methodIdx, "note", e.target.value)
                  }
                  className="text-xs bg-secondary border-border rounded-sm min-h-[60px] resize-none"
                  placeholder="Optional note shown below payment details..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          onClick={handleSave}
          className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
        >
          Save All Payment Settings
        </Button>
      </div>
    </div>
  );
}
