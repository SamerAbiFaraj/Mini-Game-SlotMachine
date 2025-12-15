
export enum GamePhase {
  LOADING = 'LOADING',
  WAITING_FOR_BETS = 'WAITING_FOR_BETS',
  BETS_CLOSED = 'BETS_CLOSED',
  SPINNING = 'SPINNING',
  RESULT_DISPLAY = 'RESULT_DISPLAY',
  SETTLING_BETS = 'SETTLING_BETS',
}

export enum BetType {
  STRAIGHT = 'STRAIGHT',
  SPLIT = 'SPLIT',
  STREET = 'STREET',
  CORNER = 'CORNER',
  LINE = 'LINE',
  COLUMN = 'COLUMN',
  DOZEN = 'DOZEN',
  RED_BLACK = 'RED_BLACK',
  EVEN_ODD = 'EVEN_ODD',
  HIGH_LOW = 'HIGH_LOW',
  ZERO = 'ZERO',
  VOISINS = 'VOISINS',
  TIERS = 'TIERS',
  ORPHELINS = 'ORPHELINS',
  NEIGHBORS = 'NEIGHBORS'
}

export interface Chip {
  value: number;
  color: string;
  borderColor: string;
}

export interface PlacedBet {
  id: string;
  type: BetType;
  numbers: string[];
  amount: number;
  chipValue: number;
  payoutRatio: number;
  status?: 'pending' | 'won' | 'lost';
}

export interface QuantumMultiplier {
  number: string;
  multiplier: number; // e.g., 50, 100, 500
}

export interface SavedBetLayout {
  name: string;
  bets: PlacedBet[];
}

export interface UserProfile {
  userId: string;
  username: string;
  avatarUrl?: string;
  currency: string;
  vipLevel: number;
}

export interface UserStats {
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  startBalance: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  betType: string;
  amount: number;
  currency: string;
  rank: number;
}

export interface GameState {
  phase: GamePhase;
  balance: number;
  currentBets: PlacedBet[];
  lastWinAmount: number;
  winningNumber: string | null;
  history: string[];
  selectedChip: number;
  totalBetAmount: number;
  timeLeft: number; 
  roundId: string;
}

export interface WheelNumber {
  number: string;
  color: 'red' | 'black' | 'green';
  angle: number; 
}

// Iframe Communication Types matching API Doc
export type OutgoingMessage = 
  | { type: 'IFRAME_READY', data: { iframeId: string, dimensions: { width: number, height: number } } }
  | { type: 'REQUEST_AUTH', data: { reason: string } }
  | { type: 'BET_PLACED', data: { betIds: string[], roundId: string, totalAmount: number, currency: string, betCount: number } }
  | { type: 'BET_WON', data: { betIds: string[], roundId: string, winningNumber: string, totalWinAmount: number, currency: string, profit: number } }
  | { type: 'BET_LOST', data: { betIds: string[], roundId: string, winningNumber: string, totalLossAmount: number, currency: string } }
  | { type: 'BALANCE_REQUEST', data: { currencies: string[] } }
  | { type: 'SESSION_WARNING', data: { warningType: string } };

export type IncomingMessage = 
  | { type: 'AUTH_TOKEN', data: { sessionToken: string, expiresAt: string } }
  | { type: 'BALANCE_UPDATE', data: { userId: string, balances: { currency: string, amount: string }[] } }
  | { type: 'ROUND_STATE_UPDATE', data: { roundId: string, state: string, timeRemainingSeconds: number } }
  | { type: 'BET_SETTLEMENT', data: { roundId: string, totalPayout: number, newBalance: { [key: string]: string } } }
  | { type: 'TOP_BETS_UPDATE', data: { roundId: string, topBets: any[] } };
