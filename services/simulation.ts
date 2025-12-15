
import { GamePhase, LeaderboardEntry, QuantumMultiplier } from "../types";
import { GAME_CONFIG, WHEEL_ORDER, RED_NUMBERS, BLACK_NUMBERS } from "../constants-orginal";

type StateListener = (phase: GamePhase, timeLeft: number, result?: string, roundId?: string, multipliers?: QuantumMultiplier[]) => void;
type LeaderboardListener = (entries: LeaderboardEntry[]) => void;

class SimulationService {
  private static instance: SimulationService;
  private phase: GamePhase = GamePhase.WAITING_FOR_BETS;
  private timeLeft: number = GAME_CONFIG.BETTING_DURATION_SEC;
  private timerInterval: any = null;
  private stateListeners: StateListener[] = [];
  private leaderboardListeners: LeaderboardListener[] = [];
  private currentLeaderboard: LeaderboardEntry[] = [];
  private currentMultipliers: QuantumMultiplier[] = [];

  // Mock Round Data
  private currentRoundId: string = `round_${Date.now()}`;

  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  public startSimulation() {
    if (this.timerInterval) return;
    this.runGameLoop();
    this.startBotBetting();
  }

  public subscribeState(callback: StateListener) {
    this.stateListeners.push(callback);
    callback(this.phase, this.timeLeft, undefined, this.currentRoundId, this.currentMultipliers);
    return () => {
      this.stateListeners = this.stateListeners.filter(cb => cb !== callback);
    };
  }

  public subscribeLeaderboard(callback: LeaderboardListener) {
    this.leaderboardListeners.push(callback);
    return () => {
      this.leaderboardListeners = this.leaderboardListeners.filter(cb => cb !== callback);
    };
  }

  private notifyState(result?: string) {
    this.stateListeners.forEach(cb => cb(this.phase, this.timeLeft, result, this.currentRoundId, this.currentMultipliers));
  }

  private notifyLeaderboard() {
    this.leaderboardListeners.forEach(cb => cb([...this.currentLeaderboard]));
  }

  private generateQuantumMultipliers() {
    // Generate 1 to 3 multipliers
    const count = Math.floor(Math.random() * 3) + 1;
    const multipliers: QuantumMultiplier[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < count; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * WHEEL_ORDER.length);
      } while (usedIndices.has(idx));
      usedIndices.add(idx);

      const val = Math.random() > 0.8 ? 500 : (Math.random() > 0.5 ? 100 : 50);
      multipliers.push({
        number: WHEEL_ORDER[idx],
        multiplier: val
      });
    }
    this.currentMultipliers = multipliers;
  }

  private runGameLoop() {
    this.timerInterval = setInterval(() => {
      if (this.phase === GamePhase.WAITING_FOR_BETS) {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.phase = GamePhase.BETS_CLOSED;
          this.timeLeft = 0;
          this.notifyState();

          setTimeout(() => {
            this.phase = GamePhase.SPINNING;

            // Trigger Quantum Multipliers visual
            this.generateQuantumMultipliers();
            const winningNum = this.getMockResult();
            this.notifyState(winningNum);

            // Wait for spin animation
            setTimeout(() => {
              this.phase = GamePhase.RESULT_DISPLAY;
              this.timeLeft = GAME_CONFIG.RESULT_DURATION_MS / 1000;
              this.notifyState(winningNum);

              // End Round
              setTimeout(() => {
                this.resetRound();
              }, GAME_CONFIG.RESULT_DURATION_MS);

            }, GAME_CONFIG.SPIN_DURATION_MS);
          }, 1000);
        } else {
          this.notifyState();
        }
      }
    }, 1000);
  }

  private resetRound() {
    this.phase = GamePhase.WAITING_FOR_BETS;
    this.timeLeft = GAME_CONFIG.BETTING_DURATION_SEC;
    this.currentRoundId = `round_${Date.now()}`;
    this.currentLeaderboard = [];
    this.currentMultipliers = [];
    this.notifyLeaderboard();
    this.notifyState();
  }

  private getMockResult() {
    const idx = Math.floor(Math.random() * WHEEL_ORDER.length);
    return WHEEL_ORDER[idx];
  }

  private startBotBetting() {
    setInterval(() => {
      if (this.phase !== GamePhase.WAITING_FOR_BETS) return;

      if (Math.random() > 0.7) {
        const botName = GAME_CONFIG.BOT_NAMES[Math.floor(Math.random() * GAME_CONFIG.BOT_NAMES.length)];
        const amount = Math.floor(Math.random() * 500) + 10;
        const types = ['Red', 'Black', 'Zero', 'Straight 17', 'Straight 23', 'Even', 'Odd', 'Tiers', 'Orphelins'];
        const type = types[Math.floor(Math.random() * types.length)];

        this.currentLeaderboard.push({
          userId: botName.toLowerCase(),
          username: botName,
          betType: type,
          amount: amount,
          currency: GAME_CONFIG.CURRENCY,
          rank: this.currentLeaderboard.length + 1
        });

        this.currentLeaderboard.sort((a, b) => b.amount - a.amount);
        this.currentLeaderboard = this.currentLeaderboard.slice(0, 10);
        this.currentLeaderboard.forEach((entry, i) => entry.rank = i + 1);

        this.notifyLeaderboard();
      }
    }, 2000);
  }
}

export const simulation = SimulationService.getInstance();
