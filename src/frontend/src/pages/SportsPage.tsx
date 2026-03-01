import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { EventCard } from "../components/EventCard";
import {
  type EventStatus,
  type Sport,
  useBetting,
} from "../context/BettingContext";

const SPORTS: { label: string; value: Sport; emoji: string }[] = [
  { label: "All", value: "All", emoji: "🌐" },
  { label: "Football", value: "Football", emoji: "⚽" },
  { label: "Basketball", value: "Basketball", emoji: "🏀" },
  { label: "Tennis", value: "Tennis", emoji: "🎾" },
  { label: "Cricket", value: "Cricket", emoji: "🏏" },
];

const STATUS_FILTERS: { label: string; value: EventStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Live", value: "Live" },
  { label: "Upcoming", value: "Upcoming" },
];

export function SportsPage() {
  const { events } = useBetting();
  const [activeSport, setActiveSport] = useState<Sport>("All");
  const [activeStatus, setActiveStatus] = useState<EventStatus | "All">("All");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (activeSport !== "All" && event.sport !== activeSport) return false;
      if (activeStatus !== "All" && event.status !== activeStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !event.homeTeam.toLowerCase().includes(q) &&
          !event.awayTeam.toLowerCase().includes(q) &&
          !event.league.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [events, activeSport, activeStatus, search]);

  const liveCount = events.filter((e) => e.status === "Live").length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl">Sports Betting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {events.length} events available •{" "}
            <span className="text-live font-medium">{liveCount} live</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Sport tabs */}
        <div className="flex items-center gap-1 bg-secondary rounded-sm p-0.5 overflow-x-auto flex-1">
          {SPORTS.map((sport) => (
            <button
              type="button"
              key={sport.value}
              onClick={() => setActiveSport(sport.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap ${
                activeSport === sport.value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{sport.emoji}</span>
              {sport.label}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-secondary rounded-sm p-0.5">
          {STATUS_FILTERS.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() => setActiveStatus(s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap ${
                activeStatus === s.value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.value === "Live" && <span className="live-dot" />}
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search teams, leagues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary border-border rounded-sm"
          />
        </div>
      </div>

      {/* Events grid */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <SlidersHorizontal className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try changing your filters or search term
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Live events first */}
          {activeStatus !== "Upcoming" &&
            filteredEvents.filter((e) => e.status === "Live").length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="live-dot" />
                  <h2 className="font-display font-bold text-sm uppercase tracking-wide text-live">
                    Live Events
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({filteredEvents.filter((e) => e.status === "Live").length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredEvents
                    .filter((e) => e.status === "Live")
                    .map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}

          {/* Upcoming events */}
          {activeStatus !== "Live" &&
            filteredEvents.filter((e) => e.status === "Upcoming").length >
              0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display font-bold text-sm uppercase tracking-wide text-muted-foreground">
                    Upcoming Events
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    (
                    {
                      filteredEvents.filter((e) => e.status === "Upcoming")
                        .length
                    }
                    )
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredEvents
                    .filter((e) => e.status === "Upcoming")
                    .map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}

          {/* All status */}
          {activeStatus === "All" &&
            filteredEvents.filter((e) => e.status === "Finished").length >
              0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display font-bold text-sm uppercase tracking-wide text-muted-foreground/50">
                    Finished
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredEvents
                    .filter((e) => e.status === "Finished")
                    .map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
