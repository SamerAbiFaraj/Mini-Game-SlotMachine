
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GameState, GamePhase } from '../types';
import { PHASE_STYLES, BET_OPTIONS, PHASE_MULTIPLIERS } from '../constants';
import { Coins, Trophy, Zap, Volume2, VolumeX } from 'lucide-react';
import { setMute } from '../lib/audio';

interface Props {
  balance: number;
  bet: number;
  lastWin: number;
  gameState: GameState;
  currentPhase: GamePhase;
  onWarp: () => void;
  onBetChange: (newBet: number) => void;
}

const StatDisplay: React.FC<any> = ({ label, value, icon: Icon, colorClass }) => (
  <motion.div 
    className="flex flex-col bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 min-w-[80px] md:min-w-[100px] backdrop-blur-md relative overflow-hidden group shadow-lg flex-1 md:flex-none justify-center"
    style={{
      transformStyle: 'preserve-3d',
      boxShadow: `
        0 4px 12px rgba(0,0,0,0.6),
        0 8px 24px rgba(0,0,0,0.4),
        inset 0 1px 2px rgba(255,255,255,0.1),
        inset 0 -1px 2px rgba(0,0,0,0.3)
      `,
      background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
    }}
    whileHover={{
      scale: 1.05,
      z: 10,
      transition: { duration: 0.2 },
    }}
  >
    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colorClass}`} style={{ boxShadow: `0 0 8px currentColor` }} />
    {/* 3D Top Highlight */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="flex items-center gap-1.5 mb-0.5 opacity-60 relative z-10">
      <Icon size={10} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
      <span className="text-[9px] font-display uppercase tracking-widest text-white">{label}</span>
    </div>
    <span className="font-mono text-base md:text-lg font-bold tracking-tighter text-white tabular-nums truncate relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
      {value}
    </span>
  </motion.div>
);

const ChipButton: React.FC<any> = ({ amount, selected, onClick, disabled }) => {
  // Different neon colors for different bet amounts
  const getNeonColor = () => {
    if (amount <= 0.5) return { border: '#00f0ff', glow: 'rgba(0, 240, 255, 0.8)' }; // Cyan
    if (amount <= 5) return { border: '#ff00ff', glow: 'rgba(255, 0, 255, 0.8)' }; // Pink
    return { border: '#cc00ff', glow: 'rgba(204, 0, 255, 0.8)' }; // Purple
  };

  const neon = getNeonColor();

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={!disabled ? { scale: 1.15, z: 15 } : {}}
      className={`
         relative flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center
         transition-all duration-200 font-bold font-mono text-[10px]
         ${selected ? 'text-white scale-105' : 'text-white/70'}
         ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        transformStyle: 'preserve-3d',
        background: selected
          ? `radial-gradient(circle at 30% 30%, ${neon.border}40, ${neon.border}20)`
          : 'radial-gradient(circle at 30% 30%, rgba(30,41,59,0.8), rgba(15,23,42,0.8))',
        borderColor: selected ? neon.border : neon.border + '60',
        boxShadow: selected
          ? `
            0 0 10px ${neon.glow},
            0 0 20px ${neon.glow},
            0 4px 12px rgba(0,0,0,0.6),
            inset 0 2px 4px rgba(255,255,255,0.3),
            inset 0 -2px 4px rgba(0,0,0,0.3)
          `
          : `
            0 0 5px ${neon.glow}40,
            0 2px 8px rgba(0,0,0,0.5),
            inset 0 1px 2px rgba(255,255,255,0.1)
          `,
      }}
    >
      {/* Neon Glow Effect */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none blur-sm"
        style={{
          background: selected ? `radial-gradient(circle, ${neon.glow} 0%, transparent 70%)` : 'none',
          opacity: selected ? 0.6 : 0,
        }}
      />
      <div className={`absolute inset-1 rounded-full border border-dashed ${selected ? 'border-white/40' : 'border-white/10'}`} />
      <span className="relative z-10" style={{ textShadow: selected ? `0 0 10px ${neon.border}` : '0 1px 2px rgba(0,0,0,0.8)' }}>${amount}</span>
    </motion.button>
  );
};

