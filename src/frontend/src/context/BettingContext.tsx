import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ================================================================
// TYPES
// ================================================================

export type Sport = "Football" | "Basketball" | "Tennis" | "Cricket" | "All";
export type EventStatus = "Upcoming" | "Live" | "Finished";
export type BetStatus = "Pending" | "Won" | "Lost" | "Cancelled";

export interface PaymentMethodDetail {
  label: string;
  value: string;
  copyable?: boolean;
}
export interface PaymentMethodConfig {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  details: PaymentMethodDetail[];
  note?: string;
}
export interface PaymentSettings {
  methods: PaymentMethodConfig[];
}
export type TransactionType =
  | "Deposit"
  | "Withdrawal"
  | "Bet Placed"
  | "Bet Won"
  | "Casino Win"
  | "Casino Loss"
  | "P2P Send"
  | "P2P Receive";

export type VipTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface Odds {
  home: number;
  draw: number;
  away: number;
}

export interface SportEvent {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  startTime: string;
  status: EventStatus;
  score?: string;
  odds: Odds;
  isPopular?: boolean;
}

export interface BetSlipItem {
  eventId: string;
  eventName: string;
  selection: "Home" | "Draw" | "Away";
  selectionName: string;
  odds: number;
  stake: number;
}

export interface PlacedBet {
  id: string;
  eventId: string;
  eventName: string;
  selection: "Home" | "Draw" | "Away";
  selectionName: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  status: "Completed" | "Pending" | "Failed";
  isCredit: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  balance: number;
  isAdmin: boolean;
  registeredAt: string;
  referredBy?: string;
  referralCount?: number;
  referralEarnings?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  totalWon: number;
  totalBets: number;
}

interface BettingContextType {
  // Auth
  user: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  register: (
    displayName: string,
    username: string,
    password: string,
  ) => boolean;
  logout: () => void;

  // Events
  events: SportEvent[];
  addEvent: (event: Omit<SportEvent, "id">) => void;
  settleEvent: (eventId: string, result: "Home" | "Draw" | "Away") => void;
  seedDemoData: () => void;

  // Bet Slip
  betSlip: BetSlipItem[];
  addToBetSlip: (
    event: SportEvent,
    selection: "Home" | "Draw" | "Away",
  ) => void;
  removeFromBetSlip: (eventId: string) => void;
  updateBetSlipStake: (eventId: string, stake: number) => void;
  clearBetSlip: () => void;
  placeBets: () => boolean;
  betSlipOpen: boolean;
  setBetSlipOpen: (open: boolean) => void;

  // Bets
  bets: PlacedBet[];

  // Wallet
  transactions: Transaction[];
  deposit: (amount: number) => void;
  withdraw: (amount: number) => boolean;
  addTransaction: (
    type: TransactionType,
    amount: number,
    description: string,
    isCredit: boolean,
  ) => void;
  updateUserBalance: (userId: string, newBalance: number) => void;

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // P2P Transfer
  transferToUser: (
    toUsername: string,
    amount: number,
  ) => { success: boolean; error?: string };

  // VIP
  getVipTier: (userId: string) => VipTier;

  // Payment Settings
  paymentSettings: PaymentSettings;
  updatePaymentSettings: (settings: PaymentSettings) => void;

