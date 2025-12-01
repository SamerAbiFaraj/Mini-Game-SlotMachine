
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, LineWin, ReelGrid as ReelGridType, SymbolId, GamePhase } from '../types';
import SymbolIcon from './SymbolIcon';
import { SYMBOLS, PHASE_STYLES } from '../constants';
import { randomInt } from '../lib/rng';
import { playReelStop } from '../lib/audio';
import { getAllImages, incrementSpinCount } from '../lib/imageMapper';

interface Props {
  grid: ReelGridType;
  gameState: GameState;
  wins: LineWin[];
  currentPhase: GamePhase;
  onSpinComplete?: () => void;
}

const SpinLoopStrip = ({ speed = 1 }: { speed?: number }) => {
  const allImages = useMemo(() => getAllImages(), []);
  
  // Generate random images for spinning
  const spinImages = useMemo(() => {
    return Array.from({ length: 12 }, () => {
      const randomIndex = Math.floor(Math.random() * allImages.length);
      return allImages[randomIndex];
    });
  }, [allImages]);

  return (
    <div className="flex flex-col w-full h-full opacity-90">
      {spinImages.map((imagePath, i) => (
        <div key={i} className="flex-1 flex items-center justify-center p-2 relative h-[33.33%]">
           <img
             src={imagePath}
             alt={`spin-${i}`}
             className="w-full h-full object-contain transform scale-90 filter blur-[1px]"
             style={{
               transition: `transform ${0.1 / speed}s linear`,
             }}
             onError={(e) => {
               console.warn('Spin image failed to load:', imagePath);
               const img = e.target as HTMLImageElement;
               // Show placeholder instead of hiding
               img.style.opacity = '0.3';
               img.style.filter = 'grayscale(100%)';
             }}
           />
        </div>
      ))}
    </div>
  );
};

const ReelColumn = ({ 
  targetSymbols, 
  isSpinning,
  colIndex,
  onColumnComplete,
  spinNumber
}: {
  targetSymbols: SymbolId[];
  isSpinning: boolean;
  colIndex: number;
  onColumnComplete: () => void;
  spinNumber?: number;
}) => {
  const [status, setStatus] = useState<'static' | 'spinning' | 'stopping'>('static');
  const [spinSpeed, setSpinSpeed] = useState(1);
  const [spinStartTime, setSpinStartTime] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      setStatus('spinning');
      setSpinSpeed(10); // Fast start
      
      // Fast spinning phase (600ms)
      const fastPhase = setTimeout(() => {
        setSpinSpeed(5); // Medium speed
      }, 600);
      
      // Medium speed phase (300ms)
      const mediumPhase = setTimeout(() => {
        setSpinSpeed(2); // Slow down
      }, 900);
      
      // Stopping phase - starts slowing down more
      const slowPhase = setTimeout(() => {
        setSpinSpeed(0.5); // Very slow
      }, 1100);
      
      // Total spin duration with stagger
      const spinDuration = 1400 + (colIndex * 150);
      
      const timer = setTimeout(() => {
        setStatus('stopping');
        playReelStop();
      }, spinDuration);
      
      return () => {
        clearTimeout(fastPhase);
        clearTimeout(mediumPhase);
        clearTimeout(slowPhase);
        clearTimeout(timer);
      };
    } else {
      setStatus('static');
      setSpinSpeed(1);
    }
  }, [isSpinning, colIndex]);

  const handleStopComplete = () => {
    setStatus('static');
    onColumnComplete();
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #050505 100%)',
        transformStyle: 'preserve-3d',
      }}
    >
       {/* 3D Column Depth Indicator */}
       <div 
         className="absolute inset-0 pointer-events-none"
         style={{
           background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
           transform: 'translateZ(5px)',
         }}
       />
       
       {status === 'spinning' && (
         <motion.div 
           className="absolute inset-0 w-full flex flex-col overflow-hidden"
           style={{
             height: '300%',
           }}
           animate={{
             y: ['0%', '-66.66%'],
           }}
           transition={{
             duration: Math.max(0.01, 0.1 / Math.max(spinSpeed, 0.1)),
             repeat: Infinity,
             ease: 'linear',
             type: 'tween',
           }}
         >
            <div className="h-1/3 w-full flex-shrink-0"><SpinLoopStrip speed={spinSpeed} /></div>
            <div className="h-1/3 w-full flex-shrink-0"><SpinLoopStrip speed={spinSpeed} /></div>
            <div className="h-1/3 w-full flex-shrink-0"><SpinLoopStrip speed={spinSpeed} /></div>
         </motion.div>
       )}

       {status === 'stopping' && (
         <motion.div 
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            transition={{ 
              type: "spring", 
              stiffness: 180,
              damping: 20, 
              mass: 1 
            }}
            onAnimationComplete={handleStopComplete}
            className="absolute inset-0 flex flex-col w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
            }}
         >
           {targetSymbols.map((sym, i) => (
             <div 
               key={i} 
               className="flex-1 flex items-center justify-center p-2 h-[33.33%]"
               style={{
                 transform: `perspective(600px) translateZ(${i * 2}px)`,
               }}
             >
               <SymbolIcon id={sym} spinNumber={spinNumber} />
             </div>
           ))}
         </motion.div>
       )}
       
       {status === 'static' && (
          <div 
            className="flex flex-col w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {targetSymbols.map((sym, i) => (
              <div 
                key={i} 
                className="flex-1 flex items-center justify-center p-2 h-[33.33%]"
                style={{
                  transform: `perspective(600px) translateZ(${i * 2}px)`,
                }}
              >
                <SymbolIcon id={sym} spinNumber={spinNumber} />
              </div>
            ))}
          </div>
       )}
    </div>
  );
};

