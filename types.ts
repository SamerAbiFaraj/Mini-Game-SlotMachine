
export type GamePhase = "Calm" | "Surge" | "Quantum";

export type GameState = "idle" | "spinning" | "resolvingWin" | "animatingBigWin";

export type SymbolId = "cat" | "dog" | "bird" | "alligator" | "whale" | "elephant" | "wild" | "quantum_wild";

// 3x3 Grid
export type ReelGrid = SymbolId[][];

export interface LineWin {
  lineId: number;
  symbolId: SymbolId;
  count: number;
  payout: number;
  coordinates: number[][]; // [row, col] pairs
}

export interface SpinResult {
  grid: ReelGrid;
  linesWon: LineWin[];
  totalWin: number;
  appliedModifiers: string[];
}

export interface SessionStats {
  totalSpins: number;
  totalBet: number;
  totalWin: number;
  mostFrequentPhase: GamePhase | null;
  lastActiveAt: string;
}

export interface GameConfig {
  volatilityProfile: "low" | "medium" | "high";
  bigWinThresholdMultiplier: number;
  betAmount: number;
}

// Messaging Protocol Types
export type ParentMessage = 
  | { type: "INIT"; payload: { sessionId: string; config?: Partial<GameConfig>; theme?: any } }
  | { type: "SET_MUTE"; payload: boolean }
  | { type: "REQUEST_STATS" }
  | { type: "END_SESSION" };

export type ChildMessage = 
  | { type: "SPIN_START"; payload: { sessionId: string; phase: GamePhase; balanceBefore: number } }
  | { type: "SPIN_END"; payload: { sessionId: string; phase: GamePhase; result: SpinResult; balanceAfter: number } }
  | { type: "BIG_WIN"; payload: { amount: number } }
  | { type: "SESSION_STATS"; payload: SessionStats };