  // Referral & Bonuses
  dailyLoginClaimed: Record<string, string>;
  claimDailyBonus: () => { success: boolean; error?: string };
  applyReferralCode: (code: string) => { success: boolean; error?: string };
  getReferralCode: (userId: string) => string;

  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

// ================================================================
// MOCK DATA
// ================================================================

const INITIAL_EVENTS: SportEvent[] = [
  {
    id: "evt-001",
    sport: "Football",
    league: "Premier League",
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    homeFlag: "🔵",
    awayFlag: "🔴",
    startTime: "Today 20:45",
    status: "Live",
    score: "1 - 0",
    odds: { home: 1.65, draw: 3.8, away: 4.2 },
    isPopular: true,
  },
  {
    id: "evt-002",
    sport: "Football",
    league: "La Liga",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeFlag: "⚪",
    awayFlag: "🔵",
    startTime: "Today 21:00",
    status: "Upcoming",
    odds: { home: 2.1, draw: 3.4, away: 3.2 },
    isPopular: true,
  },
  {
    id: "evt-003",
    sport: "Football",
    league: "Champions League",
    homeTeam: "Bayern Munich",
    awayTeam: "PSG",
    homeFlag: "🔴",
    awayFlag: "🔵",
    startTime: "Tomorrow 20:00",
    status: "Upcoming",
    odds: { home: 1.95, draw: 3.6, away: 3.8 },
    isPopular: true,
  },
  {
    id: "evt-004",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "LA Lakers",
    awayTeam: "Golden State Warriors",
    homeFlag: "💜",
    awayFlag: "💛",
    startTime: "Today 02:30",
    status: "Live",
    score: "89 - 76",
    odds: { home: 1.75, draw: 0, away: 2.05 },
    isPopular: true,
  },
  {
    id: "evt-005",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Miami Heat",
    homeFlag: "🟢",
    awayFlag: "🔴",
    startTime: "Tomorrow 01:00",
    status: "Upcoming",
    odds: { home: 1.55, draw: 0, away: 2.4 },
  },
  {
    id: "evt-006",
    sport: "Tennis",
    league: "ATP Masters",
    homeTeam: "Novak Djokovic",
    awayTeam: "Carlos Alcaraz",
    homeFlag: "🎾",
    awayFlag: "🎾",
    startTime: "Today 16:00",
    status: "Live",
    score: "6-4, 3-2",
    odds: { home: 1.85, draw: 0, away: 1.95 },
  },
  {
    id: "evt-007",
    sport: "Tennis",
    league: "WTA Grand Slam",
    homeTeam: "Iga Swiatek",
    awayTeam: "Aryna Sabalenka",
    homeFlag: "🎾",
    awayFlag: "🎾",
    startTime: "Tomorrow 14:00",
    status: "Upcoming",
    odds: { home: 1.7, draw: 0, away: 2.1 },
  },
  {
    id: "evt-008",
    sport: "Cricket",
    league: "IPL 2025",
    homeTeam: "Mumbai Indians",
    awayTeam: "Chennai Super Kings",
    homeFlag: "🔵",
    awayFlag: "🟡",
    startTime: "Today 19:30",
    status: "Upcoming",
    odds: { home: 1.9, draw: 15, away: 1.85 },
    isPopular: true,
  },
  {
    id: "evt-009",
    sport: "Cricket",
    league: "Test Series",
    homeTeam: "India",
    awayTeam: "England",
    homeFlag: "🇮🇳",
    awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    startTime: "Feb 29, 09:30",
    status: "Upcoming",
    odds: { home: 1.6, draw: 5.5, away: 4.5 },
  },
  {
    id: "evt-010",
    sport: "Football",
    league: "Serie A",
    homeTeam: "Inter Milan",
    awayTeam: "Juventus",
    homeFlag: "🔵",
    awayFlag: "⚫",
    startTime: "Tomorrow 20:45",
    status: "Upcoming",
    odds: { home: 2.2, draw: 3.3, away: 3.0 },
  },
  {
    id: "evt-011",
    sport: "Basketball",
    league: "EuroLeague",
    homeTeam: "Real Madrid",
    awayTeam: "CSKA Moscow",
    homeFlag: "⚪",
    awayFlag: "🔴",
    startTime: "Today 20:00",
    status: "Live",
    score: "45 - 38",
    odds: { home: 1.8, draw: 0, away: 2.0 },
  },
  {
    id: "evt-012",
    sport: "Football",
    league: "Bundesliga",
    homeTeam: "Borussia Dortmund",
    awayTeam: "RB Leipzig",
    homeFlag: "🟡",
    awayFlag: "🔴",
    startTime: "Mar 01, 17:30",
    status: "Upcoming",
    odds: { home: 2.05, draw: 3.5, away: 3.4 },
  },
];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "sys-1",
    username: "kingbet",
    displayName: "KingBet Pro",
    totalWon: 48250,
    totalBets: 342,
  },
  {
    rank: 2,
    userId: "sys-2",
    username: "luckyshot",
    displayName: "Lucky Shot",
    totalWon: 31800,
    totalBets: 218,
  },
  {
    rank: 3,
    userId: "sys-3",
    username: "oddsmaster",
    displayName: "Odds Master",
    totalWon: 27450,
    totalBets: 195,
  },
  {
    rank: 4,
    userId: "sys-4",
    username: "sportsguru",
    displayName: "Sports Guru",
    totalWon: 19200,
    totalBets: 156,
  },
  {
    rank: 5,
    userId: "sys-5",
    username: "bigwinner",
    displayName: "Big Winner",
    totalWon: 15600,
    totalBets: 134,
  },
  {
    rank: 6,
    userId: "sys-6",
    username: "betpro99",
    displayName: "BetPro 99",
    totalWon: 12100,
    totalBets: 112,
  },
  {
    rank: 7,
    userId: "sys-7",
    username: "sharpbets",
    displayName: "Sharp Bets",
    totalWon: 9800,
    totalBets: 98,
  },
  {
    rank: 8,
    userId: "sys-8",
    username: "nightowl",
    displayName: "Night Owl",
    totalWon: 7650,
    totalBets: 87,
  },
  {
    rank: 9,
    userId: "sys-9",
    username: "acebet",
    displayName: "Ace Bet",
    totalWon: 5400,
    totalBets: 71,
  },
  {
    rank: 10,
    userId: "sys-10",
    username: "allinhero",
    displayName: "All In Hero",
    totalWon: 3200,
    totalBets: 54,
  },
];