// --- REALISTIC ELEMENTAL BORDERS ---
const MagmaBorder = () => (
  <div className="absolute inset-[-6px] rounded-2xl overflow-hidden z-0">
    <div className="absolute inset-0 bg-orange-900" />
    {/* Flowing Lava Texture */}
    <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-80 mix-blend-hard-light animate-spin-slow" 
         style={{ 
           background: 'radial-gradient(circle, #f97316 20%, transparent 20%), radial-gradient(circle, #ef4444 20%, transparent 20%)', 
           backgroundSize: '30px 30px',
           filter: 'blur(4px) contrast(200%)'
         }} 
    />
    <div className="absolute inset-0 border-[6px] border-orange-500/50 rounded-2xl blur-md" />
  </div>
);

const VoltageBorder = () => (
  <div className="absolute inset-[-6px] rounded-2xl overflow-hidden z-0 bg-slate-900">
    <div className="absolute inset-0 opacity-50 bg-indigo-900" />
    <svg className="absolute inset-0 w-full h-full overflow-visible">
       <rect x="0" y="0" width="100%" height="100%" rx="16" fill="none" stroke="#8b5cf6" strokeWidth="4" 
             className="animate-pulse drop-shadow-[0_0_10px_#8b5cf6]" />
    </svg>
    {/* Moving Spark */}
    <div className="absolute w-20 h-20 bg-fuchsia-500/0 rounded-full shadow-[0_0_40px_10px_rgba(216,180,254,1)] animate-[travel-rect_3s_linear_infinite]" 
         style={{ offsetPath: 'rect(0% 100% 100% 0% round 16px)' }}
    />
    <style>{`
      @keyframes travel-rect {
        0% { offset-distance: 0%; }
        100% { offset-distance: 100%; }
      }
    `}</style>
  </div>
);

const PlasmaBorder = () => (
  <div className="absolute inset-[-6px] rounded-2xl overflow-hidden z-0 bg-slate-900">
     <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 opacity-60 blur-xl animate-[spin_4s_linear_infinite]" />
     <div className="absolute inset-[2px] bg-black rounded-xl" />
     <div className="absolute inset-0 border border-cyan-400/50 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
  </div>
);

