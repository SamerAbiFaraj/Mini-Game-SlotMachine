
import { SymbolId, GamePhase } from "./types";

export const LOOP_DURATION_MS = 15000; 

export const PHASE_THRESHOLDS = {
  Calm: 6000,    // 0 - 6s
  Surge: 11000,   // 6 - 11s
  Quantum: 15000 // 11 - 15s
};

export const SYMBOLS: SymbolId[] = [
  "cat", "dog", "bird", "alligator", "whale", "elephant", "wild", "quantum_wild"
];

// Payout multipliers for 3-of-a-kind
export const PAYTABLE: Record<SymbolId, number> = {
  cat: 2,        // Low
  dog: 4,
  bird: 8,       // Mid
  alligator: 15,
  whale: 30,     // High
  elephant: 50,  // Ultra
  wild: 0,
  quantum_wild: 100
};

export const PAYOUT_3_WILDS = 80;

// Betting Options
export const BET_OPTIONS = [0.25, 0.50, 1.00, 5.00, 10.00, 25.00];

// Phase Multipliers
export const PHASE_MULTIPLIERS: Record<GamePhase, number> = {
  Calm: 1,
  Surge: 2,
  Quantum: 5
};

// 5 Standard Paylines
export const PAYLINES = [
  [[0,0], [0,1], [0,2]], // Top
  [[1,0], [1,1], [1,2]], // Middle
  [[2,0], [2,1], [2,2]], // Bottom
  [[0,0], [1,1], [2,2]], // Diagonal TL-BR
  [[2,0], [1,1], [0,2]]  // Diagonal BL-TR
];

// Visual Themes per Phase - High Contrast, Neon
export const PHASE_STYLES = {
  Calm: {
    accent: "text-cyan-400",
    glow: "shadow-cyan-500/50",
    border: "border-cyan-500/50",
    bg: "bg-cyan-900", // Darker for BG
    gradient: "from-cyan-500 to-blue-600",
    ring: "text-cyan-500",
    shadow: "shadow-[0_0_30px_rgba(34,211,238,0.4)]"
  },
  Surge: {
    accent: "text-amber-400",
    glow: "shadow-amber-500/80",
    border: "border-amber-500/80",
    bg: "bg-amber-900",
    gradient: "from-amber-500 to-orange-600",
    ring: "text-amber-500",
    shadow: "shadow-[0_0_50px_rgba(245,158,11,0.6)]"
  },
  Quantum: {
    accent: "text-fuchsia-400",
    glow: "shadow-fuchsia-500/80",
    border: "border-fuchsia-500/80",
    bg: "bg-fuchsia-900",
    gradient: "from-fuchsia-500 to-violet-600",
    ring: "text-fuchsia-500",
    shadow: "shadow-[0_0_50px_rgba(217,70,239,0.6)]"
  }
};
