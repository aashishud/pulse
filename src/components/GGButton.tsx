"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface GGButtonProps {
  targetUserId: string; // The ID of the profile owner
  initialCount: number;
}

export default function GGButton({ targetUserId, initialCount }: GGButtonProps) {
  // Initialize with server state, but update via listener
  const [count, setCount] = useState(initialCount);
  const [hasGGed, setHasGGed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [animating, setAnimating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 1. Handle Hydration & Auth
  useEffect(() => {
    setIsClient(true);
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Listener for the Profile Data
  // This ensures that if the user reloads, they get the absolute latest count and status from DB
  useEffect(() => {
    if (!targetUserId) return;

    const userRef = doc(db, "users", targetUserId);
    
    // Listen to the specific document
    const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Update Count
        setCount(data.ggs || 0);

        // Update "Has Liked" status if user is logged in
        if (currentUser && data.gg_users && Array.isArray(data.gg_users)) {
          setHasGGed(data.gg_users.includes(currentUser.uid));
        }
      }
    });

    return () => unsubscribeSnapshot();
  }, [targetUserId, currentUser]); // Re-run if currentUser changes (e.g. login)

  const handleGG = async () => {
    if (!currentUser) {
      alert("Please login to give a GG!");
      return;
    }

    // Debounce/Animation state
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 500);

    // Optimistic UI Update
    const previousState = hasGGed;
    const previousCount = count;
    
    setHasGGed(!previousState);
    setCount(prev => !previousState ? prev + 1 : prev - 1);

    try {
      const userRef = doc(db, "users", targetUserId);
      
      if (!previousState) {
        // Add Like
        await updateDoc(userRef, {
          ggs: increment(1),
          gg_users: arrayUnion(currentUser.uid)
        });
      } else {
        // Remove Like
        await updateDoc(userRef, {
          ggs: increment(-1),
          gg_users: arrayRemove(currentUser.uid)
        });
      }
    } catch (error) {
      console.error("Failed to update GG:", error);
      // Rollback on error
      setHasGGed(previousState);
      setCount(previousCount);
      alert("Failed to update. Please try again.");
    }
  };

  if (!isClient) {
    // Server/Loading state: Show static initial count
    return (
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-zinc-900 border border-zinc-700 text-zinc-400 opacity-80 cursor-default">
        <Heart className="w-5 h-5" />
        <span>{initialCount}</span>
        <span className="text-[10px] uppercase opacity-70">GGs</span>
      </button>
    );
  }

  return (
    <button 
      onClick={handleGG}
      disabled={animating}
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 active:scale-95 ${
        hasGGed 
          ? "bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
          : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
      }`}
    >
      <div className={`relative ${animating ? "animate-ping" : ""}`}>
        <Heart 
          className={`w-5 h-5 transition-transform duration-300 ${
            hasGGed ? "fill-current scale-110" : "group-hover:scale-110"
          }`} 
        />
      </div>
      
      <span className="tabular-nums">{count}</span>
      <span className="text-[10px] uppercase opacity-70">GGs</span>
      
      {/* Particle Burst Effect */}
      {animating && !hasGGed && (
         <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-10 h-10 rounded-full border-2 border-red-500/50 animate-ping opacity-75"></span>
         </span>
      )}
    </button>
  );
}