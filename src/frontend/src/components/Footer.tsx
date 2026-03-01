import { useBetting } from "../context/BettingContext";

export function Footer() {
  const { setCurrentPage } = useBetting();
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  );

  return (
    <footer className="bg-panel-dark border-t border-border mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <button
              type="button"
              onClick={() => setCurrentPage("home")}
              className="font-display font-black text-xl tracking-tighter mb-2 block"
            >
              <span className="text-neon">BET</span>
              <span>X</span>
            </button>
            <p className="text-xs text-muted-foreground max-w-[180px]">
              The premier sports betting and casino platform. Demo mode only.
            </p>
          </div>

          {/* Sports */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">
              Sports
            </h4>
            <ul className="space-y-2">
              {["Football", "Basketball", "Tennis", "Cricket"].map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage("home")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { label: "My Bets", page: "mybets" },
                { label: "Casino", page: "casino" },
                { label: "Wallet", page: "wallet" },
                { label: "Leaderboard", page: "leaderboard" },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(item.page)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">
              Info
            </h4>
            <ul className="space-y-2">
              {[
                "Responsible Gambling",
                "Terms of Service",
                "Privacy Policy",
                "Help & Support",
              ].map((s) => (
                <li key={s}>
                  <span className="text-xs text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {year}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            🔞 18+ only — Demo platform, no real money
          </p>
        </div>
      </div>
    </footer>
  );
}
