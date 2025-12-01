
import React, { useEffect, useRef } from 'react';
import { GamePhase } from '../types';
import { LOOP_DURATION_MS, PHASE_THRESHOLDS } from '../constants';

interface Props {
  currentPhase: GamePhase;
  startTimeRef: React.MutableRefObject<number>;
}

const TimeCycleBar: React.FC<Props> = ({ currentPhase, startTimeRef }) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    
    const updateCursor = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = (elapsed % LOOP_DURATION_MS) / LOOP_DURATION_MS;
      
      if (cursorRef.current) {
        cursorRef.current.style.left = `${progress * 100}%`;
      }
      animId = requestAnimationFrame(updateCursor);
    };

    animId = requestAnimationFrame(updateCursor);
    return () => cancelAnimationFrame(animId);
  }, [startTimeRef]);

  // Exact percentages based on phaseLogic.ts:
  // Calm: 0-6000ms / 15000ms = 40%
  // Surge: (11000-6000) / 15000 = 33.333%
  // Quantum: (15000-11000) / 15000 = 26.666%
  const calmW = 40;
  const surgeW = 33.333;
  const quantumW = 26.666;

  return (
    <div className="w-full max-w-[400px] mx-auto mb-6 relative z-20">
      <div 
        className="h-10 rounded-full border border-white/10 overflow-hidden relative backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(15,23,42,0.8) 100%)',
          boxShadow: `
            0 4px 12px rgba(0,0,0,0.6),
            0 8px 24px rgba(0,0,0,0.4),
            inset 0 2px 4px rgba(255,255,255,0.1),
            inset 0 -2px 4px rgba(0,0,0,0.5)
          `,
          transformStyle: 'preserve-3d',
        }}
      >
        
        {/* Phase Backgrounds with Gradients - 3D Depth */}
        <div className="absolute inset-0 flex">
          <div 
            style={{ width: `${calmW}%` }} 
            className="h-full bg-gradient-to-r from-teal-900/40 to-teal-800/40 border-r border-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          </div>
          <div 
            style={{ width: `${surgeW}%` }} 
            className="h-full bg-gradient-to-r from-amber-900/40 to-amber-800/40 border-r border-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          </div>
          <div 
            style={{ width: `${quantumW}%` }} 
            className="h-full bg-gradient-to-r from-fuchsia-900/40 to-fuchsia-800/40"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          </div>
        </div>

        {/* Labels - Increased Font Size */}
        <div className="absolute inset-0 flex text-xs md:text-sm font-black uppercase tracking-wider items-center">
          <div style={{ width: `${calmW}%` }} className={`flex justify-center transition-colors duration-300 ${currentPhase === 'Calm' ? 'text-teal-300 neon-text scale-110' : 'text-white/30'}`}>Calm</div>
          <div style={{ width: `${surgeW}%` }} className={`flex justify-center transition-colors duration-300 ${currentPhase === 'Surge' ? 'text-amber-300 neon-text scale-110' : 'text-white/30'}`}>Surge</div>
          <div style={{ width: `${quantumW}%` }} className={`flex justify-center transition-colors duration-300 ${currentPhase === 'Quantum' ? 'text-fuchsia-300 neon-text scale-110' : 'text-white/30'}`}>Quantum</div>
        </div>

        {/* Cursor - Enhanced 3D */}
        <div 
          ref={cursorRef}
          className="absolute top-0 bottom-0 w-1.5 z-20 transform -translate-x-1/2 rounded-full mix-blend-overlay"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)',
            boxShadow: `
              0 0 15px 2px rgba(255,255,255,0.9),
              0 0 30px 4px rgba(255,255,255,0.6),
              inset 0 0 10px rgba(255,255,255,0.5)
            `,
            transform: 'translateZ(10px)',
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(TimeCycleBar);
