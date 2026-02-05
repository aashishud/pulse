"use client";

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  rotation?: number; // For coin spin
  scaleX?: number; // For coin spin width
}

export default function CursorEffects({ type }: { type: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const cursor = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (type === 'none' || !type) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const onMouseMove = (e: MouseEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
      
      // Spawn particles on move
      if (type === 'sparkle') {
        for (let i = 0; i < 2; i++) {
          particles.current.push({
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 4 + 1,
            color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`, // Gold/Yellow
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0
          });
        }
      } else if (type === 'ghost') {
         particles.current.push({
            x: e.clientX,
            y: e.clientY,
            size: 10,
            color: 'rgba(255, 255, 255, 0.5)',
            vx: 0,
            vy: 0,
            life: 1.0
         });
      } else if (type === 'coins') {
        // Terraria-style spinning coins
        // Fewer particles, longer life, physics-based fall
        if (Math.random() > 0.5) { // Throttle spawn rate
            particles.current.push({
                x: e.clientX,
                y: e.clientY,
                size: 8, // Coin radius
                color: '#FFD700', // Gold
                vx: (Math.random() - 0.5) * 4, // Horizontal spread
                vy: (Math.random() - 1) * 4, // Initial upward pop
                life: 1.0,
                rotation: 0,
                scaleX: 1
            });
        }
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simple Pulse Follower
      if (type === 'pulse') {
         ctx.beginPath();
         ctx.arc(cursor.current.x, cursor.current.y, 20, 0, Math.PI * 2);
         ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
         ctx.lineWidth = 2;
         ctx.stroke();
         
         ctx.beginPath();
         ctx.arc(cursor.current.x, cursor.current.y, 4, 0, Math.PI * 2);
         ctx.fillStyle = 'white';
         ctx.fill();
      }

      // Particle System
      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];
        
        if (type === 'coins') {
            // Physics for coins
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.rotation = (p.rotation || 0) + 0.2; // Spin speed
            p.scaleX = Math.abs(Math.sin(p.rotation)); // Simulate 3D spin width
            p.life -= 0.015; // Fade out slowly
        } else {
            // Standard physics
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
        }

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          i--;
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        
        if (type === 'coins') {
            // Draw Spinning Coin (Ellipse)
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.size * (p.scaleX || 1), p.size, 0, 0, Math.PI * 2);
            ctx.fill();
            // Optional: Inner detail for coin
            ctx.strokeStyle = '#DAA520'; // Darker gold outline
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Standard Particles
            ctx.beginPath();
            if (type === 'ghost') {
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            } else {
                ctx.rect(p.x, p.y, p.size, p.size);
            }
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  if (type === 'none' || !type) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}