import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import AccessControl "./authorization/access-control";
import MixinAuth "./authorization/MixinAuthorization";
import Stripe "./stripe/stripe";
import OutCall "./http-outcalls/outcall";

persistent actor BetX {

  // ── Access control ──────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuth(accessControlState);

  // ── Types ───────────────────────────────────────────────────────────────────

  type UserProfile = {
    principal_ : Principal;
    displayName : Text;
    var balance : Int;
    createdAt : Int;
  };

  type SportEvent = {
    eventId : Nat;
    homeTeam : Text;
    awayTeam : Text;
    league : Text;
    sport : Text;
    startTime : Int;
    var status : Text;
    var homeOdds : Float;
    var drawOdds : Float;
    var awayOdds : Float;
    var homeScore : Nat;
    var awayScore : Nat;
    var result : Text;
  };

  type Bet = {
    betId : Nat;
    userId : Principal;
    eventId : Nat;
    selection : Text;
    oddsAtBet : Float;
    stake : Int;
    potentialPayout : Int;
    var betStatus : Text;
    placedAt : Int;
    var settledAt : Int;
  };

  type Transaction = {
    txId : Nat;
    userId : Principal;
    txType : Text;
    amount : Int;
    description : Text;
    createdAt : Int;
    var txStatus : Text;
  };

  type WithdrawalRequest = {
    reqId : Nat;
    userId : Principal;
    amount : Int;
    txId : Nat;
    requestedAt : Int;
    var reqStatus : Text;
  };

  // ── State ───────────────────────────────────────────────────────────────────

  var userProfiles = Map.empty<Principal, UserProfile>();
  var events = Map.empty<Nat, SportEvent>();
  var bets = Map.empty<Nat, Bet>();
  var txns = Map.empty<Nat, Transaction>();
  var withdrawals = Map.empty<Nat, WithdrawalRequest>();

  var nextEventId : Nat = 1;
  var nextBetId : Nat = 1;
  var nextTxId : Nat = 1;
  var nextWithdrawalId : Nat = 1;

  var stripeSecretKey : Text = "";

  // ── Helpers ─────────────────────────────────────────────────────────────────

  func requireUser(caller : Principal) : UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Not authenticated") };
    switch (userProfiles.get(caller)) {
      case (?p) { p };
      case (null) { Runtime.trap("User not registered") };
    };
  };

  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Admin access required");
    };
  };

  func recordTx(userId : Principal, txType : Text, amount : Int, description : Text, status_ : Text) : Nat {
    let id = nextTxId;
    nextTxId += 1;
    let now : Int = Time.now();
    txns.add(id, {
      txId = id; userId; txType; amount; description;
      createdAt = now; var txStatus = status_;
    });
    id;
  };

  func pseudoRng(seed : Int) : Nat {
    let v = (seed * 1664525 + 1013904223) % 2147483647;
    Int.abs(v) % 100;
  };

  func mulFloat(a : Int, b : Float) : Int {
    (a.toFloat() * b).toInt();
  };

  // ── User registration ────────────────────────────────────────────────────────

  public shared ({ caller }) func register(displayName : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Cannot register anonymously") };
    switch (userProfiles.get(caller)) {
      case (?_) { Runtime.trap("Already registered") };
      case (null) {
        let now : Int = Time.now();
        let bal : Int = 100000;
        userProfiles.add(caller, {
          principal_ = caller; displayName;
          var balance = bal; createdAt = now;
        });
      };
    };
  };

  public query ({ caller }) func getMyProfile() : async {
    principal_ : Principal; displayName : Text; balance : Int; createdAt : Int;
  } {
    let p = requireUser(caller);
    { principal_ = p.principal_; displayName = p.displayName; balance = p.balance; createdAt = p.createdAt };
  };

  public query ({ caller }) func getAllUsers() : async [{
    principal_ : Principal; displayName : Text; balance : Int; createdAt : Int;
  }] {
    requireAdmin(caller);
    userProfiles.values().map(func(p : UserProfile) : {
      principal_ : Principal; displayName : Text; balance : Int; createdAt : Int;
    } {
      { principal_ = p.principal_; displayName = p.displayName; balance = p.balance; createdAt = p.createdAt }
    }).toArray();
  };

  public shared ({ caller }) func adminCreditBalance(userId : Principal, amountCents : Int, note : Text) : async () {
    requireAdmin(caller);
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) {
        p.balance += amountCents;
        ignore recordTx(userId, "Deposit", amountCents, "Admin credit: " # note, "Completed");
      };
    };
  };

  // ── Sports events ────────────────────────────────────────────────────────────

  public shared ({ caller }) func createEvent(
    homeTeam : Text, awayTeam : Text, league : Text, sport : Text,
    startTime : Int, homeOdds : Float, drawOdds : Float, awayOdds : Float,
  ) : async Nat {
    requireAdmin(caller);
    let id = nextEventId;
    nextEventId += 1;
    events.add(id, {
      eventId = id; homeTeam; awayTeam; league; sport; startTime;
      var status = "Upcoming";
      var homeOdds; var drawOdds; var awayOdds;
      var homeScore = 0; var awayScore = 0;
      var result = "None";
    });
    id;
  };

  public shared ({ caller }) func updateEventOdds(eventId : Nat, homeOdds : Float, drawOdds : Float, awayOdds : Float) : async () {
    requireAdmin(caller);
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?e) { e.homeOdds := homeOdds; e.drawOdds := drawOdds; e.awayOdds := awayOdds };
    };
  };

  public shared ({ caller }) func updateEventStatus(eventId : Nat, newStatus : Text) : async () {
    requireAdmin(caller);
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?e) { e.status := newStatus };
    };
  };

  public shared ({ caller }) func settleEvent(eventId : Nat, result : Text, homeScore : Nat, awayScore : Nat) : async Nat {
    requireAdmin(caller);
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?e) {
        if (e.status == "Settled") { Runtime.trap("Already settled") };
        e.status := "Settled";
        e.result := result;
        e.homeScore := homeScore;
        e.awayScore := awayScore;
        var count : Nat = 0;
        let now : Int = Time.now();
        for (b in bets.values()) {
          if (b.eventId == eventId and b.betStatus == "Pending") {
            b.settledAt := now;
            if (b.selection == result) {
              b.betStatus := "Won";
              switch (userProfiles.get(b.userId)) {
                case (?p) {
                  p.balance += b.potentialPayout;
                  ignore recordTx(b.userId, "BetWon", b.potentialPayout,
                    "Won bet #" # b.betId.toText() # " on " # e.homeTeam # " vs " # e.awayTeam, "Completed");
                };
                case (null) {};
              };
            } else {
              b.betStatus := "Lost";
            };
            count += 1;
          };
        };
        count;
      };
    };
  };

  public query func listEvents(statusFilter : Text, sportFilter : Text) : async [{
    eventId : Nat; homeTeam : Text; awayTeam : Text; league : Text; sport : Text;
    startTime : Int; status : Text; homeOdds : Float; drawOdds : Float; awayOdds : Float;
    homeScore : Nat; awayScore : Nat; result : Text;
  }] {
    type EventRow = {
      eventId : Nat; homeTeam : Text; awayTeam : Text; league : Text; sport : Text;
      startTime : Int; status : Text; homeOdds : Float; drawOdds : Float; awayOdds : Float;
      homeScore : Nat; awayScore : Nat; result : Text;
    };
    events.values().filter(func(e : SportEvent) : Bool {
      (statusFilter == "" or e.status == statusFilter) and
      (sportFilter == "" or e.sport == sportFilter)
    }).map(func(e : SportEvent) : EventRow {
      { eventId = e.eventId; homeTeam = e.homeTeam; awayTeam = e.awayTeam; league = e.league;
        sport = e.sport; startTime = e.startTime; status = e.status; homeOdds = e.homeOdds;
        drawOdds = e.drawOdds; awayOdds = e.awayOdds; homeScore = e.homeScore;
        awayScore = e.awayScore; result = e.result }
    }).toArray();
  };

  public query func getEvent(eventId : Nat) : async ?{
    eventId : Nat; homeTeam : Text; awayTeam : Text; league : Text; sport : Text;
    startTime : Int; status : Text; homeOdds : Float; drawOdds : Float; awayOdds : Float;
    homeScore : Nat; awayScore : Nat; result : Text;
  } {
    type EventRow = {
      eventId : Nat; homeTeam : Text; awayTeam : Text; league : Text; sport : Text;
      startTime : Int; status : Text; homeOdds : Float; drawOdds : Float; awayOdds : Float;
      homeScore : Nat; awayScore : Nat; result : Text;
    };
    switch (events.get(eventId)) {
      case (null) { null };
      case (?e) {
        ?({ eventId = e.eventId; homeTeam = e.homeTeam; awayTeam = e.awayTeam; league = e.league;
           sport = e.sport; startTime = e.startTime; status = e.status; homeOdds = e.homeOdds;
           drawOdds = e.drawOdds; awayOdds = e.awayOdds; homeScore = e.homeScore;
           awayScore = e.awayScore; result = e.result } : EventRow);
      };
    };
  };

  // ── Betting engine ───────────────────────────────────────────────────────────

  public shared ({ caller }) func placeBet(eventId : Nat, selection : Text, stakeCents : Int) : async Nat {
    let p = requireUser(caller);
    if (stakeCents < 100) { Runtime.trap("Minimum bet is $1.00") };
    if (p.balance < stakeCents) { Runtime.trap("Insufficient balance") };
    if (selection != "Home" and selection != "Draw" and selection != "Away") {
      Runtime.trap("Selection must be Home, Draw, or Away");
    };
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?e) {
        if (e.status != "Upcoming" and e.status != "Live") {
          Runtime.trap("Event not open for betting");
        };
        let odds : Float = switch (selection) {
          case ("Home") { e.homeOdds };
          case ("Draw") { e.drawOdds };
          case (_)      { e.awayOdds };
        };
        let payout : Int = mulFloat(stakeCents, odds);
        p.balance -= stakeCents;
        let id = nextBetId;
        nextBetId += 1;
        let now : Int = Time.now();
        let zero : Int = 0;
        bets.add(id, {
          betId = id; userId = caller; eventId; selection;
          oddsAtBet = odds; stake = stakeCents; potentialPayout = payout;
          var betStatus = "Pending"; placedAt = now; var settledAt = zero;
        });
        ignore recordTx(caller, "BetPlaced", -stakeCents,
          "Bet #" # id.toText() # " on " # e.homeTeam # " vs " # e.awayTeam # " (" # selection # ")",
          "Completed");
        id;
      };
    };
  };

  public query ({ caller }) func getMyBets() : async [{
    betId : Nat; eventId : Nat; selection : Text; oddsAtBet : Float;
    stake : Int; potentialPayout : Int; betStatus : Text; placedAt : Int; settledAt : Int;
  }] {
    type BetRow = {
      betId : Nat; eventId : Nat; selection : Text; oddsAtBet : Float;
      stake : Int; potentialPayout : Int; betStatus : Text; placedAt : Int; settledAt : Int;
    };
    bets.values().filter(func(b : Bet) : Bool { b.userId == caller }).map(func(b : Bet) : BetRow {
      { betId = b.betId; eventId = b.eventId; selection = b.selection; oddsAtBet = b.oddsAtBet;
        stake = b.stake; potentialPayout = b.potentialPayout; betStatus = b.betStatus;
        placedAt = b.placedAt; settledAt = b.settledAt }
    }).toArray();
  };

  public query ({ caller }) func getAllBets() : async [{
    betId : Nat; userId : Principal; eventId : Nat; selection : Text; oddsAtBet : Float;
    stake : Int; potentialPayout : Int; betStatus : Text; placedAt : Int; settledAt : Int;
  }] {
    requireAdmin(caller);
    type BetRow = {
      betId : Nat; userId : Principal; eventId : Nat; selection : Text; oddsAtBet : Float;
      stake : Int; potentialPayout : Int; betStatus : Text; placedAt : Int; settledAt : Int;
    };
    bets.values().map(func(b : Bet) : BetRow {
      { betId = b.betId; userId = b.userId; eventId = b.eventId; selection = b.selection;
        oddsAtBet = b.oddsAtBet; stake = b.stake; potentialPayout = b.potentialPayout;
        betStatus = b.betStatus; placedAt = b.placedAt; settledAt = b.settledAt }
    }).toArray();
  };

  // ── Wallet ──────────────────────────────────────────────────────────────────

  public query ({ caller }) func getMyTransactions() : async [{
    txId : Nat; txType : Text; amount : Int; description : Text; createdAt : Int; txStatus : Text;
  }] {
    type TxRow = {
      txId : Nat; txType : Text; amount : Int; description : Text; createdAt : Int; txStatus : Text;
    };
    txns.values().filter(func(t : Transaction) : Bool { t.userId == caller }).map(func(t : Transaction) : TxRow {
      { txId = t.txId; txType = t.txType; amount = t.amount; description = t.description;
        createdAt = t.createdAt; txStatus = t.txStatus }
    }).toArray();
  };

  public query ({ caller }) func getAllTransactions() : async [{
    txId : Nat; userId : Principal; txType : Text; amount : Int; description : Text; createdAt : Int; txStatus : Text;
  }] {
    requireAdmin(caller);
    type TxRow = {
      txId : Nat; userId : Principal; txType : Text; amount : Int; description : Text; createdAt : Int; txStatus : Text;
    };
    txns.values().map(func(t : Transaction) : TxRow {
      { txId = t.txId; userId = t.userId; txType = t.txType; amount = t.amount;
        description = t.description; createdAt = t.createdAt; txStatus = t.txStatus }
    }).toArray();
  };

  public shared ({ caller }) func requestWithdrawal(amountCents : Int) : async Nat {
    let p = requireUser(caller);
    if (amountCents < 500) { Runtime.trap("Minimum withdrawal is $5.00") };
    if (p.balance < amountCents) { Runtime.trap("Insufficient balance") };
    p.balance -= amountCents;
    let txId = recordTx(caller, "Withdrawal", -amountCents, "Withdrawal request", "Pending");
    let id = nextWithdrawalId;
    nextWithdrawalId += 1;
    let now : Int = Time.now();
    withdrawals.add(id, {
      reqId = id; userId = caller; amount = amountCents; txId;
      requestedAt = now; var reqStatus = "Pending";
    });
    id;
  };

  public shared ({ caller }) func adminApproveWithdrawal(reqId : Nat) : async () {
    requireAdmin(caller);
    switch (withdrawals.get(reqId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) {
        if (r.reqStatus != "Pending") { Runtime.trap("Already processed") };
        r.reqStatus := "Approved";
        switch (txns.get(r.txId)) {
          case (?t) { t.txStatus := "Completed" };
          case (null) {};
        };
      };
    };
  };

  public shared ({ caller }) func adminRejectWithdrawal(reqId : Nat) : async () {
    requireAdmin(caller);
    switch (withdrawals.get(reqId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) {
        if (r.reqStatus != "Pending") { Runtime.trap("Already processed") };
        r.reqStatus := "Rejected";
        switch (userProfiles.get(r.userId)) {
          case (?p) {
            p.balance += r.amount;
            ignore recordTx(r.userId, "Refund", r.amount, "Withdrawal rejected - refunded", "Completed");
          };
          case (null) {};
        };
        switch (txns.get(r.txId)) {
          case (?t) { t.txStatus := "Failed" };
          case (null) {};
        };
      };
    };
  };

  public query ({ caller }) func getPendingWithdrawals() : async [{
    reqId : Nat; userId : Principal; amount : Int; requestedAt : Int; reqStatus : Text;
  }] {
    requireAdmin(caller);
    type WRow = { reqId : Nat; userId : Principal; amount : Int; requestedAt : Int; reqStatus : Text };
    withdrawals.values().filter(func(r : WithdrawalRequest) : Bool { r.reqStatus == "Pending" }).map(
      func(r : WithdrawalRequest) : WRow {
        { reqId = r.reqId; userId = r.userId; amount = r.amount; requestedAt = r.requestedAt; reqStatus = r.reqStatus }
      }
    ).toArray();
  };

  // ── Casino games ─────────────────────────────────────────────────────────────

  public shared ({ caller }) func playCoinFlip(betCents : Int) : async {
    won : Bool; newBalance : Int; message : Text;
  } {
    let p = requireUser(caller);
    if (betCents < 100) { Runtime.trap("Minimum bet is $1.00") };
    if (p.balance < betCents) { Runtime.trap("Insufficient balance") };
    p.balance -= betCents;
    let now : Int = Time.now();
    let won = pseudoRng(now) < 50;
    if (won) {
      p.balance += betCents * 2;
      ignore recordTx(caller, "CasinoWin", betCents, "Coin flip WIN", "Completed");
      { won = true; newBalance = p.balance; message = "Heads! You doubled your bet!" }
    } else {
      ignore recordTx(caller, "CasinoLoss", -betCents, "Coin flip LOSS", "Completed");
      { won = false; newBalance = p.balance; message = "Tails. Better luck next time." }
    };
  };

  public shared ({ caller }) func playDiceRoll(betCents : Int, betOn : Text) : async {
    won : Bool; dice1 : Nat; dice2 : Nat; total : Nat; newBalance : Int; message : Text;
  } {
    let p = requireUser(caller);
    if (betCents < 100) { Runtime.trap("Minimum bet is $1.00") };
    if (p.balance < betCents) { Runtime.trap("Insufficient balance") };
    if (betOn != "Over7" and betOn != "Under7") { Runtime.trap("Bet must be Over7 or Under7") };
    p.balance -= betCents;
    let now : Int = Time.now();
    let dice1 = (pseudoRng(now) % 6) + 1;
    let dice2 = (pseudoRng(now + 999983) % 6) + 1;
    let total = dice1 + dice2;
    let won = (betOn == "Over7" and total > 7) or (betOn == "Under7" and total < 7);
    if (won) {
      let payout : Int = mulFloat(betCents, 1.8);
      p.balance += payout;
      ignore recordTx(caller, "CasinoWin", payout - betCents,
        "Dice roll " # betOn # " WIN (rolled " # total.toText() # ")", "Completed");
      { won = true; dice1; dice2; total; newBalance = p.balance; message = "Rolled " # total.toText() # ". You win!" }
    } else {
      ignore recordTx(caller, "CasinoLoss", -betCents,
        "Dice roll " # betOn # " LOSS (rolled " # total.toText() # ")", "Completed");
      { won = false; dice1; dice2; total; newBalance = p.balance; message = "Rolled " # total.toText() # ". You lose." }
    };
  };

  // ── Stripe deposit ────────────────────────────────────────────────────────────

  public shared ({ caller }) func setStripeKey(key : Text) : async () {
    requireAdmin(caller);
    stripeSecretKey := key;
  };

  public query func transformResponse(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createDepositSession(amountCents : Nat, successUrl : Text, cancelUrl : Text) : async Text {
    ignore requireUser(caller);
    if (stripeSecretKey == "") { Runtime.trap("Stripe not configured") };
    let cfg : Stripe.StripeConfiguration = { secretKey = stripeSecretKey; allowedCountries = ["US", "GB", "CA"] };
    let items : [Stripe.ShoppingItem] = [{
      currency = "usd"; productName = "BetX Deposit";
      productDescription = "Add funds to your BetX wallet";
      priceInCents = amountCents; quantity = 1;
    }];
    await Stripe.createCheckoutSession(cfg, caller, items, successUrl, cancelUrl, transformResponse);
  };

  public shared ({ caller }) func confirmDeposit(sessionId : Text) : async { success : Bool; message : Text } {
    let p = requireUser(caller);
    if (stripeSecretKey == "") { Runtime.trap("Stripe not configured") };
    let cfg : Stripe.StripeConfiguration = { secretKey = stripeSecretKey; allowedCountries = ["US", "GB", "CA"] };
    let result = await Stripe.getSessionStatus(cfg, sessionId, transformResponse);
    switch (result) {
      case (#completed(_)) {
        let amount : Int = 1000;
        p.balance += amount;
        ignore recordTx(caller, "Deposit", amount, "Stripe deposit: " # sessionId, "Completed");
        { success = true; message = "Deposit successful!" }
      };
      case (#failed({ error })) {
        { success = false; message = "Payment failed: " # error }
      };
    };
  };

  // ── Admin stats ───────────────────────────────────────────────────────────────

  public query ({ caller }) func getAdminStats() : async {
    totalUsers : Nat; totalBets : Nat; totalWagered : Int;
    totalPayouts : Int; activeEvents : Nat; pendingWithdrawals : Nat;
  } {
    requireAdmin(caller);
    var wagered : Int = 0;
    var payouts : Int = 0;
    for (b in bets.values()) {
      wagered += b.stake;
      if (b.betStatus == "Won") { payouts += b.potentialPayout };
    };
    var active : Nat = 0;
    for (e in events.values()) {
      if (e.status == "Upcoming" or e.status == "Live") { active += 1 };
    };
    var pending : Nat = 0;
    for (r in withdrawals.values()) {
      if (r.reqStatus == "Pending") { pending += 1 };
    };
    { totalUsers = userProfiles.size(); totalBets = bets.size();
      totalWagered = wagered; totalPayouts = payouts;
      activeEvents = active; pendingWithdrawals = pending }
  };

  // ── Leaderboard ───────────────────────────────────────────────────────────────

  type LeaderRow = { displayName : Text; totalWon : Int; principal_ : Principal };

  public query func getLeaderboard() : async [LeaderRow] {
    let winMap = Map.empty<Principal, Int>();
    for (t in txns.values()) {
      if (t.txType == "BetWon") {
        switch (winMap.get(t.userId)) {
          case (?v) { winMap.add(t.userId, v + t.amount) };
          case (null) { winMap.add(t.userId, t.amount) };
        };
      };
    };
    // Build array from map
    var board : [LeaderRow] = [];
    for ((uid, won) in winMap.entries()) {
      switch (userProfiles.get(uid)) {
        case (?p) {
          let row : LeaderRow = { displayName = p.displayName; totalWon = won; principal_ = uid };
          board := Array.tabulate(board.size() + 1, func(k : Nat) : LeaderRow {
            if (k < board.size()) { board[k] } else { row }
          });
        };
        case (null) {};
      };
    };
    // Insertion sort descending
    let n = board.size();
    var i = 1;
    while (i < n) {
      let key = board[i];
      var j = i;
      while (j > 0 and board[j - 1].totalWon < key.totalWon) {
        let jMinus1 = board[j - 1];
        board := Array.tabulate(n, func(k : Nat) : LeaderRow {
          if (k == j) { jMinus1 } else { board[k] }
        });
        j -= 1;
      };
      board := Array.tabulate(n, func(k : Nat) : LeaderRow {
        if (k == j) { key } else { board[k] }
      });
      i += 1;
    };
    if (n <= 10) { board }
    else { Array.tabulate(10, func(k : Nat) : LeaderRow { board[k] }) };
  };

  // ── Seed demo data ─────────────────────────────────────────────────────────────

  public shared ({ caller }) func seedDemoData() : async () {
    requireAdmin(caller);
    let h : Int = 3_600_000_000_000;
    let now : Int = Time.now();
    ignore await createEvent("Manchester United", "Arsenal",   "Premier League",   "Football",   now + 2 * h, 2.10, 3.40, 3.20);
    ignore await createEvent("Real Madrid",       "Barcelona", "La Liga",          "Football",   now + 4 * h, 2.40, 3.20, 2.80);
    ignore await createEvent("Lakers",            "Warriors",  "NBA",              "Basketball", now + 1 * h, 1.85, 0.0,  1.95);
    ignore await createEvent("Djokovic",          "Alcaraz",   "Wimbledon",        "Tennis",     now + 3 * h, 1.70, 0.0,  2.10);
    ignore await createEvent("PSG",               "Bayern",    "Champions League", "Football",   now + 6 * h, 2.60, 3.10, 2.50);
    ignore await createEvent("Celtics",           "Heat",      "NBA",              "Basketball", now + 2 * h, 1.75, 0.0,  2.05);
  };
};