const ReelsPanel: React.FC<Props> = ({ grid, gameState, wins, currentPhase, onSpinComplete }) => {
  const isSpinning = gameState === 'spinning';
  const showWins = gameState === 'resolvingWin' || gameState === 'animatingBigWin';
  const [spinNumber, setSpinNumber] = useState(0);
  
  const columns = useMemo(() => {
    const cols: SymbolId[][] = [[], [], []];
    if (grid && grid.length === 3) {
      grid.forEach(row => {
        if (row && row.length === 3) {
          row.forEach((sym, cIdx) => {
            if (cIdx < 3 && sym) {
              cols[cIdx].push(sym);
            }
          });
        }
      });
    }
    // Ensure each column has exactly 3 symbols
    cols.forEach((col, idx) => {
      while (col.length < 3) {
        col.push('cat'); // Fallback symbol
      }
      // Trim to exactly 3 if somehow more
      if (col.length > 3) {
        cols[idx] = col.slice(0, 3);
      }
    });
    return cols;
  }, [grid]);

  const [completedCols, setCompletedCols] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      setCompletedCols(0);
      // Increment spin count for image variation
      incrementSpinCount();
      setSpinNumber(prev => prev + 1);
    }
  }, [isSpinning]);

  const handleColComplete = () => {
    setCompletedCols(prev => {
      const next = prev + 1;
      if (next === 3 && onSpinComplete) {
        setTimeout(onSpinComplete, 100); // Trigger completion immediately after last reel
      }
      return next;
    });
  };

  const styles = PHASE_STYLES[currentPhase];

  // Rotate border themes based on phase, or keep independent? 
  // User asked for "rotating automatically" but matching the phase adds coherency.
  // Let's cycle based on phase to match the multiplier logic visually.
  const renderBorder = () => {
    switch(currentPhase) {
      case 'Calm': return <PlasmaBorder />;
      case 'Surge': return <MagmaBorder />;
      case 'Quantum': return <VoltageBorder />;
    }
  };

  return (
    <motion.div 
      className="relative group max-w-2xl w-full aspect-[4/3] mx-auto my-4 md:my-6 z-20 perspective-[1200px]"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      
      {/* 3D Cabinet Frame - Extruded Depth with Layered Shadows */}
      <motion.div 
        className={`
          relative h-full w-full 
          transform-style-preserve-3d
        `}
        initial={{ rotateX: -15, opacity: 0 }}
        animate={{ rotateX: 4, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={isSpinning ? {} : {
          rotateX: 6,
          scale: 1.02,
          transition: { duration: 0.3 },
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 3D Cabinet with Multiple Shadow Layers */}
        <div 
          className={`
            relative h-full w-full 
            rounded-xl
            transform-style-preserve-3d
          `}
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.9),
              0 30px 80px rgba(0,0,0,0.7),
              inset 0 2px 10px rgba(255,255,255,0.1),
              inset 0 -2px 10px rgba(0,0,0,0.5),
              0 0 0 1px rgba(255,255,255,0.05)
            `,
            transform: 'translateZ(0)',
          }}
        >
        {/* Dynamic Living Border */}
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {renderBorder()}
        </motion.div>

        {/* Metallic Housing Overlay */}
        <div className="absolute -inset-2 rounded-2xl bg-transparent border border-white/5 z-10 pointer-events-none shadow-inner">
           {/* Industrial Bolts */}
           <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 shadow-md flex items-center justify-center"><div className="w-1.5 h-0.5 bg-slate-800 rotate-45"/></div>
           <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 shadow-md flex items-center justify-center"><div className="w-1.5 h-0.5 bg-slate-800 rotate-45"/></div>
           <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 shadow-md flex items-center justify-center"><div className="w-1.5 h-0.5 bg-slate-800 rotate-45"/></div>
           <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 shadow-md flex items-center justify-center"><div className="w-1.5 h-0.5 bg-slate-800 rotate-45"/></div>
        </div>

        {/* Main Screen Area - Deep 3D Recess with Neon Cyan Border */}
        <div 
          className="relative h-full w-full rounded-lg overflow-hidden bg-black z-20"
          style={{
            border: '4px solid #00f0ff',
            boxShadow: `
              inset 0 0 60px rgba(0,0,0,1),
              inset 0 10px 30px rgba(0,0,0,0.8),
              inset 0 -10px 30px rgba(255,255,255,0.05),
              0 0 10px rgba(0, 240, 255, 0.6),
              0 0 20px rgba(0, 240, 255, 0.4),
              0 0 30px rgba(0, 240, 255, 0.3),
              0 0 40px rgba(0, 240, 255, 0.2),
              inset 0 0 20px rgba(0, 240, 255, 0.1)
            `,
            transform: 'translateZ(0.5rem)',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,1) 100%)',
            animation: 'neon-border-pulse 3s ease-in-out infinite alternate',
          }}
        >
            
            <div className="flex h-full w-full px-2 py-2 md:px-3 md:py-3 gap-2 md:gap-3 bg-black/90 items-center justify-center">
              {columns.map((colSymbols, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -50, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.1,
                      ease: "easeOut",
                    }}
                    whileHover={!isSpinning && !showWins ? {
                      scale: 1.05,
                      z: 20,
                      transition: { duration: 0.2 },
                    } : {}}
                    className="flex-1 h-full relative rounded overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #050505 0%, #111 50%, #050505 100%)',
                      border: '2px solid #00f0ff',
                      boxShadow: `
                        inset 0 0 20px rgba(0,0,0,0.8),
                        inset -4px 0 10px rgba(0,0,0,0.6),
                        inset 4px 0 10px rgba(255,255,255,0.03),
                        0 0 5px rgba(0, 240, 255, 0.8),
                        0 0 10px rgba(0, 240, 255, 0.6),
                        0 0 15px rgba(0, 240, 255, 0.4),
                        inset 0 0 10px rgba(0, 240, 255, 0.15),
                        0 4px 10px rgba(0,0,0,0.5)
                      `,
                      transformStyle: 'preserve-3d',
                      animation: 'neon-border-pulse 3s ease-in-out infinite alternate',
                    }}
                >
                  {/* 3D Cylinder Shading - Enhanced */}
                  <div 
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.4) 70%),
                        linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(0,0,0,0.7) 100%),
                        linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.8) 100%)
                      `,
                    }}
                  />
                  
                  {/* Left Highlight - 3D Edge */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 z-30 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, rgba(255,255,255,0.15), transparent)',
                      boxShadow: '2px 0 10px rgba(255,255,255,0.1)',
                    }}
                  />
                  
                  {/* Right Highlight - 3D Edge */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 z-30 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to left, rgba(255,255,255,0.15), transparent)',
                      boxShadow: '-2px 0 10px rgba(255,255,255,0.1)',
                    }}
                  />
                  
                  <div
                    style={{
                      transform: 'perspective(800px) rotateY(2deg)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <ReelColumn 
                      targetSymbols={colSymbols} 
                      isSpinning={isSpinning} 
                      colIndex={i} 
                      onColumnComplete={handleColComplete}
                      spinNumber={spinNumber}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Line Win Overlay */}
            <AnimatePresence>
              {showWins && (
                <div className="absolute inset-0 z-40 pointer-events-none">
                  <div className="absolute inset-0 bg-black/40 transition-opacity" />
                  <svg className="absolute inset-0 w-full h-full overflow-visible">
                    {wins.map((win, i) => {
                      const points = win.coordinates.map(([r, c]) => {
                        const x = (c * 33.33) + 16.66;
                        const y = (r * 33.33) + 16.66;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <motion.polyline 
                          key={i}
                          points={points}
                          fill="none"
                          stroke={currentPhase === 'Surge' ? '#fbbf24' : '#22d3ee'}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="filter drop-shadow-[0_0_10px_currentColor]"
                        />
                      );
                    })}
                  </svg>
                  {/* Cell Highlights */}
                  {wins.map((win, winIndex) => win.coordinates.map(([r, c], i) => (
                    <motion.div
                      key={`${r}-${c}-${i}`}
                      initial={{ opacity: 0, scale: 1.5, rotate: -180 }}
                      animate={{ 
                        opacity: 1, 
                        scale: [1.5, 1.2, 1, 1.1, 1],
                        rotate: 0,
                      }}
                      transition={{
                        duration: 0.6,
                        delay: winIndex * 0.2 + i * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        repeatDelay: 1,
                      }}
                      className={`absolute rounded-full border-4 ${styles.border} shadow-[0_0_20px_currentColor]`}
                      style={{
                        top: `${r * 33.33 + 2}%`,
                        left: `${c * 33.33 + 2}%`,
                        width: '29%',
                        height: '29%'
                      }}
                    />
                  )))}
                </div>
              )}
            </AnimatePresence>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(ReelsPanel);