// ================================================================
// STORAGE HELPERS
// ================================================================

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  methods: [
    {
      id: "USDT",
      label: "USDT (TRC20)",
      icon: "₮",
      active: true,
      details: [
        { label: "Network", value: "TRC20 (Tron)" },
        {
          label: "Address",
          value: "TXyz1234BetXabc5678defgh9012abcd",
          copyable: true,
        },
        { label: "Min Deposit", value: "₹100" },
      ],
      note: "Send only USDT on TRC20 network. Other networks will result in loss of funds.",
    },
    {
      id: "Bitcoin",
      label: "Bitcoin (BTC)",
      icon: "₿",
      active: true,
      details: [
        { label: "Network", value: "Bitcoin (BTC)" },
        {
          label: "Address",
          value: "bc1q9betxplatform1234xyz789abcdef",
          copyable: true,
        },
        { label: "Min Deposit", value: "0.0005 BTC" },
      ],
      note: "Minimum 1 network confirmation required. Processing time: 10–30 min.",
    },
    {
      id: "UPI",
      label: "UPI / PayTM",
      icon: "📲",
      active: true,
      details: [
        { label: "UPI ID", value: "betx@paytm", copyable: true },
        { label: "PayTM", value: "9876543210", copyable: true },
        { label: "GPay / PhonePe", value: "betx@ybl", copyable: true },
      ],
      note: "After payment, screenshot and click Confirm Deposit below.",
    },
    {
      id: "Bank",
      label: "Bank Transfer",
      icon: "🏦",
      active: true,
      details: [
        { label: "Bank Name", value: "BetX Payments Pvt Ltd" },
        { label: "Account No.", value: "1234567890123", copyable: true },
        { label: "IFSC Code", value: "BETX0001234", copyable: true },
        { label: "Account Type", value: "Current Account" },
      ],
      note: "Use NEFT/IMPS/RTGS. Add your username in remarks for instant credit.",
    },
    {
      id: "Netbanking",
      label: "Netbanking",
      icon: "💻",
      active: true,
      details: [
        { label: "Method", value: "NEFT / IMPS / RTGS" },
        { label: "Account", value: "1234567890123" },
        { label: "IFSC", value: "BETX0001234" },
      ],
      note: "Login to your bank portal and transfer to the above account. Processing: 15–60 min.",
    },
  ],
};

