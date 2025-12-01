
import { GamePhase, ReelGrid, SpinResult, SymbolId, LineWin, GameConfig } from "../types";
import { PAYTABLE, PAYLINES, PAYOUT_3_WILDS, PHASE_MULTIPLIERS } from "../constants";
import { pickWeighted } from "./rng";

export const getPhaseFromTime = (elapsedMs: number): GamePhase => {
  const t = elapsedMs % 15000; // Match LOOP_DURATION_MS in constants
  if (t < 6000) return "Calm";   // 0-6s (40%)
  if (t < 11000) return "Surge"; // 6-11s (33%)
  return "Quantum";              // 11-15s (27%)
};

const getSymbolWeights = (phase: GamePhase, volatility: string): { value: SymbolId; weight: number }[] => {
  // Base weights (Standard profile)
  let weights: Record<SymbolId, number> = {
    cat: 30,
    dog: 25,
    bird: 20,
    alligator: 15,
    whale: 10,
    elephant: 5,
    wild: 2,
    quantum_wild: 0
  };

  // LOGIC ADJUSTMENTS:
  
  if (phase === "Calm") {
    // CALM: HIGH WIN PROBABILITY (Low Payout)
    // We boost Cat/Dog massively so lines form very frequently.
    weights.cat += 100; 
    weights.dog += 80;
    weights.bird += 40;
    weights.wild = 10;   
    // High tier is rare
    weights.whale = 1;
    weights.elephant = 0;
  } else if (phase === "Surge") {
    // SURGE: MEDIUM
    weights.alligator += 20;
    weights.whale += 10;
    weights.wild = 5;
  } else if (phase === "Quantum") {
    // QUANTUM: LOW WIN PROBABILITY (High Payout)
    // We reduce the weights of the "filler" animals (Cat/Dog) so they don't match often.
    // This creates "clutter" in the grid, leading to fewer lines.
    
    weights.cat = 10; 
    weights.dog = 10;
    weights.bird = 10;
    
    // However, we enable Quantum Wilds.
    weights.quantum_wild = 8; 
    weights.wild = 0; // No standard wilds
  }

  return Object.entries(weights).map(([value, weight]) => ({
    value: value as SymbolId,
    weight
  }));
};

const generateGrid = (phase: GamePhase, config: GameConfig): ReelGrid => {
  const weights = getSymbolWeights(phase, config.volatilityProfile);
  const grid: ReelGrid = [];
  
  for (let r = 0; r < 3; r++) {
    const row: SymbolId[] = [];
    for (let c = 0; c < 3; c++) {
      row.push(pickWeighted(weights));
    }
    grid.push(row);
  }
  return grid;
};

const calculateWins = (grid: ReelGrid): { totalWin: number; linesWon: LineWin[] } => {
  let totalWin = 0;
  const linesWon: LineWin[] = [];

  PAYLINES.forEach((line, index) => {
    const [c1, c2, c3] = line;
    const s1 = grid[c1[0]][c1[1]];
    const s2 = grid[c2[0]][c2[1]];
    const s3 = grid[c3[0]][c3[1]];

    const symbols = [s1, s2, s3];

    // Check for 3 Quantum Wilds (Jackpot)
    if (symbols.every(s => s === "quantum_wild")) {
      totalWin += PAYTABLE.quantum_wild;
      linesWon.push({ lineId: index, symbolId: "quantum_wild", count: 3, payout: PAYTABLE.quantum_wild, coordinates: line });
      return;
    }

    const nonWilds = symbols.filter(s => s !== "wild" && s !== "quantum_wild");
    
    // If all wilds
    if (nonWilds.length === 0) {
       totalWin += PAYOUT_3_WILDS;
       linesWon.push({ lineId: index, symbolId: "wild", count: 3, payout: PAYOUT_3_WILDS, coordinates: line });
       return;
    }

    const target = nonWilds[0];
    const isWin = symbols.every(s => s === target || s === "wild" || s === "quantum_wild");

    if (isWin) {
      const payout = PAYTABLE[target];
      totalWin += payout;
      linesWon.push({ lineId: index, symbolId: target, count: 3, payout, coordinates: line });
    }
  });

  return { totalWin, linesWon };
};

export const resolveSpin = (phase: GamePhase, config: GameConfig): SpinResult => {
  const grid = generateGrid(phase, config);
  
  const { totalWin: baseWin, linesWon } = calculateWins(grid);
  
  // FORMULA: Symbol Value * Bet * Multiplier
  const multiplier = PHASE_MULTIPLIERS[phase];
  const finalWin = baseWin * config.betAmount * multiplier;

  const appliedModifiers = [phase, `x${multiplier}`];

  return {
    grid,
    linesWon,
    totalWin: finalWin,
    appliedModifiers
  };
};
