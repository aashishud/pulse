"use client";

import React, { useRef, useState } from 'react';

export default function TiltCard({ children, className, containerClassName, style }: { children: React.ReactNode, className?: string, containerClassName?: string, style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [glareOpacity, setGlareOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate rotation (-10 to 10 degrees)
    const rY = ((mouseX / width) - 0.5) * 20;
    const rX = ((mouseY / height) - 0.5) * -20;

    setRotateX(rX);
    setRotateY(rY);

    // Calculate glare position
    setGlareX((mouseX / width) * 100);
    setGlareY((mouseY / height) * 100);
    setGlareOpacity(0.15); // Adjust for intensity
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlareOpacity(0);
  };

  return (
    <div 
      style={{ perspective: "1500px" }}
      className={containerClassName}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full h-full relative ${className || ''}`}
        style={{
          ...style,
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          transition: glareOpacity === 0 ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)" : "transform 0.1s linear"
        }}
      >
        {children}
        
        {/* Glare Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
          style={{
            opacity: glareOpacity,
            transition: "opacity 0.4s ease",
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            mixBlendMode: "overlay",
            zIndex: 100
          }}
        />
      </div>
    </div>
  );
}
