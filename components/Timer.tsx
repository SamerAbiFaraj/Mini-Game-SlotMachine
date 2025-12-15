
import React from 'react';

interface Props {
  timeLeft: number;
  totalTime: number;
}

export const Timer: React.FC<Props> = ({ timeLeft, totalTime }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const offset = circumference - progress * circumference;

  let color = 'text-lux-gold';
  let shadow = 'drop-shadow-[0_0_3px_rgba(212,175,55,0.5)]';
  
  if (progress < 0.5) { color = 'text-orange-400'; shadow = 'drop-shadow-[0_0_3px_rgba(251,146,60,0.5)]'; }
  if (progress < 0.2) { color = 'text-red-500'; shadow = 'drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]'; }

  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg className={`transform -rotate-90 w-full h-full ${shadow}`}>
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-white/5"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-linear ${color}`}
        />
      </svg>
      <div className={`absolute font-mono font-bold text-xs ${color}`}>
        {timeLeft}
      </div>
    </div>
  );
};
