import React from 'react';
import { getNumberColor } from '../constants-orginal';

interface Props {
  history: string[];
}

export const HistoryPanel: React.FC<Props> = ({ history }) => {
  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="p-2 border-b border-white/5 text-center bg-black/20">
        <span className="text-[9px] uppercase text-gray-400 font-bold tracking-widest">Last 10</span>
      </div>

      <div className="p-2 flex flex-col gap-2 overflow-hidden items-center">
        {history.slice(0, 10).map((num, idx) => {
          const color = getNumberColor(num);
          let bg = 'bg-gray-800';
          let text = 'text-gray-300';
          let border = 'border-transparent';

          if (color === 'red') { bg = 'bg-red-500/20'; text = 'text-red-400'; border = 'border-red-500/30'; }
          if (color === 'green') { bg = 'bg-green-500/20'; text = 'text-green-400'; border = 'border-green-500/30'; }
          if (idx === 0) { border = 'border-white/50'; text = 'text-white'; bg = 'bg-white/10'; }

          return (
            <div
              key={idx}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center border
                ${bg} ${text} ${border}
                animate-in zoom-in duration-300 shadow-lg
              `}
            >
              <span className="font-display font-bold text-lg">{num}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};