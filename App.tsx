import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, BetType, PlacedBet, UserProfile, UserStats, LeaderboardEntry, QuantumMultiplier } from './types';
import { AVAILABLE_CHIPS, GAME_CONFIG } from './constants';
import { RouletteWheel } from './components/RouletteWheel';
import { BettingTable } from './components/BettingTable';
import { GameControls } from './components/GameControls';
import { HistoryPanel } from './components/HistoryPanel';
import { GameHeader } from './components/GameHeader';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { Racetrack } from './components/Racetrack';
import { comms } from './services/communication';
import { simulation } from './services/simulation';
import { getAnimalImagePath, getAnimalName } from './animalMapping';

// ✅ IMPORT CHIP MAPPING FOR USE IN GameControls
import { chipMapping } from './chipMapping';

const App: React.FC = () => {
  // --- Game State ---
  const [phase, setPhase] = useState<GamePhase>(GamePhase.WAITING_FOR_BETS);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.BETTING_DURATION_SEC);
  const [winningNumber, setWinningNumber] = useState<string | null>(null);

  // --- User State ---
  const [user, setUser] = useState<UserProfile>({ userId: 'user_local_123', username: 'ProPlayer', currency: 'USD', vipLevel: 7 });
  const [balance, setBalance] = useState(25000);
  const [stats, setStats] = useState<UserStats>({ totalWagered: 0, totalWon: 0, netProfit: 0, startBalance: 25000 });

  // --- Round State ---
  const [currentBets, setCurrentBets] = useState<PlacedBet[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedChip, setSelectedChip] = useState<number>(AVAILABLE_CHIPS[1].value);
  const [lastWin, setLastWin] = useState<number>(0);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // --- Pro Features State ---
  const [showRacetrack, setShowRacetrack] = useState(false);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [quantumMultipliers, setQuantumMultipliers] = useState<QuantumMultiplier[]>([]);
  const [highlightedNeighbors, setHighlightedNeighbors] = useState<string[]>([]);

  // --- Refs ---
  const betsRef = useRef<PlacedBet[]>([]);
  const lastRoundIdRef = useRef<string>('');
  const lastBetsRef = useRef<PlacedBet[]>([]);

  useEffect(() => { betsRef.current = currentBets; }, [currentBets]);

  const totalBetAmount = currentBets.reduce((sum, bet) => sum + bet.amount, 0);

  // --- Initialization ---
  useEffect(() => {
    comms.sendMessage({
      type: 'IFRAME_READY',
      data: { iframeId: 'roulette_neo', dimensions: { width: window.innerWidth, height: window.innerHeight } }
    });

    simulation.startSimulation();

    const unsubState = simulation.subscribeState((newPhase, newTime, result, roundId, multipliers) => {
      setPhase(newPhase);
      setTimeLeft(newTime);

      if (multipliers) setQuantumMultipliers(multipliers);

      if (roundId && roundId !== lastRoundIdRef.current) {
        if (autoPlayActive && lastBetsRef.current.length > 0) {
          const rebetCost = lastBetsRef.current.reduce((s, b) => s + b.amount, 0);
          if (balance >= rebetCost) {
            setCurrentBets(lastBetsRef.current.map(b => ({ ...b, id: Math.random().toString() })));
            setBalance(prev => prev - rebetCost);
            setNotification({ msg: "Autoplay: Bets Placed", type: 'info' });
          } else {
            setAutoPlayActive(false);
            setCurrentBets([]);
          }
        } else {
          setCurrentBets([]);
        }

        setWinningNumber(null);
        setLastWin(0);
        setLeaderboard([]);
        setQuantumMultipliers([]);
        lastRoundIdRef.current = roundId;
      }

      if (newPhase === GamePhase.SPINNING && result && winningNumber === null) {
        setWinningNumber(result);
      }

      if (newPhase === GamePhase.RESULT_DISPLAY && result) {
        if (lastWin === 0 && betsRef.current.length >= 0) {
          handleRoundResult(result, betsRef.current);
          if (betsRef.current.length > 0) lastBetsRef.current = [...betsRef.current];
        }
      }
    });

    const unsubLeaderboard = simulation.subscribeLeaderboard(setLeaderboard);
    return () => { unsubState(); unsubLeaderboard(); };
  }, [autoPlayActive]);

  const handlePlaceBet = useCallback((type: BetType, numbers: string[], payoutRatio: number) => {
    if (balance - totalBetAmount < selectedChip) {
      setNotification({ msg: "Insufficient Balance", type: 'error' });
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    const newBet: PlacedBet = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      numbers,
      amount: selectedChip,
      chipValue: selectedChip,
      payoutRatio,
      status: 'pending'
    };

    setCurrentBets(prev => [...prev, newBet]);
    setBalance(prev => prev - selectedChip);

  }, [balance, totalBetAmount, selectedChip]);

  const handleUndo = () => {
    if (currentBets.length === 0) return;
    const lastBet = currentBets[currentBets.length - 1];
    setBalance(prev => prev + lastBet.amount);
    setCurrentBets(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    const totalRefund = currentBets.reduce((acc, bet) => acc + bet.amount, 0);
    setBalance(prev => prev + totalRefund);
    setCurrentBets([]);
  };

  const handleSaveLayout = () => {
    if (currentBets.length === 0) return;
    localStorage.setItem('saved_layout', JSON.stringify(currentBets));
    setNotification({ msg: "Configuration Saved", type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleLoadLayout = () => {
    const saved = localStorage.getItem('saved_layout');
    if (saved) {
      const bets = JSON.parse(saved) as PlacedBet[];
      const cost = bets.reduce((s, b) => s + b.amount, 0);
      if (balance >= cost) {
        setCurrentBets(bets.map(b => ({ ...b, id: Math.random().toString() })));
        setBalance(prev => prev - cost);
        setNotification({ msg: "Bets Loaded", type: 'success' });
      } else {
        setNotification({ msg: "Insufficient Funds", type: 'error' });
      }
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleRoundResult = (result: string, betsToProcess: PlacedBet[]) => {
    let totalWin = 0;
    const qMult = quantumMultipliers.find(q => q.number === result);

    betsToProcess.forEach(bet => {
      if (bet.numbers.includes(result)) {
        let payout = bet.payoutRatio;
        if (bet.type === BetType.STRAIGHT && qMult) {
          payout = qMult.multiplier;
        }
        const win = (bet.amount * payout) + bet.amount;
        totalWin += win;
      }
    });

    const roundWager = betsToProcess.reduce((acc, b) => acc + b.amount, 0);

    setStats(prev => ({
      totalWagered: prev.totalWagered + roundWager,
      totalWon: prev.totalWon + totalWin,
      netProfit: (prev.totalWon + totalWin) - (prev.totalWagered + roundWager),
      startBalance: prev.startBalance
    }));

    setHistory(prev => [result, ...prev]);
    setLastWin(totalWin);

    if (totalWin > 0) {
      setBalance(prev => prev + totalWin);
      setNotification({ msg: `WIN: $${totalWin.toLocaleString()}`, type: 'success' });
    } else {
      setNotification({ msg: `No Win - ${result}`, type: 'info' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="h-screen w-full bg-neo-bg flex flex-col font-sans text-gray-100 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-800 via-neo-bg to-black">

      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none mix-blend-overlay"></div>

      <GameHeader user={user} stats={stats} balance={balance} phase={phase} timeLeft={timeLeft} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 p-4 lg:p-6 relative z-10">

        {/* LEFT STAGE: Wheel & Info (30%) */}
        <div className="w-full lg:w-[32%] xl:w-[28%] shrink-0 flex flex-col gap-4">

          {/* Wheel Pedestal */}
          <div className="relative h-[400px] lg:h-[500px] shrink-0 flex items-center justify-center animate-float">
            <div className="transform scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-700 ease-out">
              <RouletteWheel phase={phase} winningNumber={winningNumber} />
            </div>

            {/* Cinematic Winner Overlay */}
            {phase === GamePhase.RESULT_DISPLAY && winningNumber && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in zoom-in duration-500">
                <div className="glass-panel border-neo-gold/50 px-10 py-8 rounded-2xl flex flex-col items-center shadow-[0_0_80px_rgba(226,182,89,0.3)]">
                  <div className="text-neo-gold font-display uppercase tracking-[0.3em] text-xs mb-3">Winning Number</div>

                  {/* Animal Image */}
                  {getAnimalImagePath(winningNumber) && (
                    <div className="w-20 h-20 md:w-24 md:h-24 mb-3 flex items-center justify-center">
                      <img
                        src={getAnimalImagePath(winningNumber)}
                        alt={`Animal ${winningNumber}`}
                        className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-bounce-short"
                      />
                    </div>
                  )}

                  <div className="text-6xl font-display font-bold text-white drop-shadow-lg mb-2">{winningNumber}</div>

                  {/* Animal Name */}
                  {getAnimalName(winningNumber) && (
                    <div className="text-neo-gold/80 font-display text-sm uppercase tracking-wider">
                      {getAnimalName(winningNumber)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Information Deck */}
          <div className="hidden lg:flex flex-1 gap-4 min-h-0">
            <div className="w-16 glass-panel rounded-xl overflow-hidden shadow-lg">
              <HistoryPanel history={history} />
            </div>
            <div className="flex-1 glass-panel rounded-xl overflow-hidden shadow-lg flex flex-col">
              <LeaderboardPanel entries={leaderboard} currentRoundId={lastRoundIdRef.current} />
            </div>
          </div>
        </div>

        {/* RIGHT STAGE: Betting & Controls (70%) */}
        <div className="flex-1 flex flex-col min-h-[500px] relative glass-panel rounded-3xl border-white/5 overflow-hidden shadow-2xl">

          {/* Table Surface */}
          <div className="flex-1 relative overflow-auto scrollbar-hide flex items-center justify-center p-6 bg-black/40">
            <div className="transform origin-center w-full max-w-5xl transition-all duration-300">
              {showRacetrack ? (
                <Racetrack onBet={handlePlaceBet} onHoverNumbers={setHighlightedNeighbors} />
              ) : (
                <BettingTable
                  currentBets={currentBets}
                  selectedChip={AVAILABLE_CHIPS.find(c => c.value === selectedChip)!}
                  onPlaceBet={handlePlaceBet}
                  gamePhase={phase}
                  quantumMultipliers={quantumMultipliers}
                  highlightedNumbers={highlightedNeighbors}
                  heatmapActive={heatmapActive}
                />
              )}
            </div>
          </div>

          {/* Control Dock */}
          <div className="shrink-0 relative z-20">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neo-bg via-neo-bg/90 to-transparent pointer-events-none"></div>
            <GameControls
              selectedChip={selectedChip}
              onSelectChip={setSelectedChip}
              onUndo={handleUndo}
              onClear={handleClear}
              gamePhase={phase}
              totalBet={totalBetAmount}
              balance={balance}
              showRacetrack={showRacetrack}
              onToggleRacetrack={() => setShowRacetrack(!showRacetrack)}
              heatmapActive={heatmapActive}
              onToggleHeatmap={() => setHeatmapActive(!heatmapActive)}
              autoPlayActive={autoPlayActive}
              onToggleAutoPlay={() => setAutoPlayActive(!autoPlayActive)}
              onSaveLayout={handleSaveLayout}
              onLoadLayout={handleLoadLayout}
            />
          </div>
        </div>

      </div>

      {/* Mobile Stats Drawer */}
      <div className="lg:hidden absolute top-20 left-2 z-30">
        <HistoryPanel history={history.slice(0, 5)} />
      </div>

      {/* Toast Notification System */}
      {notification && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 glass-panel px-8 py-4 rounded-full flex items-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[100] border border-white/10 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`w-3 h-3 rounded-full ${notification.type === 'error' ? 'bg-red-500 shadow-[0_0_10px_red]' : notification.type === 'success' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-neo-accent shadow-[0_0_10px_blue]'} animate-pulse`}></div>
          <span className="font-display font-bold uppercase tracking-wider text-sm text-white">{notification.msg}</span>
        </div>
      )}

    </div>
  );
};

export default App;