const STORAGE_KEYS = {
  USER: "betx_user",
  USERS: "betx_users",
  BETS: "betx_bets",
  TRANSACTIONS: "betx_transactions",
  EVENTS: "betx_events",
  PASSWORDS: "betx_passwords",
  PAYMENT_SETTINGS: "betx_payment_settings",
  DAILY_LOGIN: "betx_daily_login",
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ================================================================
// CONTEXT
// ================================================================

const BettingContext = createContext<BettingContextType | null>(null);

export function BettingProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    loadFromStorage(STORAGE_KEYS.USER, null),
  );
  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage(STORAGE_KEYS.USERS, []),
  );
  const [passwords, setPasswords] = useState<Record<string, string>>(() =>
    loadFromStorage(STORAGE_KEYS.PASSWORDS, {}),
  );
  const [events, setEvents] = useState<SportEvent[]>(() =>
    loadFromStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS),
  );
  const [bets, setBets] = useState<PlacedBet[]>(() =>
    loadFromStorage(STORAGE_KEYS.BETS, []),
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
  );
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() =>
    loadFromStorage(STORAGE_KEYS.PAYMENT_SETTINGS, DEFAULT_PAYMENT_SETTINGS),
  );
  const [dailyLoginClaimed, setDailyLoginClaimed] = useState<
    Record<string, string>
  >(() => loadFromStorage(STORAGE_KEYS.DAILY_LOGIN, {}));

  const updatePaymentSettings = useCallback((settings: PaymentSettings) => {
    setPaymentSettings(settings);
    saveToStorage(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
  }, []);

  // Sync user balance from users array
  useEffect(() => {
    if (user) {
      const updatedUser = users.find((u) => u.id === user.id);
      if (updatedUser && updatedUser.balance !== user.balance) {
        setUser(updatedUser);
        saveToStorage(STORAGE_KEYS.USER, updatedUser);
      }
    }
  }, [users, user]);

  // Persist state
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USERS, users);
  }, [users]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.BETS, bets);
  }, [bets]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EVENTS, events);
  }, [events]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PASSWORDS, passwords);
  }, [passwords]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DAILY_LOGIN, dailyLoginClaimed);
  }, [dailyLoginClaimed]);

  // ---- AUTH ----

  const login = useCallback(
    (username: string, password: string): boolean => {
      const foundUser = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );
      if (!foundUser) return false;
      if (passwords[foundUser.id] !== password) return false;
      setUser(foundUser);
      saveToStorage(STORAGE_KEYS.USER, foundUser);
      return true;
    },
    [users, passwords],
  );

  const register = useCallback(
    (displayName: string, username: string, password: string): boolean => {
      if (
        users.find((u) => u.username.toLowerCase() === username.toLowerCase())
      )
        return false;
      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        displayName,
        balance: 1000,
        isAdmin: username.toLowerCase() === "admin",
        registeredAt: new Date().toISOString(),
      };
      const updatedUsers = [...users, newUser];
      const updatedPasswords = { ...passwords, [newUser.id]: password };
      setUsers(updatedUsers);
      setPasswords(updatedPasswords);
      setUser(newUser);
      saveToStorage(STORAGE_KEYS.USER, newUser);
      // Welcome deposit
      const welcomeTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: "Deposit",
        amount: 1000,
        description: "Welcome bonus — Demo balance",
        date: new Date().toISOString(),
        status: "Completed",
        isCredit: true,
      };
      const updatedTx = [welcomeTx, ...transactions];
      setTransactions(updatedTx);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, updatedTx);
      return true;
    },
    [users, passwords, transactions],
  );

  const logout = useCallback(() => {
    setUser(null);
    setBetSlip([]);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  // ---- EVENTS ----

  const addEvent = useCallback((event: Omit<SportEvent, "id">) => {
    const newEvent: SportEvent = { ...event, id: `evt-${Date.now()}` };
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const settleEvent = useCallback(
    (eventId: string, result: "Home" | "Draw" | "Away") => {
      // Settle all bets on this event
      setBets((prevBets) => {
        const updated = prevBets.map((bet) => {
          if (bet.eventId !== eventId || bet.status !== "Pending") return bet;
          const won = bet.selection === result;
          return {
            ...bet,
            status: (won ? "Won" : "Lost") as BetStatus,
            settledAt: new Date().toISOString(),
          };
        });

        // Credit winners
        const wonBets = updated.filter(
          (b) => b.eventId === eventId && b.status === "Won",
        );
        for (const bet of wonBets) {
          const winTx: Transaction = {
            id: `tx-${Date.now()}-${bet.id}`,
            type: "Bet Won",
            amount: bet.potentialWin,
            description: `Won: ${bet.eventName} — ${bet.selectionName}`,
            date: new Date().toISOString(),
            status: "Completed",
            isCredit: true,
          };
          setTransactions((prev) => [winTx, ...prev]);
        }

        return updated;
      });

      // Mark event as finished
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, status: "Finished" as EventStatus } : e,
        ),
      );
    },
    [],
  );

  const seedDemoData = useCallback(() => {
    setEvents(INITIAL_EVENTS);
  }, []);

  // ---- BET SLIP ----

  const addToBetSlip = useCallback(
    (event: SportEvent, selection: "Home" | "Draw" | "Away") => {
      const odds =
        selection === "Home"
          ? event.odds.home
          : selection === "Draw"
            ? event.odds.draw
            : event.odds.away;
      const selectionName =
        selection === "Home"
          ? event.homeTeam
          : selection === "Draw"
            ? "Draw"
            : event.awayTeam;

      setBetSlip((prev) => {
        const existing = prev.find((item) => item.eventId === event.id);
        if (existing) {
          if (existing.selection === selection) {
            return prev.filter((item) => item.eventId !== event.id);
          }
          return prev.map((item) =>
            item.eventId === event.id
              ? { ...item, selection, selectionName, odds }
              : item,
          );
        }
        return [
          ...prev,
          {
            eventId: event.id,
            eventName: `${event.homeTeam} vs ${event.awayTeam}`,
            selection,
            selectionName,
            odds,
            stake: 10,
          },
        ];
      });
      setBetSlipOpen(true);
    },
    [],
  );

  const removeFromBetSlip = useCallback((eventId: string) => {
    setBetSlip((prev) => prev.filter((item) => item.eventId !== eventId));
  }, []);

  const updateBetSlipStake = useCallback((eventId: string, stake: number) => {
    setBetSlip((prev) =>
      prev.map((item) =>
        item.eventId === eventId ? { ...item, stake } : item,
      ),
    );
  }, []);

  const clearBetSlip = useCallback(() => {
    setBetSlip([]);
  }, []);

  const placeBets = useCallback((): boolean => {
    if (!user || betSlip.length === 0) return false;
    const totalStake = betSlip.reduce((sum, item) => sum + item.stake, 0);
    if (user.balance < totalStake) return false;

    const newBets: PlacedBet[] = betSlip.map((item) => ({
      id: `bet-${Date.now()}-${item.eventId}`,
      eventId: item.eventId,
      eventName: item.eventName,
      selection: item.selection,
      selectionName: item.selectionName,
      odds: item.odds,
      stake: item.stake,
      potentialWin: Number.parseFloat((item.stake * item.odds).toFixed(2)),
      status: "Pending" as BetStatus,
      placedAt: new Date().toISOString(),
    }));

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "Bet Placed",
      amount: totalStake,
      description: `${betSlip.length} bet(s) placed`,
      date: new Date().toISOString(),
      status: "Completed",
      isCredit: false,
    };

    const newBalance = user.balance - totalStake;
    const updatedUser = { ...user, balance: newBalance };

    setUser(updatedUser);
    saveToStorage(STORAGE_KEYS.USER, updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setBets((prev) => [...newBets, ...prev]);
    setTransactions((prev) => [tx, ...prev]);
    setBetSlip([]);
    setBetSlipOpen(false);
    return true;
  }, [user, betSlip]);

  // ---- WALLET ----

  const addTransaction = useCallback(
    (
      type: TransactionType,
      amount: number,
      description: string,
      isCredit: boolean,
    ) => {
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        type,
        amount,
        description,
        date: new Date().toISOString(),
        status: "Completed",
        isCredit,
      };
      setTransactions((prev) => [tx, ...prev]);
    },
    [],
  );

  const deposit = useCallback(
    (amount: number) => {
      if (!user || amount <= 0) return;
      const newBalance = user.balance + amount;
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      saveToStorage(STORAGE_KEYS.USER, updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      addTransaction("Deposit", amount, "Demo deposit", true);
    },
    [user, addTransaction],
  );

  const withdraw = useCallback(
    (amount: number): boolean => {
      if (!user || amount <= 0 || user.balance < amount) return false;
      const newBalance = user.balance - amount;
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      saveToStorage(STORAGE_KEYS.USER, updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      addTransaction("Withdrawal", amount, "Withdrawal request", false);
      return true;
    },
    [user, addTransaction],
  );

  const updateUserBalance = useCallback(
    (userId: string, newBalance: number) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u)),
      );
      if (user?.id === userId) {
        const updatedUser = { ...user, balance: newBalance };
        setUser(updatedUser);
        saveToStorage(STORAGE_KEYS.USER, updatedUser);
      }
    },
    [user],
  );

  // ---- P2P TRANSFER ----

  const transferToUser = useCallback(
    (
      toUsername: string,
      amount: number,
    ): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: "Not logged in" };
      if (amount <= 0) return { success: false, error: "Invalid amount" };
      if (user.balance < amount)
        return { success: false, error: "Insufficient balance" };

      const recipient = users.find(
        (u) => u.username.toLowerCase() === toUsername.toLowerCase(),
      );
      if (!recipient) return { success: false, error: "User not found" };
      if (recipient.id === user.id)
        return { success: false, error: "Cannot transfer to yourself" };

      // Deduct from sender
      const senderBalance = user.balance - amount;
      const updatedSender = { ...user, balance: senderBalance };
      setUser(updatedSender);
      saveToStorage(STORAGE_KEYS.USER, updatedSender);

      // Credit recipient
      const recipientBalance = recipient.balance + amount;

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) return updatedSender;
          if (u.id === recipient.id) return { ...u, balance: recipientBalance };
          return u;
        }),
      );

      const now = new Date().toISOString();
      const sendTx: Transaction = {
        id: `tx-${Date.now()}-send`,
        type: "P2P Send",
        amount,
        description: `P2P Transfer to @${recipient.username}`,
        date: now,
        status: "Completed",
        isCredit: false,
      };
      const recvTx: Transaction = {
        id: `tx-${Date.now()}-recv`,
        type: "P2P Receive",
        amount,
        description: `P2P Transfer from @${user.username}`,
        date: now,
        status: "Completed",
        isCredit: true,
      };
      setTransactions((prev) => [sendTx, recvTx, ...prev]);
      return { success: true };
    },
    [user, users],
  );

  // ---- REFERRAL & BONUSES ----

  const getReferralCode = useCallback(
    (userId: string): string => {
      const u = users.find((u) => u.id === userId);
      if (!u) return "";
      return `BETX-${u.username
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8)}`;
    },
    [users],
  );

  const claimDailyBonus = useCallback((): {
    success: boolean;
    error?: string;
  } => {
    if (!user) return { success: false, error: "Not logged in" };
    const today = new Date().toDateString();
    if (dailyLoginClaimed[user.id] === today)
      return { success: false, error: "Already claimed today" };
    const newBalance = user.balance + 50;
    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);
    saveToStorage(STORAGE_KEYS.USER, updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    const newClaimed = { ...dailyLoginClaimed, [user.id]: today };
    setDailyLoginClaimed(newClaimed);
    saveToStorage(STORAGE_KEYS.DAILY_LOGIN, newClaimed);
    addTransaction("Deposit", 50, "Daily login bonus claimed", true);
    return { success: true };
  }, [user, dailyLoginClaimed, addTransaction]);

  const applyReferralCode = useCallback(
    (code: string): { success: boolean; error?: string } => {
      if (!user) return { success: false, error: "Not logged in" };
      if (user.referredBy)
        return {
          success: false,
          error: "You have already used a referral code",
        };
      const codeUpper = code.trim().toUpperCase();
      const referrer = users.find((u) => {
        const rc = `BETX-${u.username
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 8)}`;
        return rc === codeUpper && u.id !== user.id;
      });
      if (!referrer) return { success: false, error: "Invalid referral code" };
      const referrerBalance = referrer.balance + 50;
      const updatedReferrer = {
        ...referrer,
        balance: referrerBalance,
        referralCount: (referrer.referralCount || 0) + 1,
        referralEarnings: (referrer.referralEarnings || 0) + 50,
      };
      const updatedCurrentUser = { ...user, referredBy: referrer.username };
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === referrer.id) return updatedReferrer;
          if (u.id === user.id) return updatedCurrentUser;
          return u;
        }),
      );
      setUser(updatedCurrentUser);
      saveToStorage(STORAGE_KEYS.USER, updatedCurrentUser);
      addTransaction(
        "Deposit",
        50,
        `Referral bonus: @${user.username} joined using your code`,
        true,
      );
      return { success: true };
    },
    [user, users, addTransaction],
  );

  // ---- VIP TIER ----

  const getVipTier = useCallback(
    (userId: string): VipTier => {
      const userBets = bets.filter((b) => b.status !== "Cancelled");
      // Count bets for current user (approximate — bets don't store userId)
      const count =
        userId === user?.id ? userBets.length : Math.floor(Math.random() * 50); // fallback for leaderboard entries
      if (count >= 500) return "Platinum";
      if (count >= 150) return "Gold";
      if (count >= 50) return "Silver";
      return "Bronze";
    },
    [bets, user],
  );

  // ---- LEADERBOARD ----

  const leaderboard: LeaderboardEntry[] = React.useMemo(() => {
    const userEntries = users.map((u, idx) => {
      const userBets = bets.filter((b) => {
        // approximate: all bets since we don't track userId on bets (simplification)
        return b.status === "Won";
      });
      const totalWon = userBets.reduce((sum, b) => sum + b.potentialWin, 0);
      return {
        rank: INITIAL_LEADERBOARD.length + idx + 1,
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        totalWon,
        totalBets: bets.length,
      };
    });

    return [...INITIAL_LEADERBOARD, ...userEntries]
      .sort((a, b) => b.totalWon - a.totalWon)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
      .slice(0, 10);
  }, [users, bets]);

  return (
    <BettingContext.Provider
      value={{
        user,
        users,
        login,
        register,
        logout,
        events,
        addEvent,
        settleEvent,
        seedDemoData,
        betSlip,
        addToBetSlip,
        removeFromBetSlip,
        updateBetSlipStake,
        clearBetSlip,
        placeBets,
        betSlipOpen,
        setBetSlipOpen,
        bets,
        transactions,
        deposit,
        withdraw,
        addTransaction,
        updateUserBalance,
        leaderboard,
        transferToUser,
        getVipTier,
        paymentSettings,
        updatePaymentSettings,
        dailyLoginClaimed,
        claimDailyBonus,
        applyReferralCode,
        getReferralCode,
        currentPage,
        setCurrentPage,
      }}
    >
      {children}
    </BettingContext.Provider>
  );
}

export function useBetting(): BettingContextType {
  const ctx = useContext(BettingContext);
  if (!ctx) throw new Error("useBetting must be used within BettingProvider");
  return ctx;
}
