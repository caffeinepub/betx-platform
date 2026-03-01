import { Toaster } from "@/components/ui/sonner";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthModal } from "./components/AuthModal";
import { BetSlip } from "./components/BetSlip";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { BettingProvider, useBetting } from "./context/BettingContext";
import { AdminPage } from "./pages/AdminPage";
import { CasinoPage } from "./pages/CasinoPage";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MyBetsPage } from "./pages/MyBetsPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { SportsPage } from "./pages/SportsPage";
import { WalletPage } from "./pages/WalletPage";

// PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!installPrompt || dismissed) return null;

  const handleInstall = async () => {
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
    else setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-card border border-neon/40 rounded-sm p-4 shadow-2xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-sm bg-neon/10 flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-neon" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Install BetX App</p>
        <p className="text-xs text-muted-foreground">
          Add to home screen for quick access
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleInstall}
          className="text-xs font-bold text-neon bg-neon/10 hover:bg-neon/20 px-3 py-1.5 rounded-sm transition-colors"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 hover:bg-secondary rounded-sm text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AppInner() {
  const { currentPage } = useBetting();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onOpenAuth={openAuth} />;
      case "sports":
        return <SportsPage />;
      case "mybets":
        return <MyBetsPage />;
      case "wallet":
        return <WalletPage />;
      case "casino":
        return <CasinoPage />;
      case "promotions":
        return <PromotionsPage onOpenAuth={openAuth} />;
      case "leaderboard":
        return <LeaderboardPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <HomePage onOpenAuth={openAuth} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onOpenAuth={openAuth} />

      <main className="flex-1">{renderPage()}</main>

      <Footer />

      <BetSlip />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.15 0.012 264)",
            border: "1px solid oklch(0.22 0.015 264)",
            color: "oklch(0.96 0.005 264)",
          },
        }}
      />

      <PWAInstallBanner />
    </div>
  );
}

export default function App() {
  return (
    <BettingProvider>
      <AppInner />
    </BettingProvider>
  );
}
