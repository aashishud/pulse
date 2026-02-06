"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface GGButtonProps {
  targetUserId: string; // The ID of the profile owner (from URL/data)
  initialCount: number;
}

export default function GGButton({ targetUserId, initialCount }: GGButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [hasGGed, setHasGGed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Check if user has already GG'd this profile
        // Note: For large apps, fetching the whole user doc just for this check isn't scalable, 
        // but for now it works. Better to have a subcollection 'likes'.
        // We'll check the 'ggs_users' array on the target profile.
        try {
            const docRef = doc(db, "users", targetUserId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                if (data.gg_users && data.gg_users.includes(user.uid)) {
                    setHasGGed(true);
                }
            }
        } catch (e) {
            console.error("Error checking GG status", e);
        }
      }
    });
    return () => unsubscribe();
  }, [targetUserId]);

  const handleGG = async () => {
    if (!currentUser) {
      alert("Login to send a GG!");
      return;
    }
    
    // Prevent spam clicking while processing
    // if (animating) return; 

    setAnimating(true);
    setTimeout(() => setAnimating(false), 500); // Animation duration

    // Optimistic UI Update
    const newHasGGed = !hasGGed;
    setHasGGed(newHasGGed);
    setCount(prev => newHasGGed ? prev + 1 : prev - 1);

    try {
      const userRef = doc(db, "users", targetUserId);
      if (newHasGGed) {
         await updateDoc(userRef, {
             ggs: increment(1),
             gg_users: arrayUnion(currentUser.uid)
         });
      } else {
         await updateDoc(userRef, {
             ggs: increment(-1),
             gg_users: arrayRemove(currentUser.uid)
         });
      }
    } catch (error) {
      console.error("Failed to GG:", error);
      // Revert on error
      setHasGGed(!newHasGGed);
      setCount(prev => !newHasGGed ? prev + 1 : prev - 1);
    }
  };

  return (
    <button 
      onClick={handleGG}
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 ${hasGGed ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
    >
      <div className={`relative ${animating ? "animate-ping" : ""}`}>
        <Heart className={`w-5 h-5 transition-transform duration-300 ${hasGGed ? "fill-current scale-110" : "group-hover:scale-110"}`} />
      </div>
      <span>{count}</span>
      <span className="text-[10px] uppercase opacity-70">GGs</span>
      
      {/* Particle Burst Effect (Simple CSS) */}
      {animating && hasGGed && (
         <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-10 h-10 rounded-full border-2 border-red-500 animate-ping opacity-75"></span>
         </span>
      )}
    </button>
  );
}