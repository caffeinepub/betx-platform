import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  LogOut,
  Menu,
  QrCode,
  Receipt,
  ShieldCheck,
  Trophy,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { type VipTier, useBetting } from "../context/BettingContext";
import { QRCodeModal } from "./QRCodeModal";

interface NavbarProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const VIP_TIER_STYLES: Record<VipTier, { bg: string; text: string }> = {
  Bronze: { bg: "bg-orange-900/30", text: "text-orange-400" },
  Silver: { bg: "bg-slate-700/30", text: "text-slate-300" },
  Gold: { bg: "bg-yellow-900/30", text: "text-yellow-400" },
  Platinum: { bg: "bg-cyan-900/30", text: "text-cyan-400" },
};

export function Navbar({ onOpenAuth }: NavbarProps) {
  const {
    user,
    logout,
    betSlip,
    setBetSlipOpen,
    setCurrentPage,
    currentPage,
    getVipTier,
  } = useBetting();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const vipTier = user ? getVipTier(user.id) : null;

  const navLinks = [
    { id: "prediction", label: "Win Go", icon: "🎯", isLive: true },
    { id: "home", label: "Sports", icon: "⚽", isLive: false },
    { id: "casino", label: "Casino", icon: "🎰", isLive: false },
    { id: "mybets", label: "My Bets", icon: "📋", isLive: false },
    { id: "wallet", label: "Wallet", icon: "💰", isLive: false },
    { id: "promotions", label: "Promotions", icon: "🎁", isLive: false },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆", isLive: false },
  ];

  const formatBalance = (balance: number) =>
    `$${balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  return (
    <header className="sticky top-0 z-50 bg-panel-dark border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-[1600px] mx-auto">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-1 font-display font-black text-xl tracking-tighter"
          onClick={() => setCurrentPage("home")}
        >
          <span className="text-orange-400">RANG</span>
          <span className="text-green-400">BAAZI</span>
          <span className="ml-1 text-[10px] font-body font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
            LIVE
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.id}
              onClick={() => setCurrentPage(link.id)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-sm flex items-center gap-1.5 ${
                link.id === "prediction"
                  ? currentPage === "prediction"
                    ? "text-orange-400 bg-orange-400/10 font-bold"
                    : "text-orange-400 hover:bg-orange-400/10 font-bold"
                  : currentPage === link.id
                    ? "text-neon bg-neon/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.isLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
              )}
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* QR Code button */}
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary border border-border rounded-sm text-sm text-muted-foreground hover:text-neon hover:border-neon/50 transition-colors"
            title="Website QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          {user ? (
            <>
              {/* Bet slip button */}
              <button
                type="button"
                onClick={() => setBetSlipOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-sm text-sm font-medium hover:border-neon/50 transition-colors"
              >
                <Receipt className="w-4 h-4 text-neon" />
                <span>Slip</span>
                {betSlip.length > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 bg-neon text-panel-dark text-[10px] font-bold rounded-full">
                    {betSlip.length}
                  </span>
                )}
              </button>

              {/* Balance */}
              <button
                type="button"
                onClick={() => setCurrentPage("wallet")}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-sm text-sm"
              >
                <Wallet className="w-4 h-4 text-gold" />
                <span className="font-bold text-gold">
                  {formatBalance(user.balance)}
                </span>
              </button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-sm text-sm hover:border-neon/50 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-neon/20 flex items-center justify-center">
                      <span className="text-neon text-xs font-bold">
                        {user.displayName[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block font-medium">
                      {user.displayName}
                    </span>
                    {vipTier && (
                      <span
                        className={`hidden sm:inline text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${VIP_TIER_STYLES[vipTier].bg} ${VIP_TIER_STYLES[vipTier].text}`}
                      >
                        {vipTier}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-popover border-border"
                >
                  <DropdownMenuItem
                    onClick={() => setCurrentPage("wallet")}
                    className="cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCurrentPage("mybets")}
                    className="cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    My Bets
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCurrentPage("leaderboard")}
                    className="cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem
                      onClick={() => setCurrentPage("admin")}
                      className="cursor-pointer text-neon"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-loss"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth("login")}
                className="hidden sm:flex text-foreground hover:text-neon"
              >
                Log In
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenAuth("register")}
                className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm"
              >
                Register
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-1.5 hover:bg-secondary rounded-sm"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal open={qrOpen} onClose={() => setQrOpen(false)} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-panel-dark border-t border-border">
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <button
                type="button"
                key={link.id}
                onClick={() => {
                  setCurrentPage(link.id);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-sm text-left ${
                  link.id === "prediction"
                    ? currentPage === "prediction"
                      ? "text-orange-400 bg-orange-400/10 font-bold"
                      : "text-orange-400 hover:bg-orange-400/10 font-bold"
                    : currentPage === link.id
                      ? "text-neon bg-neon/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
                {link.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse ml-auto" />
                )}
              </button>
            ))}
            {user && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.displayName}
                  </span>
                  <span className="font-bold text-gold text-sm">
                    {formatBalance(user.balance)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBetSlipOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm"
                >
                  <Receipt className="w-4 h-4 text-neon" />
                  Bet Slip
                  {betSlip.length > 0 && (
                    <span className="ml-auto bg-neon text-panel-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {betSlip.length}
                    </span>
                  )}
                </button>
              </div>
            )}
            {!user && (
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onOpenAuth("login");
                    setMobileOpen(false);
                  }}
                >
                  Log In
                </Button>
                <Button
                  className="flex-1 bg-neon text-panel-dark hover:bg-neon/90 font-bold"
                  onClick={() => {
                    onOpenAuth("register");
                    setMobileOpen(false);
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
