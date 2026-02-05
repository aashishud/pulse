"use client";

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 bg-[#1e1f22] border border-white/10 rounded-xl font-bold text-[10px] hover:bg-white hover:text-black transition flex items-center gap-2 group"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Share2 className="w-3 h-3 text-zinc-400 group-hover:text-black transition" />
      )}
      {copied ? "Copied" : "Share"}
    </button>
  );
}