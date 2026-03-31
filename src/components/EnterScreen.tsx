"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import PulseLogo from '@/components/PulseLogo';

interface EnterScreenProps {
  bgmUrl?: string;
  bgVideoUrl?: string;
  enterText?: string;
  children: React.ReactNode;
}

export default function EnterScreen({ bgmUrl, bgVideoUrl, enterText, children }: EnterScreenProps) {
  // Only trigger the click-to-enter screen if they have music OR a background video!
  const requiresEnter = Boolean(bgmUrl || bgVideoUrl);
  
  // If it doesn't require an enter screen, we set hasEntered to true immediately
  const [hasEntered, setHasEntered] = useState(!requiresEnter);
  const [isFading, setIsFading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Volume Control State ---
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);

  // Helper to extract YouTube Video ID for iframe embedding
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isYouTube = bgmUrl && (bgmUrl.includes('youtube.com') || bgmUrl.includes('youtu.be'));
  const ytId = isYouTube ? getYoutubeId(bgmUrl as string) : null;

  // Safely sync volume without unmounting players
  useEffect(() => {
    const currentVol = isMuted ? 0 : volume;
    
    // 1. Update HTML5 Audio
    if (audioRef.current) {
      audioRef.current.volume = currentVol;
    }

    // 2. Update YouTube Iframe via postMessage API
    if (isYouTube && hasEntered) {
      const iframe = document.getElementById('yt-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [currentVol * 100]
        }), '*');
      }
    }
  }, [volume, isMuted, hasEntered, isYouTube]);

  const handleEnter = () => {
    if (hasEntered) return;

    const currentVol = isMuted ? 0 : volume;

    // 1. Play raw audio if it exists
    if (!isYouTube && audioRef.current) {
      audioRef.current.volume = currentVol;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    // 2. Trigger CSS fade out
    setIsFading(true);

    // 3. Remove overlay from DOM after animation completes
    setTimeout(() => setHasEntered(true), 600);
  };

  const displayText = enterText?.trim() ? enterText : "CLICK TO ENTER";

  return (
    <>
      {/* Custom Floating Animation & FAT FINGER Slider CSS */}
      <style>{`
        @keyframes custom-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-custom-float {
          animation: custom-float 3s ease-in-out infinite;
        }
        
        /* THE FIX: Massive invisible hitboxes for the slider */
        input[type=range].pulse-slider {
          -webkit-appearance: none;
          background: transparent;
          height: 30px; /* Massive invisible vertical grabbing area */
          width: 100%;
        }
        input[type=range].pulse-slider:focus {
          outline: none;
        }
        input[type=range].pulse-slider::-webkit-slider-runnable-track {
          height: 6px; /* Slightly thicker visual track */
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
        }
        input[type=range].pulse-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px; /* Much larger grab thumb */
          width: 18px;
          border-radius: 50%;
          background: white;
          margin-top: -6px; /* Centers the thumb vertically: (track height 6 / 2) - (thumb height 18 / 2) = 3 - 9 = -6 */
          box-shadow: 0 0 15px rgba(255,255,255,0.6);
          cursor: pointer;
        }
        /* Firefox support */
        input[type=range].pulse-slider::-moz-range-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
        }
        input[type=range].pulse-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border: none;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 15px rgba(255,255,255,0.6);
          cursor: pointer;
        }
      `}</style>

      {/* --- HIDDEN AUDIO PLAYERS --- */}
      {/* Raw Audio Preload */}
      {!isYouTube && bgmUrl && (
        <audio ref={audioRef} src={bgmUrl} loop preload="auto" className="hidden" />
      )}
      {/* YouTube iframe (Only renders AFTER click so it autoplays legally) */}
      {hasEntered && isYouTube && ytId && (
        <iframe
          id="yt-player"
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&controls=0&enablejsapi=1`}
          allow="autoplay"
          className="hidden absolute pointer-events-none opacity-0"
          onLoad={(e) => {
             // Set correct volume the millisecond the video loads
             const currentVol = isMuted ? 0 : volume;
             e.currentTarget.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [currentVol * 100]
             }), '*');
          }}
        />
      )}

      {/* --- FLOATING VOLUME CONTROLLER --- */}
      {hasEntered && bgmUrl && (
        /* Increased padding and gap to give more room for sloppy cursor movements */
        <div className="fixed bottom-6 right-6 z-[99999] group flex items-center gap-3 bg-[#121214]/80 backdrop-blur-xl border border-white/10 p-3 rounded-full shadow-2xl transition-all duration-500 hover:bg-[#18181b] animate-in fade-in slide-in-from-bottom-8">
           <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-zinc-300 hover:text-white shrink-0"
           >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
           </button>
           {/* Increased group-hover:w-28 (from 20) for a much longer, precise slider track */}
           <div className="w-0 overflow-hidden group-hover:w-32 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center opacity-0 group-hover:opacity-100 pr-2">
              <input 
                 type="range" 
                 min="0" 
                 max="1" 
                 step="0.01" 
                 value={isMuted ? 0 : volume}
                 onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                 }}
                 className="pulse-slider"
              />
           </div>
        </div>
      )}

      {/* --- THE CLICK TO ENTER OVERLAY --- */}
      {!hasEntered && (
        <div 
          onClick={handleEnter}
          className={`fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center cursor-pointer transition-opacity duration-700 ease-in-out ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
           <div className="flex flex-col items-center gap-6 animate-custom-float">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                 {/* REPLACED SPARKLES WITH PULSE LOGO */}
                 <PulseLogo className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-white font-black text-xl tracking-widest uppercase select-none">{displayText}</h1>
           </div>
        </div>
      )}

      {/* --- THE PROFILE CONTENT --- */}
      <div className={`transition-all duration-1000 ease-out min-h-screen ${
        !hasEntered && !isFading ? 'opacity-0 blur-xl scale-[1.02] pointer-events-none' : 'opacity-100 blur-none scale-100'
      }`}>
        {children}
      </div>
    </>
  );
}