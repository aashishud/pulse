import React from 'react';

export default function PulseLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Glow (matches the current text/fill color) */}
      <path 
        d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" 
        fill="currentColor" 
        fillOpacity="0.3" 
        filter="blur(6px)" 
      />
      
      {/* Main Solid Shape */}
      <path 
        d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" 
        fill="currentColor" 
      />
      
      {/* Inner Cutout (The hole in the 'P') */}
      <path 
        d="M16 9H20L22 11V13L20 15H15L16 9Z" 
        fill="#0a0a0c" // Matches your dark background
      />
    </svg>
  );
}