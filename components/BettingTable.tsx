import React from 'react';
import { BetType, Chip, PlacedBet, GamePhase, QuantumMultiplier } from '../types';
import { getNumberColor, RED_NUMBERS, BLACK_NUMBERS } from '../constants-orginal';
import { getAnimalImagePath } from '../animalMapping';
import { chipMapping, chipValues } from '../chipMapping';

interface Props {
  currentBets: PlacedBet[];
  selectedChip: Chip;
  onPlaceBet: (type: BetType, numbers: string[], payout: number) => void;
  gamePhase: GamePhase;
  quantumMultipliers: QuantumMultiplier[];
  highlightedNumbers?: string[];
  heatmapActive?: boolean;
}

export const BettingTable: React.FC<Props> = ({
  currentBets, selectedChip, onPlaceBet, gamePhase, quantumMultipliers, highlightedNumbers, heatmapActive
}) => {
  const isInteractable = gamePhase === GamePhase.WAITING_FOR_BETS;

  const handleBet = (type: BetType, numbers: string[], payout: number) => {
    if (!isInteractable) return;
    onPlaceBet(type, numbers, payout);
  };

  // ✅ UPDATED: renderChipStack now uses your actual chip images
  const renderChipStack = (amount: number) => {
    // Sort chip values in descending order to find the largest that fits
    const sortedValues = [...chipValues].sort((a, b) => b - a);
    const bestChipValue = sortedValues.find(val => val <= amount) || chipValues[0];

    // Fallback to the smallest chip if no match
    const chipImage = chipMapping[bestChipValue] || chipMapping[chipValues[0]];

    // Format the amount label (e.g., 1k for 1000)
    const formatAmount = (amt: number): string => {
      if (amt >= 1000) return `${(amt / 1000).toFixed(0)}k`;
      return amt.toString();
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-bounce-short">
        {/* Drop Shadow for depth */}
        <div className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/60 translate-y-1 translate-x-1 blur-[1px]"></div>

        {/* Chip Image */}
        <div className="relative w-7 h-7 md:w-9 md:h-9 flex items-center justify-center">
          <img
            src={chipImage}
            alt={`${amount} chip`}
            className="w-full h-full object-contain z-10"
          />
          {/* Amount Label on top of chip */}
          <span className="absolute text-[9px] font-bold text-white drop-shadow-md z-20">
            {formatAmount(amount)}
          </span>
        </div>
      </div>
    );
  };

  const getBetAmount = (type: BetType, numbers: string[]) => {
    const bets = currentBets.filter(b => b.type === type && JSON.stringify(b.numbers.sort()) === JSON.stringify(numbers.sort()));
    if (bets.length === 0) return null;
    return bets.reduce((sum, b) => sum + b.amount, 0);
  };

  const renderCell = (numStr: string) => {
    const color = getNumberColor(numStr);
    const amount = getBetAmount(BetType.STRAIGHT, [numStr]);
    const multiplier = quantumMultipliers.find(q => q.number === numStr);
    const isHighlighted = highlightedNumbers?.includes(numStr);
    const animalImagePath = getAnimalImagePath(numStr);

    return (
      <div
        key={numStr}
        onClick={() => handleBet(BetType.STRAIGHT, [numStr], 35)}
        className={`
          relative h-20 md:h-24 flex flex-col items-center justify-center border border-neo-gold/20
          transition-all duration-200 cursor-pointer group
          hover:bg-neo-gold/10 hover:shadow-[inset_0_0_20px_rgba(226,182,89,0.2)]
          ${isHighlighted ? 'bg-neo-gold/40' : 'bg-transparent'}
        `}
      >
        {multiplier && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neo-accent/20 animate-pulse overflow-hidden">
            <span className="text-neo-accent font-bold text-xs drop-shadow-[0_0_5px_rgba(14,165,233,1)]">⚡{multiplier.multiplier}x</span>
            <div className="absolute inset-0 bg-white/10 -translate-x-full animate-[shimmer_1s_infinite]"></div>
          </div>
        )}

        {/* Animal Image */}
        {animalImagePath && (
          <div className="w-8 h-8 md:w-10 md:h-10 mb-1 flex items-center justify-center">
            <img
              src={animalImagePath}
              alt={`Animal ${numStr}`}
              className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-110"
            />
          </div>
        )}

        <span className={`font-display text-base md:text-lg font-bold drop-shadow-md transition-transform group-hover:scale-110 ${color === 'red' ? 'text-red-500' : 'text-gray-100'}`}>
          {numStr}
        </span>

        {amount && renderChipStack(amount)}
      </div>
    );
  };

  const renderLabel = (label: string, onClick: () => void, amount: number | null, rotate = false) => (
    <div onClick={onClick} className="relative flex-1 flex items-center justify-center bg-transparent hover:bg-white/5 cursor-pointer text-[10px] md:text-xs font-bold text-neo-gold border border-neo-gold/20 transition-colors">
      <span className={rotate ? "rotate-90 whitespace-nowrap" : ""}>{label}</span>
      {amount && renderChipStack(amount)}
    </div>
  );

  return (
    <div className="flex flex-col w-full select-none felt-texture p-4 rounded-xl border-[8px] border-[#1e293b] shadow-2xl relative overflow-hidden">
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>

      <div className="relative z-10 flex rounded overflow-hidden border-2 border-neo-gold/30 shadow-lg">

        {/* ZERO and DOUBLE ZERO (American Style) */}
        <div className="w-16 md:w-20 flex flex-col border-r border-neo-gold/30">
          {/* ZERO */}
          <div
            onClick={() => handleBet(BetType.ZERO, ["0"], 35)}
            className="flex-1 flex flex-col items-center justify-center border-b border-neo-gold/30 text-green-500 font-display font-bold hover:bg-green-900/30 cursor-pointer relative"
          >
            {/* Animal Image for Zero */}
            {getAnimalImagePath("0") && (
              <div className="w-8 h-8 md:w-10 md:h-10 mb-1 flex items-center justify-center">
                <img
                  src={getAnimalImagePath("0")}
                  alt="Animal 0"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            )}
            <span className="text-xl md:text-2xl">0</span>
            {getBetAmount(BetType.ZERO, ["0"]) && renderChipStack(getBetAmount(BetType.ZERO, ["0"])!)}
          </div>

          {/* DOUBLE ZERO */}
          <div
            onClick={() => handleBet(BetType.STRAIGHT, ["00"], 35)}
            className="flex-1 flex flex-col items-center justify-center text-green-500 font-display font-bold hover:bg-green-900/30 cursor-pointer relative"
          >
            {/* Animal Image for 00 */}
            {getAnimalImagePath("00") && (
              <div className="w-8 h-8 md:w-10 md:h-10 mb-1 flex items-center justify-center">
                <img
                  src={getAnimalImagePath("00")}
                  alt="Animal 00"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            )}
            <span className="text-xl md:text-2xl">00</span>
            {getBetAmount(BetType.STRAIGHT, ["00"]) && renderChipStack(getBetAmount(BetType.STRAIGHT, ["00"])!)}
          </div>
        </div>

        {/* MAIN NUMBERS */}
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-12">
            {[3, 2, 1].map(row => (
              <React.Fragment key={row}>
                {Array.from({ length: 12 }, (_, i) => (i * 3 + row).toString()).map(num => renderCell(num))}
              </React.Fragment>
            ))}
          </div>

          {/* DOZENS */}
          <div className="grid grid-cols-3 h-10 md:h-12 border-t border-neo-gold/30">
            {['1st 12', '2nd 12', '3rd 12'].map((label, idx) => {
              const nums = Array.from({ length: 12 }, (_, i) => (i + 1 + idx * 12).toString());
              return renderLabel(label, () => handleBet(BetType.DOZEN, nums, 2), getBetAmount(BetType.DOZEN, nums));
            })}
          </div>
        </div>

        {/* COLUMNS */}
        <div className="w-10 md:w-12 flex flex-col border-l border-neo-gold/30">
          {[3, 2, 1].map(row => {
            const nums = Array.from({ length: 12 }, (_, i) => (i * 3 + row).toString());
            return renderLabel("2 TO 1", () => handleBet(BetType.COLUMN, nums, 2), getBetAmount(BetType.COLUMN, nums), true);
          })}
          <div className="h-10 md:h-12"></div>
        </div>
      </div>

      {/* BOTTOM ROW: EVEN CHANCE */}
      <div className="grid grid-cols-6 mt-3 h-12 gap-3 relative z-10">
        {renderLabel("1-18", () => handleBet(BetType.HIGH_LOW, Array.from({ length: 18 }, (_, i) => (i + 1).toString()), 1), getBetAmount(BetType.HIGH_LOW, Array.from({ length: 18 }, (_, i) => (i + 1).toString())))}
        {renderLabel("EVEN", () => handleBet(BetType.EVEN_ODD, Array.from({ length: 36 }, (_, i) => (i + 1).toString()).filter(n => parseInt(n) % 2 === 0), 1), getBetAmount(BetType.EVEN_ODD, Array.from({ length: 36 }, (_, i) => (i + 1).toString()).filter(n => parseInt(n) % 2 === 0)))}

        {/* COLORS */}
        <div onClick={() => handleBet(BetType.RED_BLACK, RED_NUMBERS, 1)} className="relative border border-neo-gold/20 hover:bg-red-900/30 cursor-pointer flex items-center justify-center">
          <div className="w-8 h-8 bg-red-600 rotate-45 border-2 border-red-400 shadow-md transform transition-transform group-hover:scale-110"></div>
          {getBetAmount(BetType.RED_BLACK, RED_NUMBERS) && renderChipStack(getBetAmount(BetType.RED_BLACK, RED_NUMBERS)!)}
        </div>
        <div onClick={() => handleBet(BetType.RED_BLACK, BLACK_NUMBERS, 1)} className="relative border border-neo-gold/20 hover:bg-gray-800/30 cursor-pointer flex items-center justify-center">
          <div className="w-8 h-8 bg-black rotate-45 border-2 border-gray-600 shadow-md transform transition-transform group-hover:scale-110"></div>
          {getBetAmount(BetType.RED_BLACK, BLACK_NUMBERS) && renderChipStack(getBetAmount(BetType.RED_BLACK, BLACK_NUMBERS)!)}
        </div>

        {renderLabel("ODD", () => handleBet(BetType.EVEN_ODD, Array.from({ length: 36 }, (_, i) => (i + 1).toString()).filter(n => parseInt(n) % 2 !== 0), 1), getBetAmount(BetType.EVEN_ODD, Array.from({ length: 36 }, (_, i) => (i + 1).toString()).filter(n => parseInt(n) % 2 !== 0)))}
        {renderLabel("19-36", () => handleBet(BetType.HIGH_LOW, Array.from({ length: 18 }, (_, i) => (i + 19).toString()), 1), getBetAmount(BetType.HIGH_LOW, Array.from({ length: 18 }, (_, i) => (i + 19).toString())))}
      </div>
    </div>
  );
};