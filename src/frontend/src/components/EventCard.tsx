import { type SportEvent, useBetting } from "../context/BettingContext";

interface EventCardProps {
  event: SportEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const { addToBetSlip, betSlip } = useBetting();

  const slipItem = betSlip.find((item) => item.eventId === event.id);

  const handleOddsClick = (selection: "Home" | "Draw" | "Away") => {
    addToBetSlip(event, selection);
  };

  const isSelected = (selection: "Home" | "Draw" | "Away") =>
    slipItem?.selection === selection;

  const hasNoDraw = event.sport === "Basketball" || event.sport === "Tennis";

  return (
    <div
      className={`bg-card border border-border rounded-sm hover:border-border/80 transition-all group ${compact ? "p-3" : "p-4"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {event.league}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
              event.sport === "Football"
                ? "bg-green-500/15 text-green-400"
                : event.sport === "Basketball"
                  ? "bg-orange-500/15 text-orange-400"
                  : event.sport === "Tennis"
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-blue-500/15 text-blue-400"
            }`}
          >
            {event.sport}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {event.status === "Live" ? (
            <div className="flex items-center gap-1.5">
              <span className="live-dot" />
              <span className="text-[10px] font-bold text-live uppercase">
                Live
              </span>
              {event.score && (
                <span className="text-xs font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                  {event.score}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {event.startTime}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{event.homeFlag}</span>
            <span
              className={`font-semibold ${compact ? "text-sm" : "text-base"} truncate`}
            >
              {event.homeTeam}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-lg leading-none">{event.awayFlag}</span>
            <span
              className={`font-semibold ${compact ? "text-sm" : "text-base"} text-muted-foreground truncate`}
            >
              {event.awayTeam}
            </span>
          </div>
        </div>
        {event.status === "Live" && event.score && (
          <div className="text-right ml-4">
            <span className="text-2xl font-display font-black text-foreground">
              {event.score}
            </span>
          </div>
        )}
      </div>

      {/* Odds */}
      <div
        className={`grid gap-1.5 ${hasNoDraw ? "grid-cols-2" : "grid-cols-3"}`}
      >
        <button
          type="button"
          onClick={() => handleOddsClick("Home")}
          className={`odds-badge rounded-sm flex flex-col items-center py-2 ${isSelected("Home") ? "selected" : ""}`}
        >
          <span className="text-[10px] text-muted-foreground mb-0.5">
            {event.sport === "Tennis"
              ? event.homeTeam.split(" ")[1] || event.homeTeam
              : "1"}
          </span>
          <span className="text-sm font-bold">
            {event.odds.home.toFixed(2)}
          </span>
        </button>

        {!hasNoDraw && (
          <button
            type="button"
            onClick={() => handleOddsClick("Draw")}
            className={`odds-badge rounded-sm flex flex-col items-center py-2 ${isSelected("Draw") ? "selected" : ""}`}
          >
            <span className="text-[10px] text-muted-foreground mb-0.5">X</span>
            <span className="text-sm font-bold">
              {event.odds.draw.toFixed(2)}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleOddsClick("Away")}
          className={`odds-badge rounded-sm flex flex-col items-center py-2 ${isSelected("Away") ? "selected" : ""}`}
        >
          <span className="text-[10px] text-muted-foreground mb-0.5">
            {event.sport === "Tennis"
              ? event.awayTeam.split(" ")[1] || event.awayTeam
              : "2"}
          </span>
          <span className="text-sm font-bold">
            {event.odds.away.toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  );
}
