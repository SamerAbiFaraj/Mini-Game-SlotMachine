import React from 'react';
import { LeaderboardEntry } from '../types';

interface Props {
  entries: LeaderboardEntry[];
  currentRoundId: string;
}

export const LeaderboardPanel: React.FC<Props> = ({ entries, currentRoundId }) => {
  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Bets</h3>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_green] animate-pulse"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
            <span className="text-[9px] font-mono uppercase">Waiting for activity...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {entries.map((entry) => (
              <div 
                key={`${currentRoundId}-${entry.userId}-${entry.rank}`}
                className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors animate-in slide-in-from-right duration-300 border-l-2 border-transparent hover:border-neo-gold"
              >
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-200">{entry.username}</span>
                    <span className="text-[9px] text-gray-500 font-mono uppercase">{entry.betType}</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-neo-gold">
                  ${entry.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};