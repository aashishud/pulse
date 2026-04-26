"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function OwnerOnly({ ownerUid, children }: { ownerUid: string, children: React.ReactNode }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === ownerUid) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    });
    return () => unsubscribe();
  }, [ownerUid]);

  if (!isOwner) return null;

  return <>{children}</>;
}
