
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimeCycleBar from './components/TimeCycleBar';
import ReelsPanel from './components/ReelsPanel';
import ReelsPanelErrorBoundary from './components/ReelsPanelErrorBoundary';
import BottomHUD from './components/BottomHUD';
import EffectsLayer from './components/EffectsLayer';
import BigWinOverlay from './components/BigWinOverlay';
import ParticlesBackground from './components/ParticlesBackground';
import WinParticles from './components/WinParticles';
import { GameState, GamePhase, ReelGrid, SpinResult, SessionStats, GameConfig } from './types';
import { getPhaseFromTime, resolveSpin } from './lib/phaseLogic';
import { postToParent } from './lib/messaging';
import { PHASE_STYLES } from './constants';
import { initAudio, startSpinSound, playWin, playBigWin, playAmbience } from './lib/audio'; 

const INITIAL_GRID: ReelGrid = [
  ['cat', 'dog', 'bird'],
  ['alligator', 'whale', 'elephant'],
  ['wild', 'cat', 'quantum_wild']
];

const DEFAULT_CONFIG: GameConfig = {
  volatilityProfile: "medium",
  bigWinThresholdMultiplier: 10,
  betAmount: 1.00
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('Calm');
  const [reelsGrid, setReelsGrid] = useState<ReelGrid>(INITIAL_GRID);
  const [balance, setBalance] = useState(1000.00);
  const [lastWin, setLastWin] = useState(0);
  const [lastWinResult, setLastWinResult] = useState<SpinResult | null>(null);
  const [currentBet, setCurrentBet] = useState(1.00);
  
  // Use a string for key to force remount of overlay if needed
  const [winOverlayKey, setWinOverlayKey] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();
  const sessionId = useRef<string>(Math.random().toString(36).substring(7));
  const statsRef = useRef<SessionStats>({
    totalSpins: 0,
    totalBet: 0,
    totalWin: 0,
    mostFrequentPhase: null,
    lastActiveAt: new Date().toISOString()
  });
  const configRef = useRef<GameConfig>(DEFAULT_CONFIG);
  const pendingResultRef = useRef<SpinResult | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    configRef.current.betAmount = currentBet;
  }, [currentBet]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const updateGameLoop = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const nextPhase = getPhaseFromTime(elapsed);
    
    setCurrentPhase(prev => {
      if (prev !== nextPhase) {
        playAmbience(nextPhase); 
        return nextPhase;
      }
      return prev;
    });

    requestRef.current = requestAnimationFrame(updateGameLoop);
  }, []);

  useEffect(() => {
    initAudio(); 
    playAmbience('Calm');
    requestRef.current = requestAnimationFrame(updateGameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateGameLoop]);

  const handleWarp = () => {
    try {
      console.log('Warp button clicked, current gameState:', gameState);
      if (gameState !== 'idle' && gameState !== 'resolvingWin') {
        console.log('Warp blocked - gameState:', gameState);
        return;
      }
      if (balance < currentBet) {
        console.log('Warp blocked - insufficient balance');
        return;
      } 

      console.log('Starting spin...');
      initAudio(); 
      startSpinSound();

      const spinPhase = currentPhase; 
      const bet = currentBet;

      setBalance(prev => prev - bet);
      statsRef.current.totalBet += bet;
      statsRef.current.totalSpins += 1;
      statsRef.current.lastActiveAt = new Date().toISOString();

      const result = resolveSpin(spinPhase, configRef.current);
      console.log('Spin result:', result);
      pendingResultRef.current = result;

      setReelsGrid(result.grid);
      setGameState('spinning');
      setLastWinResult(null);
      setLastWin(0);
      
      postToParent({ 
        type: 'SPIN_START', 
        payload: { sessionId: sessionId.current, phase: spinPhase, balanceBefore: balance } 
      });
      console.log('Spin started successfully');
    } catch (error) {
      console.error('Error in handleWarp:', error);
      // Reset to idle state if error occurs
      setGameState('idle');
    }
  };

  const onSpinComplete = () => {
    if (!pendingResultRef.current) return;
    const result = pendingResultRef.current;
    const isBig = result.totalWin >= (currentBet * 5);

    setLastWinResult(result);
    setLastWin(result.totalWin);

    if (result.totalWin > 0) {
      setBalance(prev => prev + result.totalWin);
      statsRef.current.totalWin += result.totalWin;
      setWinOverlayKey(prev => prev + 1); // Force new overlay
      
      // Always show overlay for wins, but use different animations based on win size
      if (isBig) {
        setGameState('animatingBigWin');
        playBigWin(result.totalWin);
      } else {
        setGameState('resolvingWin');
        playWin(result.totalWin);
      }
    } else {
      setGameState('resolvingWin'); 
      setTimeout(() => setGameState('idle'), 500);
    }

    postToParent({
      type: 'SPIN_END',
      payload: { 
        sessionId: sessionId.current, 
        phase: currentPhase, 
        result: result, 
        balanceAfter: balance + result.totalWin 
      }
    });
  };

  const handleOverlayComplete = useCallback(() => {
    console.log('Overlay complete, setting game state to idle');
    // Ensure any pending timeouts are cleared
    setGameState('idle');
    
    // Force a re-render to ensure state updates
    setLastWin(prev => {
      console.log('Resetting last win from:', prev);
      return 0;
    });
    
    // Reset the win result
    setLastWinResult(null);
    
    console.log('Game state after overlay complete:', 'idle');
  }, []);

  const styles = PHASE_STYLES[currentPhase];
  // Show overlay if we are in a win state AND we have a win amount > 0
  const showOverlay = (gameState === 'resolvingWin' || gameState === 'animatingBigWin') && lastWin > 0;
  const isBigWin = lastWin >= (currentBet * 5);
  
  // Debug logging
  useEffect(() => {
    console.log('Game state:', gameState, 'Last win:', lastWin, 'Show overlay:', showOverlay);
  }, [gameState, lastWin, showOverlay]);

  return (
    <div className="relative w-full min-h-[100dvh] bg-black text-white font-body overflow-hidden select-none flex flex-col">
      
      {/* Dark, Moody Background - Matching Image */}
      <div 
         className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-[3000ms]"
         style={{
           background: `radial-gradient(circle at 50% 50%, ${
             currentPhase === 'Calm' ? 'rgba(0, 20, 40, 0.8)' : 
             currentPhase === 'Surge' ? 'rgba(40, 10, 0, 0.8)' : 'rgba(30, 0, 40, 0.8)'
           } 0%, #000000 100%)`,
           boxShadow: 'inset 0 0 200px rgba(0, 0, 0, 0.9)',
         }}
      />
      
      {/* Ambient Neon Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0, 240, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(204, 0, 255, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      <motion.div 
        className="absolute inset-0 z-0"
        style={{ 
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
        animate={{
          opacity: gameState === 'animatingBigWin' ? 1 : 0.6,
        }}
        transition={{ duration: 0.5 }}
      >
         <ParticlesBackground phase={currentPhase} />
      </motion.div>

      {/* Glowing Neon Grid Background - Matching Image */}
      <div 
         className="absolute bottom-0 left-[-50%] right-[-50%] h-[50vh] z-0 pointer-events-none"
         style={{
           transform: `perspective(1000px) rotateX(60deg) translateY(100px) translateZ(-200px)`,
           background: 'linear-gradient(to top, transparent 0%, rgba(0, 240, 255, 0.1) 100%)',
           opacity: 0.6,
         }}
      >
         <div 
            className="w-full h-full neon-grid"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px),
                linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
              animation: 'grid-scroll 10s linear infinite',
              boxShadow: 'inset 0 0 200px rgba(0, 240, 255, 0.2), 0 0 300px rgba(0, 240, 255, 0.15)',
            }}
         />
      </div>
      
      {/* Additional Floor Grid Glow */}
      <div 
         className="absolute bottom-0 left-0 right-0 h-[30vh] z-0 pointer-events-none"
         style={{
           background: `
             linear-gradient(to top, 
               rgba(0, 240, 255, 0.15) 0%,
               rgba(0, 240, 255, 0.05) 50%,
               transparent 100%
             )
           `,
           boxShadow: '0 -100px 200px rgba(0, 240, 255, 0.2)',
         }}
      />

      <motion.div 
        className="relative z-10 w-full flex-grow flex flex-col items-center justify-center p-4 min-h-0"
        animate={gameState === 'animatingBigWin' ? {
          scale: [1, 1.02, 1],
          x: [0, -2, 2, -2, 2, 0], 
          transition: { duration: 0.5 }
        } : {}}
      >
          <motion.div 
            className="mb-4 text-center shrink-0"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Neon SLOT Sign - Matching Image */}
            <motion.div
              className="relative inline-block"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.8))',
              }}
            >
              <motion.h1 
                className="text-4xl md:text-7xl font-display font-black italic tracking-tighter neon-text-cyan"
                style={{
                  transform: 'perspective(800px) rotateX(5deg)',
                  transformStyle: 'preserve-3d',
                  WebkitTextStroke: '2px #00f0ff',
                  textStroke: '2px #00f0ff',
                }}
                whileHover={{
                  scale: 1.05,
                  filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 1))',
                  transition: { duration: 0.3 },
                }}
              >
                CHRONO<span className={styles.accent}>ZOO</span>
              </motion.h1>
              {/* Neon Glow Behind Text */}
              <div
                className="absolute inset-0 blur-2xl opacity-50"
                style={{
                  background: 'radial-gradient(ellipse, rgba(0, 240, 255, 0.6), transparent 70%)',
                  transform: 'translateZ(-20px)',
                }}
              />
            </motion.div>
          </motion.div>

          <div className="w-full shrink-0">
             <TimeCycleBar currentPhase={currentPhase} startTimeRef={startTimeRef} />
          </div>
          
          <div className="relative mt-2 w-full max-w-2xl flex justify-center flex-shrink min-h-[250px] aspect-[4/3]">
            <ReelsPanelErrorBoundary 
              grid={reelsGrid} 
              gameState={gameState} 
              wins={lastWinResult?.linesWon || []} 
              onSpinComplete={onSpinComplete}
              currentPhase={currentPhase}
            />
            <EffectsLayer active={gameState === 'resolvingWin' || gameState === 'animatingBigWin'} phase={currentPhase} wins={lastWinResult?.linesWon || []} />
            
            <WinParticles 
              active={showOverlay}
              phase={currentPhase}
              isBigWin={isBigWin}
            />
            <AnimatePresence mode='wait'>
              {showOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                  <BigWinOverlay 
                    key={winOverlayKey}
                    amount={lastWin} 
                    onComplete={handleOverlayComplete} 
                    isBigWin={isBigWin}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full shrink-0 mt-4 pb-safe">
            <BottomHUD 
              balance={balance}
              bet={currentBet}
              lastWin={lastWin}
              gameState={gameState}
              currentPhase={currentPhase}
              onWarp={handleWarp}
              onBetChange={setCurrentBet}
            />
          </div>
      </motion.div>
    </div>
  );
}
