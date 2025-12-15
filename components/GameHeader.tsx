import React from 'react';
import { UserProfile, UserStats, GamePhase } from '../types';
import { Timer } from './Timer';
import { GAME_CONFIG } from '../constants-orginal';

interface Props {
    user: UserProfile;
    stats: UserStats;
    balance: number;
    phase: GamePhase;
    timeLeft: number;
}

export const GameHeader: React.FC<Props> = ({ user, stats, balance, phase, timeLeft }) => {
    const isProfit = stats.netProfit >= 0;

    return (
        <header className="h-[70px] px-6 flex items-center justify-between z-50 shrink-0 border-b border-white/5 bg-neo-bg/80 backdrop-blur-md">

            {/* Brand */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neo-gold to-neo-goldDim flex items-center justify-center shadow-[0_0_20px_rgba(226,182,89,0.3)]">
                    <span className="font-display font-bold text-black text-2xl">R</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-display font-bold text-xl tracking-widest text-white leading-none">ROYALE</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-neo-gold uppercase tracking-[0.3em]">Neo Glass</span>
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                </div>
            </div>

            {/* Game Status */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4">
                {phase === GamePhase.WAITING_FOR_BETS ? (
                    <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-4 border-neo-accent/30">
                        <Timer timeLeft={timeLeft} totalTime={GAME_CONFIG.BETTING_DURATION_SEC} />
                        <span className="text-xs text-neo-accent font-bold uppercase tracking-widest">Place Your Bets</span>
                    </div>
                ) : (
                    <div className="glass-panel px-8 py-2 rounded-full border-red-500/30 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                            {phase === GamePhase.SPINNING ? 'No More Bets' : 'Resolving'}
                        </span>
                    </div>
                )}
            </div>

            {/* User Status */}
            <div className="flex items-center gap-4">
                {/* Balance */}
                <div className="glass-panel px-5 py-2 rounded-full flex flex-col items-end border-neo-gold/20 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Balance</span>
                    <span className="font-display font-bold text-xl text-neo-gold drop-shadow-sm">
                        ${balance.toLocaleString()}
                    </span>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full border-2 border-white/10 p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-sm text-white">
                        {user.username.charAt(0)}
                    </div>
                </div>
            </div>

        </header>
    );
};