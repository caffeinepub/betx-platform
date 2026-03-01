import {
  ChevronRight,
  Radio,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { EventCard } from "../components/EventCard";
import { type Sport, useBetting } from "../context/BettingContext";

const SPORTS: { label: string; value: Sport; emoji: string }[] = [
  { label: "All", value: "All", emoji: "🌐" },
  { label: "Football", value: "Football", emoji: "⚽" },
  { label: "Basketball", value: "Basketball", emoji: "🏀" },
  { label: "Tennis", value: "Tennis", emoji: "🎾" },
  { label: "Cricket", value: "Cricket", emoji: "🏏" },
];

interface HomePageProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

export function HomePage({ onOpenAuth }: HomePageProps) {
  const { events, user, setCurrentPage } = useBetting();
  const [activeSport, setActiveSport] = useState<Sport>("All");

  const liveEvents = events.filter((e) => e.status === "Live");
  const upcomingEvents = events.filter((e) => e.status === "Upcoming");
  const popularEvents = events.filter((e) => e.isPopular);

  const filteredEvents =
    activeSport === "All"
      ? events
      : events.filter((e) => e.sport === activeSport);

  const featuredEvents = filteredEvents.slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Live Ticker */}
      <div className="bg-secondary border-b border-border overflow-hidden py-2">
        <div className="flex items-center gap-3 px-4">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Radio className="w-3 h-3 text-live animate-pulse" />
            <span className="text-[11px] font-bold text-live uppercase tracking-wide">
              Live
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="ticker-track flex gap-8 whitespace-nowrap">
              {[...liveEvents, ...liveEvents].map((event, idx) => (
                <span
                  key={`${event.id}-${idx}`}
                  className="text-xs text-muted-foreground inline-flex items-center gap-2"
                >
                  <span className="text-foreground font-medium">
                    {event.homeTeam} vs {event.awayTeam}
                  </span>
                  {event.score && (
                    <span className="text-neon font-bold">{event.score}</span>
                  )}
                  <span className="text-muted-foreground/50">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -20%, oklch(0.82 0.2 155 / 30%), transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            oklch(var(--border)) 40px,
            oklch(var(--border)) 41px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            oklch(var(--border)) 40px,
            oklch(var(--border)) 41px
          )`,
          }}
        />
        <div className="relative max-w-[1600px] mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="live-dot" />
              <span className="text-xs font-bold text-live uppercase tracking-widest">
                {liveEvents.length} Live Events
              </span>
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-4">
              The Premier
              <br />
              <span className="text-neon">Betting</span> Platform
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Real-time odds on sports worldwide. Lightning-fast betting engine.
              Instant payouts.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage("sports")}
                  className="flex items-center gap-2 bg-neon text-panel-dark px-6 py-3 font-bold text-sm rounded-sm hover:bg-neon/90 transition-colors"
                  // sports page doesn't exist yet, redirect to home event list
                >
                  <Zap className="w-4 h-4" />
                  Bet Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenAuth("register")}
                    className="flex items-center gap-2 bg-neon text-panel-dark px-6 py-3 font-bold text-sm rounded-sm hover:bg-neon/90 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Start Betting Free
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth("login")}
                    className="flex items-center gap-2 bg-secondary border border-border px-6 py-3 font-medium text-sm rounded-sm hover:border-neon/50 transition-colors"
                  >
                    Log In
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-6 mt-12"
          >
            {[
              {
                icon: TrendingUp,
                label: "Active Events",
                value: events.length,
                color: "text-neon",
              },
              {
                icon: Radio,
                label: "Live Now",
                value: liveEvents.length,
                color: "text-live",
              },
              {
                icon: Users,
                label: "Upcoming",
                value: upcomingEvents.length,
                color: "text-gold",
              },
              {
                icon: Shield,
                label: "Sports Covered",
                value: "4+",
                color: "text-foreground",
              },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary border border-border rounded-sm flex items-center justify-center">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p
                    className={`text-xl font-display font-black ${stat.color}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-[1600px] mx-auto px-4 lg:px-6 py-8">
        {/* Sport filter tabs */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg">Featured Events</h2>
          <div className="flex items-center gap-1 bg-secondary rounded-sm p-0.5">
            {SPORTS.map((sport) => (
              <button
                type="button"
                key={sport.value}
                onClick={() => setActiveSport(sport.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${
                  activeSport === sport.value
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{sport.emoji}</span>
                <span className="hidden sm:block">{sport.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featuredEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>

        {featuredEvents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No events for this sport right now
          </div>
        )}

        {filteredEvents.length > 6 && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setCurrentPage("home")}
              className="text-neon text-sm font-medium hover:underline"
            >
              View all {filteredEvents.length} events →
            </button>
          </div>
        )}
      </section>

      {/* Popular events */}
      <section className="max-w-[1600px] mx-auto px-4 lg:px-6 pb-12">
        <h2 className="font-display font-bold text-lg mb-4">🔥 Most Popular</h2>
        <div className="space-y-2">
          {popularEvents.slice(0, 4).map((event) => (
            <EventCard key={event.id} event={event} compact />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      {!user && (
        <section className="max-w-[1600px] mx-auto px-4 lg:px-6 pb-12">
          <div className="relative overflow-hidden bg-neon/5 border border-neon/20 rounded-sm p-8">
            <div
              className="absolute right-0 top-0 bottom-0 w-48 opacity-10"
              style={{
                background:
                  "radial-gradient(ellipse at right, oklch(0.82 0.2 155), transparent)",
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-display font-black text-xl mb-1">
                  Get $1,000 Demo Balance
                </h3>
                <p className="text-muted-foreground text-sm">
                  Register free and start betting with no risk
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="flex-shrink-0 bg-neon text-panel-dark px-8 py-3 font-bold rounded-sm hover:bg-neon/90 transition-colors"
              >
                Claim Now →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
