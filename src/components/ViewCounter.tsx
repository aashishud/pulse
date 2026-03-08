"use client";

import { useEffect } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ViewCounter({ username }: { username: string }) {
  useEffect(() => {
    // Only increment once per browser session
    if (!sessionStorage.getItem(`viewed_${username}`)) {
      sessionStorage.setItem(`viewed_${username}`, 'true');
      
      const incrementView = async () => {
        try {
          const userRef = doc(db, "users", username);
          // Atomically increments the view count in Firestore by 1
          await updateDoc(userRef, { views: increment(1) });
        } catch (error) {
          console.error("View count update ignored by rules or failed.", error);
        }
      };

      incrementView();
    }
  }, [username]);

  return null; // This component is invisible
}