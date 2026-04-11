"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Server, ShieldAlert, Cpu, Check, AlertTriangle, Zap, Activity, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================================
// LOGO COMPONENT
// ============================================================================
export const PulseNetworkLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12H6L9 3L15 21L18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


// ============================================================================
// MINI-GAME 1: TIMING & PRECISION (Server Sync)
// ============================================================================
const ServerSyncGame = ({ requiredSyncs = 3, onWin, speed = 1 }: { requiredSyncs?: number, onWin: () => void, speed?: number }) => {
    const [syncs, setSyncs] = useState(0);
    const [position, setPosition] = useState(0);
    const [target, setTarget] = useState({ start: 40, width: 20 });
    const dir = useRef(1);
    const [errorFlash, setErrorFlash] = useState(false);

    useEffect(() => {
        const int = setInterval(() => {
            setPosition(p => {
                let next = p + (dir.current * 1.8 * speed);
                if(next >= 100) { next = 100; dir.current = -1; }
                if(next <= 0) { next = 0; dir.current = 1; }
                return next;
            });
        }, 16);
        return () => clearInterval(int);
    }, [speed]);

    const handleClick = () => {
        if (position >= target.start && position <= target.start + target.width) {
            const newSyncs = syncs + 1;
            if (newSyncs >= requiredSyncs) {
                onWin();
            } else {
                setSyncs(newSyncs);
                // Make the next target smaller and randomly placed!
                setTarget({ start: Math.random() * 60 + 10, width: Math.max(8, 25 - newSyncs * 4) });
            }
        } else {
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 300);
        }
    };

    return (
        <div className={`w-full flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border ${errorFlash ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]' : 'border-white/10'} transition-all duration-200`}>
            <Cpu className={`w-12 h-12 mb-4 ${errorFlash ? 'text-red-500' : 'text-indigo-400'}`} />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">Align the frequency to sync</p>

            <div className="w-full h-12 bg-black/50 border border-white/10 rounded-full relative overflow-hidden mb-8 shadow-inner cursor-crosshair" onMouseDown={handleClick}>
                {/* Target Zone */}
                <div 
                   className="absolute h-full bg-emerald-500/30 border-x border-emerald-400 z-10"
                   style={{ left: `${target.start}%`, width: `${target.width}%` }}
                />
                {/* Moving Needle */}
                <div 
                   className="absolute h-[140%] w-2 bg-white -top-[20%] rounded-full shadow-[0_0_10px_white] z-20 pointer-events-none"
                   style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                />
            </div>

            <div className="flex gap-2 w-full mb-6">
                {Array.from({length: requiredSyncs}).map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${i < syncs ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                ))}
            </div>

            <button onClick={handleClick} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest transition shadow-lg active:scale-95">
               [ SPACE / CLICK TO SYNC ]
            </button>
            
            {/* Global Spacebar Listener for desktop ease */}
            <FocusTrapSpacebar onSpace={handleClick} />
        </div>
    );
};

