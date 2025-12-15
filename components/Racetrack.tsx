import React, { useState } from 'react';
import { WHEEL_ORDER, getNumberColor, SECTORS } from '../constants-orginal';
import { BetType } from '../types';

interface Props {
  onBet: (type: BetType, numbers: string[], payout: number) => void;
  onHoverNumbers: (nums: string[]) => void;
}

export const Racetrack: React.FC<Props> = ({ onBet, onHoverNumbers }) => {
  const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);

  const CX = 300;
  const CY = 150;
  const RX = 280;
  const RY = 130;

  const getCoordinates = (index: number, count: number, radiusX: number, radiusY: number) => {
    const angleOffset = -Math.PI / 2;
    const angle = (index / count) * 2 * Math.PI + angleOffset;
    return {
      x: CX + radiusX * Math.cos(angle),
      y: CY + radiusY * Math.sin(angle),
      angle
    };
  };

  const handleSectorBet = (sectorName: string, type: BetType) => {
    const nums = SECTORS[sectorName as keyof typeof SECTORS];
    if (nums) onBet(type, nums, 35);
  };

  const handleSectorHover = (sectorName: string | null) => {
    if (!sectorName) {
      onHoverNumbers([]);
      return;
    }
    const nums = SECTORS[sectorName as keyof typeof SECTORS];
    if (nums) onHoverNumbers(nums);
  };

  const renderWheelNumbers = () => {
    return WHEEL_ORDER.map((num, idx) => {
      const coords = getCoordinates(idx, WHEEL_ORDER.length, RX, RY);
      const color = getNumberColor(num);
      const isHovered = hoveredNumber === num;

      let textColor = 'fill-white/60';
      if (color === 'red') textColor = 'fill-red-400';
      if (color === 'green') textColor = 'fill-green-400';
      if (isHovered) textColor = 'fill-white font-bold drop-shadow-md';

      return (
        <g
          key={num}
          onClick={() => onBet(BetType.STRAIGHT, [num], 35)}
          onMouseEnter={() => { setHoveredNumber(num); onHoverNumbers([num]); }}
          onMouseLeave={() => { setHoveredNumber(null); onHoverNumbers([]); }}
          className="cursor-pointer transition-all hover:scale-110 origin-center"
        >
          <circle cx={coords.x} cy={coords.y} r={16} fill="transparent" />
          <text
            x={coords.x}
            y={coords.y}
            dy="5"
            textAnchor="middle"
            className={`font-display font-medium text-sm ${textColor} transition-colors duration-200`}
            transform={`rotate(${(coords.angle + Math.PI / 2) * 180 / Math.PI}, ${coords.x}, ${coords.y})`}
          >
            {num}
          </text>
        </g>
      );
    });
  };

  const renderSectorButton = (label: string, type: BetType, sectorKey: string, x: number, y: number) => (
    <g
      onClick={() => handleSectorBet(sectorKey, type)}
      onMouseEnter={() => handleSectorHover(sectorKey)}
      onMouseLeave={() => handleSectorHover(null)}
      className="cursor-pointer group"
    >
      <rect
        x={x - 40} y={y - 15} width="80" height="30" rx="15"
        className="fill-black/40 stroke-white/20 stroke-1 group-hover:stroke-neo-gold/50 group-hover:fill-white/5 transition-all"
      />
      <text
        x={x} y={y + 5} textAnchor="middle"
        className="fill-neo-gold font-display font-bold text-xs group-hover:fill-white transition-colors"
      >
        {label}
      </text>
    </g>
  );

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center animate-in zoom-in duration-500">
      <svg width="600" height="300" viewBox="0 0 600 300" className="w-full h-full drop-shadow-2xl">
        {/* Track Path */}
        <ellipse cx={CX} cy={CY} rx={RX + 15} ry={RY + 15} fill="none" stroke="#E2B659" strokeWidth="2" strokeOpacity="0.1" />
        <ellipse cx={CX} cy={CY} rx={RX - 25} ry={RY - 25} fill="none" stroke="#E2B659" strokeWidth="2" strokeOpacity="0.1" />

        {/* Track Fill */}
        <path
          d={`M ${CX - RX - 10} ${CY} A ${RX + 10} ${RY + 10} 0 1 1 ${CX + RX + 10} ${CY} A ${RX + 10} ${RY + 10} 0 1 1 ${CX - RX - 10} ${CY} Z 
              M ${CX - RX + 25} ${CY} A ${RX - 25} ${RY - 25} 0 1 0 ${CX + RX - 25} ${CY} A ${RX - 25} ${RY - 25} 0 1 0 ${CX - RX + 25} ${CY} Z`}
          className="fill-[#032F26]"
          fillRule="evenodd"
        />

        {renderSectorButton("TIERS", BetType.TIERS, "TIERS", CX, CY + 80)}
        {renderSectorButton("ORPHELINS", BetType.ORPHELINS, "ORPHELINS", CX + 180, CY)}
        {renderSectorButton("ORPHELINS", BetType.ORPHELINS, "ORPHELINS", CX - 180, CY)}
        {renderSectorButton("VOISINS", BetType.VOISINS, "VOISINS", CX, CY - 60)}
        {renderSectorButton("ZERO", BetType.VOISINS, "VOISINS", CX, CY - 90)}

        {renderWheelNumbers()}
      </svg>
    </div>
  );
};