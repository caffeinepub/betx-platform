import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Trash2, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useBetting } from "../context/BettingContext";

export function BetSlip() {
  const {
    betSlip,
    betSlipOpen,
    setBetSlipOpen,
    removeFromBetSlip,
    updateBetSlipStake,
    clearBetSlip,
    placeBets,
    user,
  } = useBetting();

  const totalStake = betSlip.reduce((sum, item) => sum + item.stake, 0);
  const totalPotentialWin = betSlip.reduce(
    (sum, item) => sum + item.stake * item.odds,
    0,
  );
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const handlePlaceBets = () => {
    if (!user) {
      toast.error("Please log in to place bets");
      return;
    }
    if (user.balance < totalStake) {
      toast.error(`Insufficient balance. You need ${fmt(totalStake)}`);
      return;
    }
    const success = placeBets();
    if (success) {
      toast.success(`${betSlip.length} bet(s) placed successfully!`);
    }
  };

  if (!betSlipOpen) return null;

  return (
    <>
      {/* Overlay on mobile */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={() => setBetSlipOpen(false)}
        role="presentation"
      />

      {/* Slip panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-panel-dark border-l border-border z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-neon" />
            <h2 className="font-display font-bold text-sm uppercase tracking-wide">
              Bet Slip
            </h2>
            {betSlip.length > 0 && (
              <span className="bg-neon text-panel-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {betSlip.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {betSlip.length > 0 && (
              <button
                type="button"
                onClick={clearBetSlip}
                className="text-muted-foreground hover:text-loss p-1 rounded-sm hover:bg-secondary transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setBetSlipOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {betSlip.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="w-16 h-16 bg-secondary rounded-sm flex items-center justify-center">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Your slip is empty</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click odds on any event to add selections
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {betSlip.map((item) => (
                <div
                  key={item.eventId}
                  className="bg-secondary border border-border rounded-sm p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        {item.eventName}
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {item.selectionName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gold font-bold text-sm">
                        {item.odds.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromBetSlip(item.eventId)}
                        className="text-muted-foreground hover:text-loss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Stake:
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        min="1"
                        max={user?.balance ?? 9999}
                        value={item.stake}
                        onChange={(e) =>
                          updateBetSlipStake(
                            item.eventId,
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                        className="h-7 text-xs pl-5 bg-background border-border rounded-sm"
                      />
                    </div>
                    <span className="text-xs text-neon font-semibold whitespace-nowrap">
                      = {fmt(item.stake * item.odds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {betSlip.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Stake</span>
                <span className="font-semibold">{fmt(totalStake)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Win</span>
                <span className="font-bold text-neon">
                  {fmt(totalPotentialWin)}
                </span>
              </div>
              {user && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Balance</span>
                  <span
                    className={
                      user.balance < totalStake ? "text-loss" : "text-gold"
                    }
                  >
                    {fmt(user.balance)}
                  </span>
                </div>
              )}
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground text-center">
                Log in to place bets
              </p>
            )}

            <Button
              onClick={handlePlaceBets}
              disabled={!user || user.balance < totalStake}
              className="w-full bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm h-10 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Place {betSlip.length} Bet{betSlip.length > 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