// ============================================================================
// MINI-GAME 2: REFLEX SORTING (Data Router)
// ============================================================================
const DataRouterGame = ({ requiredRoutes = 10, onWin }: { requiredRoutes?: number, onWin: () => void }) => {
    const [routes, setRoutes] = useState(0);
    const [isMalware, setIsMalware] = useState(false);
    const [errorFlash, setErrorFlash] = useState(false);

    const spawnNext = () => setIsMalware(Math.random() > 0.5);
    useEffect(() => spawnNext(), []);

    const handleAction = (userChoseMalware: boolean) => {
        if (userChoseMalware === isMalware) {
            const next = routes + 1;
            if (next >= requiredRoutes) onWin();
            else { setRoutes(next); spawnNext(); }
        } else {
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 300);
            setRoutes(Math.max(0, routes - 1)); // Penalty for mistake!
        }
    };

    return (
        <div className={`w-full flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border ${errorFlash ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]' : 'border-white/10'} transition-all duration-200`}>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Filter Incoming Packets</p>

            <div className={`w-full max-w-[250px] aspect-square rounded-2xl border-2 flex flex-col items-center justify-center mb-8 shadow-2xl transition-colors ${isMalware ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                {isMalware ? <ShieldAlert className="w-16 h-16 text-red-500 mb-2" /> : <Server className="w-16 h-16 text-emerald-400 mb-2" />}
                <span className={`font-black text-xl tracking-widest ${isMalware ? 'text-red-500' : 'text-emerald-400'}`}>
                   {isMalware ? 'MALWARE' : 'SAFE NODE'}
                </span>
            </div>

            <div className="flex gap-4 w-full mb-6">
                <button onClick={() => handleAction(true)} className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 font-black rounded-xl uppercase tracking-widest transition active:scale-95 flex flex-col items-center gap-1">
                   <ShieldAlert className="w-5 h-5" /> REJECT
                </button>
                <button onClick={() => handleAction(false)} className="flex-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-black rounded-xl uppercase tracking-widest transition active:scale-95 flex flex-col items-center gap-1">
                   <Check className="w-5 h-5" /> APPROVE
                </button>
            </div>

            <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span>Filtered: {routes}/{requiredRoutes}</span>
                <span className="text-red-400">Mistakes = Penalty</span>
            </div>
        </div>
    );
};

// ============================================================================
// MINI-GAME 3: MEMORY & FOCUS (Security Bypass)
// ============================================================================
const SecurityBypassGame = ({ sequenceLength = 5, onWin }: { sequenceLength?: number, onWin: () => void }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [phase, setPhase] = useState<'init'|'watch'|'play'|'error'>('init');
    const [activeCell, setActiveCell] = useState<number | null>(null);

    useEffect(() => {
        const seq = Array.from({length: sequenceLength}, () => Math.floor(Math.random() * 9));
        setSequence(seq);
        startPlayback(seq);
    }, [sequenceLength]);

    const startPlayback = async (seq: number[]) => {
        setPhase('watch');
        setPlayerIndex(0);
        await new Promise(r => setTimeout(r, 800)); // Pause before flash
        
        for (let i = 0; i < seq.length; i++) {
            setActiveCell(seq[i]);
            await new Promise(r => setTimeout(r, 400)); // Cell stays lit
            setActiveCell(null);
            await new Promise(r => setTimeout(r, 200)); // Gap between flashes
        }
        setPhase('play');
    };

    const handleCellClick = (idx: number) => {
        if (phase !== 'play') return;
        
        if (idx === sequence[playerIndex]) {
            const next = playerIndex + 1;
            setPlayerIndex(next);
            if (next >= sequence.length) {
                setPhase('init');
                onWin();
            }
        } else {
            setPhase('error');
            setTimeout(() => startPlayback(sequence), 1000); // Restart same sequence on fail
        }
    };

    return (
        <div className={`w-full flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border ${phase === 'error' ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]' : phase === 'play' ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/10'} transition-all duration-300`}>
            <Fingerprint className={`w-8 h-8 mb-2 ${phase === 'play' ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">
                {phase === 'watch' ? 'MEMORIZE PATTERN' : phase === 'play' ? 'REPEAT PATTERN' : phase === 'error' ? 'SECURITY BREACH - RESTARTING' : 'CONNECTING...'}
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-[250px] mb-6">
                {Array.from({length: 9}).map((_, i) => (
                    <button 
                       key={i} 
                       onMouseDown={() => handleCellClick(i)}
                       className={`aspect-square rounded-xl border-2 transition-all duration-150 ${
                           activeCell === i 
                               ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-105' 
                               : phase === 'play'
                                  ? 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-white/5 active:scale-95'
                                  : 'bg-black/60 border-white/5 opacity-50 cursor-not-allowed'
                       }`}
                    />
                ))}
            </div>

            <div className="flex justify-center gap-1">
                {sequence.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < playerIndex ? 'bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-white/10'}`} />
                ))}
            </div>
        </div>
    );
};

// Utility to bind spacebar to buttons easily
const FocusTrapSpacebar = ({ onSpace }: { onSpace: () => void }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                onSpace();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSpace]);
    return null;
}

// ============================================================================
// MAIN ACTIVE JOB MODAL SHELL
// ============================================================================

// PROPERLY TYPE THE COMPONENT PROPS SO `page.tsx` CAN INFER THE CALLBACK PARAMS
interface ActiveJobModalProps {
    job: any;
    onClose: () => void;
    onComplete: (success: boolean, timeRemaining: number) => void | Promise<void>;
}

export const ActiveJobModal = ({ job, onClose, onComplete }: ActiveJobModalProps) => {
    const [timeLeft, setTimeLeft] = useState(job.timeLimit);
    const [gameState, setGameState] = useState<'start'|'playing'|'win'|'lose'>('start');
    
    // FIX: Lock the onComplete callback to prevent endless timer re-renders
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Automatically map the Job ID to the perfect mini-game type dynamically!
    const minigameType = job.gameType || 'timing';

    // Global Game Timer
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    setGameState('lose');
                    setTimeout(() => onCompleteRef.current(false, 0), 1500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [gameState]);

    const handleWin = () => {
        setGameState('win');
        setTimeout(() => onCompleteRef.current(true, timeLeft), 1000);
    };

    const Icon = job.icon || Activity;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-md shadow-2xl flex flex-col relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                           <Icon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                           <h3 className="font-black text-white text-lg tracking-tight leading-none">{job.title}</h3>
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Difficulty: {job.difficulty}</p>
                        </div>
                    </div>
                    {gameState === 'start' && (
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
                           <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-6 md:p-8 flex-1 flex flex-col items-center justify-center min-h-[350px]">
                    {gameState === 'start' && (
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                            <h2 className="text-2xl font-black text-white mb-2">Ready to hustle?</h2>
                            <p className="text-zinc-400 text-sm mb-8 leading-relaxed px-4">
                                {minigameType === 'sorter' && "Swipe or click to sort incoming packets. Mistakes will penalize your progress."}
                                {minigameType === 'timing' && "Align the needle perfectly into the green zone and trigger the sync."}
                                {minigameType === 'memory' && "Memorize the security pattern and repeat it flawlessly to bypass the firewall."}
                            </p>
                            <button onClick={() => setGameState('playing')} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95">
                                Start Job
                            </button>
                        </div>
                    )}

                    {gameState === 'playing' && (
                        <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
                            {/* The specific Mini-Game loads here based on job mapping */}
                            {minigameType === 'sorter' && <DataRouterGame requiredRoutes={job.difficulty === 'easy' ? 8 : 15} onWin={handleWin} />}
                            {minigameType === 'timing' && <ServerSyncGame requiredSyncs={job.difficulty === 'easy' ? 2 : 4} speed={job.difficulty === 'hard' ? 1.5 : 1} onWin={handleWin} />}
                            {minigameType === 'memory' && <SecurityBypassGame sequenceLength={job.difficulty === 'hard' ? 6 : 4} onWin={handleWin} />}
                            
                            {/* Master Timer */}
                            <div className="mt-8 flex flex-col items-center w-full">
                                <div className="flex justify-between w-full mb-2">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time Remaining</span>
                                    <span className={`text-[10px] font-black font-mono tracking-wider ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                       className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                       initial={{ width: '100%' }}
                                       animate={{ width: `${(timeLeft / job.timeLimit) * 100}%` }}
                                       transition={{ duration: 1, ease: 'linear' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {gameState === 'win' && (
                        <div className="text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                                <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Success!</h2>
                            <p className="text-emerald-400 font-bold text-sm tracking-wide">Processing payout...</p>
                        </div>
                    )}

                    {gameState === 'lose' && (
                        <div className="text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                                <AlertTriangle className="w-10 h-10 text-red-500" strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Job Failed</h2>
                            <p className="text-red-400 font-bold text-sm tracking-wide">Time expired. Fines applied.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};