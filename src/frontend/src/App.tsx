import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
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
import { SportsPage } from "./pages/SportsPage";
import { WalletPage } from "./pages/WalletPage";

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
