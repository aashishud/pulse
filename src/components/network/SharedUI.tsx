"use client";

import React, { useState, useEffect } from 'react';
import { Timer, MousePointerClick } from 'lucide-react';

export const PulseNetworkLogo = ({ className = "w-6 h-6" }) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" fill="currentColor" />
      <path d="M16 9H20L22 11V13L20 15H15L16 9Z" fill="#000000" />
    </svg>
    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-black animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
  </div>
);

export const FicoRadialChart = ({ score }: { score: number }) => {
  const min = 300;
  const max = 850;
  const percentage = Math.max(0, Math.min(1, (score - min) / (max - min)));
  const strokeDasharray = 126; 
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage);

  let label = "POOR";
  let colorClass = "text-red-400";
  if (score >= 580) { label = "FAIR"; colorClass = "text-orange-400"; }
  if (score >= 670) { label = "GOOD"; colorClass = "text-yellow-400"; }
  if (score >= 740) { label = "VERY GOOD"; colorClass = "text-emerald-400"; }
  if (score >= 800) { label = "EXCELLENT"; colorClass = "text-indigo-400"; }

  return (
    <div className="relative w-full aspect-[2/1] flex flex-col items-center justify-end overflow-hidden mt-4">
      <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
        <defs>
          <linearGradient id="ficoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
        <path 
          d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#ficoGrad)" strokeWidth="8" 
          strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1500 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl font-black font-mono tracking-tighter text-white">{Math.floor(score)}</span>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${colorClass}`}>{label}</span>
      </div>
      <div className="absolute bottom-1 w-full flex justify-between px-4 text-[9px] font-mono tracking-widest text-zinc-500">
        <span>300</span>
        <span>850</span>
      </div>
    </div>
  );
};

export const NetWorthChart = ({ data = [] }: { data?: number[] }) => {
  const safeData = data.length > 1 ? data : [0, Math.max(100, data[0] || 100)];
  const max = Math.max(...safeData, 100);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const mappedScaled = safeData.map((val, i) => ({ x: (i / (safeData.length - 1)) * 400, y: 100 - ((val - min) / range) * 80 }));
  let d2 = `M${mappedScaled[0].x},${mappedScaled[0].y} `;
  for (let i = 0; i < mappedScaled.length - 1; i++) {
    const cp1x = mappedScaled[i].x + (mappedScaled[i+1].x - mappedScaled[i].x) / 2;
    const cp1y = mappedScaled[i].y;
    const cp2x = mappedScaled[i].x + (mappedScaled[i+1].x - mappedScaled[i].x) / 2;
    const cp2y = mappedScaled[i+1].y;
    d2 += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${mappedScaled[i+1].x},${mappedScaled[i+1].y} `;
  }
  const areaD = `${d2} L400,120 L0,120 Z`;
  return (
    <div className="w-full h-40 mt-6 relative">
      <svg viewBox="0 0 400 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" /><stop offset="100%" stopColor="rgba(16, 185, 129, 0)" /></linearGradient>
        </defs>
        <path d="M0,30 L400,30 M0,70 L400,70" stroke="#ffffff10" strokeWidth="1" strokeDasharray="4 4" />
        <path d={areaD} fill="url(#chartFill)" />
        <path d={d2} fill="none" stroke="#10b981" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </svg>
    </div>
  );
};

export const ActiveJobModal = ({ job, onClose, onComplete }: { job: any, onClose: () => void, onComplete: (success: boolean, timeRemaining: number) => void }) => {
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(job.timeLimit);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev: number) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  useEffect(() => { if (isStarted && timeLeft <= 0) onComplete(false, 0); }, [timeLeft, isStarted, onComplete]);

  const handleClick = () => {
    if (!isStarted) setIsStarted(true);
    const newClicks = clicks + 1;
    setClicks(newClicks);
    if (newClicks >= job.clicksRequired) onComplete(true, timeLeft);
  };

  const progress = Math.min(100, (clicks / job.clicksRequired) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4 shadow-inner">
             <MousePointerClick className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{job.title}</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-xs leading-relaxed">
            {isStarted ? "Keep clicking to complete the task before time runs out!" : "Click the button below to start the timer."}
          </p>
          <div className="w-full flex justify-between items-center mb-2 px-1">
             <div className="flex items-center gap-2 font-mono text-zinc-300 font-bold"><Timer className="w-4 h-4 text-red-400" /> {timeLeft}s</div>
             <div className="font-mono text-zinc-300 font-bold">{clicks} / {job.clicksRequired}</div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5">
             <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
          <button onClick={handleClick} className="w-full py-12 rounded-2xl bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all text-2xl font-black flex items-center justify-center select-none shadow-xl">
             {isStarted ? "WORK!" : "START JOB"}
          </button>
       </div>
    </div>
  );
};