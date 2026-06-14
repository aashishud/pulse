"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import PulseLogo from "@/components/PulseLogo";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        setCurrentUser(user);
        setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="w-full flex justify-center pt-6 px-6 z-50 relative">
       <nav className="w-full max-w-5xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-4 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-3 group cursor-pointer">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-105 transition">
                <PulseLogo className="w-4 h-4 text-black" />
             </div>
             <span className="text-white drop-shadow-md hidden sm:inline-block">Pulse</span>
          </Link>
          
          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
             <Link href="/" className="text-zinc-400 hover:text-white transition">Home</Link>
             <Link href="/pricing" className="text-zinc-400 hover:text-white transition">Pricing</Link>
             <Link href="/faq" className="text-zinc-400 hover:text-white transition">FAQ</Link>
             <Link href="/terms" className="text-zinc-400 hover:text-white transition">Terms</Link>
          </div>

          <div className={`flex gap-3 items-center transition-opacity duration-300 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
             {currentUser ? (
             <>
                <Link href="/dashboard" className="text-sm font-bold bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-full hover:bg-white hover:text-black transition flex items-center gap-2">
                   <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button 
                   onClick={() => signOut(auth)} 
                   className="text-sm font-medium text-zinc-400 hover:text-white transition px-3 py-2.5"
                >
                   Log out
                </button>
             </>
             ) : (
             <>
                <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition px-4 py-2.5">
                   Log in
                </Link>
                <Link href="/signup" className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-zinc-200 transition hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                   Sign Up
                </Link>
             </>
             )}
          </div>
       </nav>
    </div>
  );
}
