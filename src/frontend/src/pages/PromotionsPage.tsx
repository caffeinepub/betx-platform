import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Copy,
  Gift,
  Link2,
  Lock,
  Sparkles,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, type Variants, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type VipTier, useBetting } from "../context/BettingContext";

interface PromotionsPageProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const VIP_TIERS: {
  tier: VipTier;
  label: string;
  minBets: number;
  color: string;
  bg: string;
}[] = [
  {
    tier: "Bronze",
    label: "Bronze",
    minBets: 0,
    color: "text-orange-400",
    bg: "bg-orange-400",
  },
  {
    tier: "Silver",
    label: "Silver",
    minBets: 50,
    color: "text-slate-300",
    bg: "bg-slate-300",
  },
  {
    tier: "Gold",
    label: "Gold",
    minBets: 150,
    color: "text-yellow-400",
    bg: "bg-yellow-400",
  },
  {
    tier: "Platinum",
    label: "Platinum",
    minBets: 500,
    color: "text-cyan-400",
    bg: "bg-cyan-400",
  },
];

const BADGE_STYLES: Record<string, string> = {
  Active: "bg-neon/15 text-neon border-neon/30",
  Daily: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Hot: "bg-red-500/15 text-red-400 border-red-500/30",
  Ongoing: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  VIP: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Exclusive: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

function PromoBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-sm border ${BADGE_STYLES[label] ?? "bg-secondary text-foreground border-border"}`}
    >
      {label}
    </span>
  );
}

function CopyButton({
  value,
  label = "Copy",
}: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-neon transition-colors px-3 py-1.5 bg-secondary hover:bg-neon/10 border border-border hover:border-neon/40 rounded-sm"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-neon" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied!" : label}
    </button>
  );
}

export function PromotionsPage({ onOpenAuth }: PromotionsPageProps) {
  const {
    user,
    bets,
    getReferralCode,
    claimDailyBonus,
    applyReferralCode,
    dailyLoginClaimed,
    getVipTier,
    setCurrentPage,
  } = useBetting();

  const [referralInput, setReferralInput] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);

  const myCode = user ? getReferralCode(user.id) : "";
  const myLink = `https://rangbaazi.app/ref/${myCode}`;
  const today = new Date().toDateString();
  const alreadyClaimed = user ? dailyLoginClaimed[user.id] === today : false;

  const vipTier = user ? getVipTier(user.id) : "Bronze";
  const myBetCount = user ? bets.length : 0;
  const currentTierIndex = VIP_TIERS.findIndex((t) => t.tier === vipTier);
  const nextTier = VIP_TIERS[currentTierIndex + 1];
  const vipProgress = nextTier
    ? Math.min(
        100,
        ((myBetCount - VIP_TIERS[currentTierIndex].minBets) /
          (nextTier.minBets - VIP_TIERS[currentTierIndex].minBets)) *
          100,
      )
    : 100;

  const handleClaimDaily = () => {
    const result = claimDailyBonus();
    if (result.success) {
      toast.success("₹50 daily bonus claimed! 🎉");
    } else {
      toast.error(result.error ?? "Could not claim bonus");
    }
  };

  const handleApplyReferral = () => {
    if (!referralInput.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    setReferralLoading(true);
    setTimeout(() => {
      const result = applyReferralCode(referralInput);
      if (result.success) {
        toast.success("Referral code applied! Your friend earned ₹50 🎁");
        setReferralInput("");
      } else {
        toast.error(result.error ?? "Invalid code");
      }
      setReferralLoading(false);
    }, 600);
  };

  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-panel-dark border-b border-border">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, oklch(0.85 0.3 145) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.75 0.25 55) 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-3"
          >
            <div className="w-10 h-10 rounded-sm bg-neon/15 flex items-center justify-center">
              <Gift className="w-5 h-5 text-neon" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">
              Promotions &amp; Rewards
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-foreground mb-2"
          >
            Earn More, <span className="text-neon">Play More</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base max-w-xl"
          >
            Claim daily bonuses, refer friends, and unlock exclusive VIP rewards
            on BetX.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Not logged in banner */}
        <AnimatePresence>
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-neon/5 border border-neon/25 rounded-sm"
            >
              <div className="w-10 h-10 rounded-sm bg-neon/15 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-neon" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  Login to claim bonuses
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a free account to access all promotions, referral
                  codes, and daily rewards.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onOpenAuth("login")}
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  className="bg-neon text-panel-dark hover:bg-neon/90 font-bold text-xs rounded-sm"
                  onClick={() => onOpenAuth("register")}
                >
                  Register Free
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Referral Code (logged in only) */}
        <AnimatePresence>
          {user && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-neon" />
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                  My Referral Code
                </h2>
              </div>
              <div className="bg-panel-dark border border-border rounded-sm p-5 sm:p-6 space-y-5">
                {/* Code display */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">
                      Your Referral Code
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black tracking-widest text-neon">
                        {myCode}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CopyButton value={myCode} label="Copy Code" />
                    <CopyButton value={myLink} label="Copy Link" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-background border border-border rounded-sm p-3 text-center">
                    <p className="text-xl font-black text-foreground">
                      {user.referralCount ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">
                      Friends Referred
                    </p>
                  </div>
                  <div className="bg-background border border-border rounded-sm p-3 text-center">
                    <p className="text-xl font-black text-neon">
                      ₹{user.referralEarnings ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">
                      Bonus Earned
                    </p>
                  </div>
                  <div className="bg-background border border-border rounded-sm p-3 text-center col-span-2 sm:col-span-1">
                    <p className="text-xl font-black text-gold">₹50</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">
                      Per Referral
                    </p>
                  </div>
                </div>

                {/* Apply referral code */}
                {!user.referredBy ? (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">
                      Have a friend's code? Apply it here:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={referralInput}
                        onChange={(e) =>
                          setReferralInput(e.target.value.toUpperCase())
                        }
                        placeholder="BETX-XXXXXXXX"
                        className="font-mono text-sm h-9 bg-background border-border focus:border-neon/50"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyReferral()
                        }
                      />
                      <Button
                        onClick={handleApplyReferral}
                        disabled={referralLoading || !referralInput.trim()}
                        size="sm"
                        className="bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm px-4 whitespace-nowrap"
                      >
                        {referralLoading ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-neon" />
                    Referred by{" "}
                    <span className="text-foreground font-semibold">
                      @{user.referredBy}
                    </span>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Promotions Grid */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-neon" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              Active Promotions
            </h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* Card 1: Welcome Bonus */}
            <motion.div
              variants={itemVariants}
              className="bg-panel-dark border border-border rounded-sm p-5 flex flex-col gap-4 hover:border-neon/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-neon/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-neon" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      Welcome Bonus
                    </p>
                    <PromoBadge label="Active" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-neon">₹50</p>
                  <p className="text-[10px] text-muted-foreground">
                    Welcome bonus
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get ₹50 welcome bonus when you register. No deposit needed.
                Start betting instantly.
              </p>
              <div className="mt-auto">
                {user ? (
                  <Button
                    disabled
                    size="sm"
                    className="w-full text-xs rounded-sm bg-secondary text-muted-foreground cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Already Claimed
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onOpenAuth("register")}
                    className="w-full bg-neon text-panel-dark hover:bg-neon/90 font-bold text-xs rounded-sm"
                  >
                    Claim Now
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Card 2: Daily Login Bonus */}
            <motion.div
              variants={itemVariants}
              className="bg-panel-dark border border-border rounded-sm p-5 flex flex-col gap-4 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      Daily Login Bonus
                    </p>
                    <PromoBadge label="Daily" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-blue-400">₹50</p>
                  <p className="text-[10px] text-muted-foreground">Every day</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Claim ₹50 free every day just for logging in. Auto-resets at
                midnight. Streak bonuses coming soon!
              </p>
              <div className="mt-auto">
                {!user ? (
                  <Button
                    size="sm"
                    onClick={() => onOpenAuth("login")}
                    className="w-full bg-blue-500/90 hover:bg-blue-500 text-white font-bold text-xs rounded-sm"
                  >
                    Login to Claim
                  </Button>
                ) : alreadyClaimed ? (
                  <Button
                    disabled
                    size="sm"
                    className="w-full text-xs rounded-sm bg-secondary text-muted-foreground cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Already Claimed
                    Today
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleClaimDaily}
                    className="w-full bg-blue-500/90 hover:bg-blue-500 text-white font-bold text-xs rounded-sm"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" /> Claim ₹50
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Card 3: First Deposit Bonus */}
            <motion.div
              variants={itemVariants}
              className="bg-panel-dark border border-border rounded-sm p-5 flex flex-col gap-4 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      100% First Deposit Bonus
                    </p>
                    <PromoBadge label="Hot" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-red-400">2x</p>
                  <p className="text-[10px] text-muted-foreground">
                    Up to ₹1,000
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deposit ₹100–₹50,000 and get 100% bonus up to ₹1,000 added to
                your account instantly.
              </p>
              <div className="mt-auto">
                <Button
                  size="sm"
                  onClick={() => setCurrentPage("wallet")}
                  className="w-full bg-red-500/90 hover:bg-red-500 text-white font-bold text-xs rounded-sm"
                >
                  <Wallet className="w-3.5 h-3.5 mr-1.5" /> Deposit Now
                </Button>
              </div>
            </motion.div>

            {/* Card 4: Refer & Earn */}
            <motion.div
              variants={itemVariants}
              className="bg-panel-dark border border-border rounded-sm p-5 flex flex-col gap-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      Refer &amp; Earn
                    </p>
                    <PromoBadge label="Ongoing" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-purple-400">₹50</p>
                  <p className="text-[10px] text-muted-foreground">
                    Per referral
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invite friends with your unique referral code. Earn ₹50 for
                every friend who registers on BetX. No limit!
              </p>
              <div className="mt-auto">
                {user ? (
                  <CopyButton value={myCode} label="Copy My Code" />
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onOpenAuth("register")}
                    className="w-full bg-purple-500/90 hover:bg-purple-500 text-white font-bold text-xs rounded-sm"
                  >
                    <Link2 className="w-3.5 h-3.5 mr-1.5" /> Get My Code
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Card 5: Weekly Cashback */}
            <motion.div
              variants={itemVariants}
              className="bg-panel-dark border border-border rounded-sm p-5 flex flex-col gap-4 hover:border-yellow-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      10% Weekly Cashback
                    </p>
                    <PromoBadge label="VIP" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-yellow-400">10%</p>
                  <p className="text-[10px] text-muted-foreground">
                    Up to ₹5,000
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get 10% cashback on your net losses every week, up to ₹5,000.
                Auto-credited every Monday morning.
              </p>
              <div className="mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs rounded-sm border-border text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    toast.info(
                      "Weekly cashback is auto-applied every Monday. No action needed! 💫",
                    )
                  }
                >
                  <Star className="w-3.5 h-3.5 mr-1.5" /> Learn More
                </Button>
              </div>
            </motion.div>

            {/* Card 6: VIP Loyalty */}
            <motion.div
              variants={itemVariants}
              className="bg-panel-dark border border-border rounded-sm p-5 flex flex-col gap-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      VIP Loyalty Program
                    </p>
                    <PromoBadge label="Exclusive" />
                  </div>
                </div>
                {user && (
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-black uppercase tracking-wide ${VIP_TIERS.find((t) => t.tier === vipTier)?.color ?? "text-foreground"}`}
                    >
                      {vipTier}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Current Tier
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Climb from Bronze → Silver → Gold → Platinum. Higher tiers
                unlock bigger bonuses, faster withdrawals, and dedicated VIP
                support.
              </p>
              {user && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span
                      className={`font-semibold ${VIP_TIERS.find((t) => t.tier === vipTier)?.color}`}
                    >
                      {vipTier}
                    </span>
                    {nextTier ? (
                      <span className={`font-semibold ${nextTier.color}`}>
                        {nextTier.label}
                      </span>
                    ) : (
                      <span className="text-cyan-400 font-semibold">
                        Max Tier ✨
                      </span>
                    )}
                  </div>
                  <Progress
                    value={vipProgress}
                    className="h-1.5 bg-secondary"
                  />
                  {nextTier && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      {nextTier.minBets - myBetCount} more bets to{" "}
                      {nextTier.label}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {VIP_TIERS.map((t) => (
                      <div
                        key={t.tier}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${currentTierIndex >= VIP_TIERS.indexOf(t) ? t.bg : "bg-border"}`}
                        />
                        <span
                          className={`text-[9px] font-bold uppercase ${currentTierIndex >= VIP_TIERS.indexOf(t) ? t.color : "text-muted-foreground"}`}
                        >
                          {t.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!user && (
                <div className="mt-auto">
                  <Button
                    size="sm"
                    onClick={() => onOpenAuth("register")}
                    className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-bold text-xs rounded-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Join VIP Program
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="bg-panel-dark border border-border rounded-sm p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-5">
            How Referrals Work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Share Your Code",
                desc: "Copy your unique referral code or link and share it with friends.",
              },
              {
                step: "02",
                title: "Friend Registers",
                desc: "Your friend signs up on BetX using your referral code during registration.",
              },
              {
                step: "03",
                title: "Both Earn ₹50",
                desc: "You instantly earn ₹50 bonus in your wallet. Your friend gets a head start!",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-neon/10 flex items-center justify-center">
                  <span className="text-neon font-black text-xs font-mono">
                    {item.step}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