const BottomHUD: React.FC<Props> = ({ balance, bet, lastWin, gameState, currentPhase, onWarp, onBetChange }) => {
  const isIdle = gameState === 'idle' || gameState === 'resolvingWin' || gameState === 'animatingBigWin';
  const styles = PHASE_STYLES[currentPhase];
  const multiplier = PHASE_MULTIPLIERS[currentPhase];
  const [muted, setMutedState] = useState(false);

  const toggleMute = () => {
    setMutedState(!muted);
    setMute(!muted);
  };

  return (
    <div className="w-full max-w-5xl mx-auto relative z-30 px-2 pb-4">
      {/* Dashboard Container - 3D Extruded Panel */}
      <motion.div 
        className="relative backdrop-blur-2xl rounded-[2rem] p-3 md:p-4 border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.95) 100%)',
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 10px 40px rgba(0,0,0,0.8),
            0 20px 60px rgba(0,0,0,0.6),
            inset 0 2px 8px rgba(255,255,255,0.1),
            inset 0 -2px 8px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.05)
          `,
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        
        {/* Top Gloss Edge - 3D Highlight */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ boxShadow: '0 2px 8px rgba(255,255,255,0.3)' }} />
        
        {/* Bottom Shadow - 3D Depth */}
        <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/40 blur-xl rounded-full" />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* LEFT: Stats & Audio (Wraps on mobile) */}
          <div className="flex flex-row flex-wrap items-center gap-3 md:gap-4 flex-1">
             <div className="flex flex-1 md:flex-none gap-2 min-w-[160px]">
               <StatDisplay label="CREDITS" value={`$${balance.toFixed(2)}`} icon={Coins} colorClass="bg-emerald-500" />
               <StatDisplay label="WIN" value={`$${lastWin.toFixed(2)}`} icon={Trophy} colorClass="bg-amber-500" />
             </div>
             
             {/* Audio & Chips */}
             <div className="flex items-center gap-2 flex-1 min-w-[200px]">
               <motion.button 
                 onClick={toggleMute} 
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors relative"
                 style={{
                   background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 160, 176, 0.2))',
                   border: '2px solid #00f0ff',
                   boxShadow: `
                     0 0 10px rgba(0, 240, 255, 0.6),
                     0 0 20px rgba(0, 240, 255, 0.4),
                     inset 0 0 10px rgba(0, 240, 255, 0.2)
                   `,
                   color: muted ? '#666' : '#00f0ff',
                 }}
               >
                 {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
               </motion.button>
               <div className="flex-1 bg-black/40 rounded-xl p-1.5 border border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
                 <div className="flex gap-2">
                   {BET_OPTIONS.map(amount => (
                     <ChipButton 
                       key={amount} 
                       amount={amount} 
                       selected={bet === amount} 
                       onClick={() => onBetChange(amount)}
                       disabled={!isIdle}
                     />
                   ))}
                 </div>
               </div>
             </div>
          </div>

          {/* RIGHT: Reactor & Warp (Fixed size actions) */}
          <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-6 pt-2 lg:pt-0 border-t border-white/5 lg:border-t-0">
             
             {/* Reactor - Neon Enhanced */}
             <div className="flex flex-col items-center">
                <span className={`text-[9px] uppercase font-bold tracking-widest ${styles.accent} mb-1 opacity-80 neon-text`}>MULTIPLIER</span>
                <motion.div 
                  className="w-14 h-14 rounded-full border-2 bg-black/80 flex items-center justify-center relative overflow-hidden group"
                  style={{
                    borderColor: styles.accent.includes('cyan') ? '#00f0ff' : styles.accent.includes('amber') ? '#ffb800' : '#e879f9',
                    boxShadow: `
                      0 0 15px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.8)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.8)' : 'rgba(232, 121, 249, 0.8)'},
                      0 0 30px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.6)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.6)' : 'rgba(232, 121, 249, 0.6)'},
                      inset 0 0 15px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.2)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.2)' : 'rgba(232, 121, 249, 0.2)'}
                    `,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 15px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.8)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.8)' : 'rgba(232, 121, 249, 0.8)'}, 0 0 30px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.6)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.6)' : 'rgba(232, 121, 249, 0.6)'}`,
                      `0 0 20px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 1)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 1)' : 'rgba(232, 121, 249, 1)'}, 0 0 40px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.8)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.8)' : 'rgba(232, 121, 249, 0.8)'}`,
                      `0 0 15px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.8)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.8)' : 'rgba(232, 121, 249, 0.8)'}, 0 0 30px ${styles.accent.includes('cyan') ? 'rgba(0, 240, 255, 0.6)' : styles.accent.includes('amber') ? 'rgba(255, 184, 0, 0.6)' : 'rgba(232, 121, 249, 0.6)'}`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                     <div className={`absolute inset-0 bg-gradient-to-t ${styles.gradient} opacity-20 animate-pulse`} />
                     <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full animate-spin-slow opacity-50" />
                     <span className={`text-xl font-black font-display ${styles.accent} z-10 neon-text`}>
                        {multiplier}X
                     </span>
                </motion.div>
             </div>

             {/* WARP BUTTON - Enhanced 3D */}
             <motion.button
                onClick={onWarp}
                disabled={!isIdle}
                whileHover={isIdle ? { 
                  scale: 1.1, 
                  z: 20,
                  transition: { duration: 0.2 },
                } : {}}
                whileTap={isIdle ? { scale: 0.95 } : {}}
                className={`
                  relative px-8 py-3 md:px-12 md:py-4 rounded-full overflow-hidden
                  bg-gradient-to-r ${styles.gradient}
                  group z-50 flex-shrink-0 border-2 border-white/20
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.6),
                    0 16px 48px rgba(0,0,0,0.4),
                    inset 0 2px 8px rgba(255,255,255,0.3),
                    inset 0 -2px 8px rgba(0,0,0,0.5),
                    0 0 0 1px rgba(255,255,255,0.1),
                    0 0 40px currentColor
                  `,
                }}
             >
                {/* 3D Button Glow */}
                <div 
                  className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.4), transparent 70%)',
                  }}
                />
                {/* 3D Top Highlight */}
                <div 
                  className="absolute top-0 left-1/4 right-1/4 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-sm"
                  style={{ transform: 'translateZ(5px)' }}
                />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="font-display font-black tracking-[0.2em] text-white text-lg md:text-xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 10px currentColor' }}>
                    {isIdle ? 'WARP' : '...'}
                  </span>
                  <Zap className={`${isIdle ? 'animate-bounce' : 'animate-spin'} text-white fill-white`} size={20} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                </div>
             </motion.button>

          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default BottomHUD;
