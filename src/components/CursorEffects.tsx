"use client";

import { useEffect, useRef } from 'react';
import Oneko from './Oneko';

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
  angle?: number; // For rainbow hue / firefly orbit
  originX?: number; // For firefly orbit center
  originY?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
}

// SVG cursor path (standard pointer arrow)
const CURSOR_PATH = "M0,0 L0,17 L4,13 L7.5,20 L10,19 L6.5,12 L12,12 Z";

export default function CursorEffects({ type }: { type: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const cursor = useRef({ x: 0, y: 0 });
  // For trailing effect: store a chain of positions
  const trailChain = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    if (type === 'none' || !type || type === 'oneko') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Initialize trail chain for 'trailing' effect
    if (type === 'trailing') {
      trailChain.current = new Array(16).fill(null).map(() => ({ x: 0, y: 0 }));
    }

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
      } else if (type === 'ghost-cursors') {
        // Spawn ghost cursor images at current position
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          size: 18,
          color: 'rgba(255, 255, 255, 0.7)',
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1.0,
        });
        // Cap particles to prevent performance issues
        if (particles.current.length > 40) {
          particles.current.splice(0, particles.current.length - 40);
        }
      } else if (type === 'rainbow') {
        // Rainbow trail particles
        for (let i = 0; i < 3; i++) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            size: Math.random() * 5 + 3,
            color: `hsl(${Date.now() * 0.3 % 360 + i * 40}, 100%, 65%)`,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 1 + 0.5,
            life: 1.0,
          });
        }
        if (particles.current.length > 120) {
          particles.current.splice(0, particles.current.length - 120);
        }
      } else if (type === 'fireflies') {
        // Spawn glow orbs that orbit
        if (Math.random() > 0.7) {
          const angle = Math.random() * Math.PI * 2;
          particles.current.push({
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 4 + 2,
            color: `hsl(${50 + Math.random() * 30}, 100%, ${70 + Math.random() * 20}%)`,
            vx: 0,
            vy: 0,
            life: 1.0,
            angle: angle,
            originX: e.clientX,
            originY: e.clientY,
            orbitRadius: Math.random() * 30 + 15,
            orbitSpeed: (Math.random() - 0.5) * 0.06,
          });
        }
        if (particles.current.length > 30) {
          particles.current.splice(0, particles.current.length - 30);
        }
      } else if (type === 'snowfall') {
        // Drop snowflakes from cursor
        if (Math.random() > 0.4) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 20,
            y: e.clientY,
            size: Math.random() * 4 + 2,
            color: '#ffffff',
            vx: (Math.random() - 0.5) * 1,
            vy: Math.random() * 1.5 + 0.5,
            life: 1.0,
            rotation: Math.random() * Math.PI * 2,
          });
        }
        if (particles.current.length > 80) {
          particles.current.splice(0, particles.current.length - 80);
        }
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    // Helper to draw a cursor arrow
    const drawCursorArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      // Arrow outline for visibility
      ctx.beginPath();
      const p = new Path2D(CURSOR_PATH);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill(p);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke(p);
      
      ctx.restore();
    };

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

      // --- TRAILING EFFECT (elastic chain of cursors) ---
      if (type === 'trailing') {
        const chain = trailChain.current;
        // First element follows the mouse with lerp
        chain[0].x += (cursor.current.x - chain[0].x) * 0.5;
        chain[0].y += (cursor.current.y - chain[0].y) * 0.5;
        
        // Each subsequent link follows the previous with spring/lerp
        for (let i = 1; i < chain.length; i++) {
          chain[i].x += (chain[i - 1].x - chain[i].x) * 0.25;
          chain[i].y += (chain[i - 1].y - chain[i].y) * 0.25;
        }

        // Draw from back to front so the leading cursor is on top
        for (let i = chain.length - 1; i >= 0; i--) {
          const t = i / chain.length;
          const alpha = (1 - t) * 0.6;
          const scale = 0.7 + (1 - t) * 0.5;
          drawCursorArrow(ctx, chain[i].x, chain[i].y, scale, alpha);
        }
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
        } else if (type === 'ghost-cursors') {
            // Gentle drift + fade
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.018;
        } else if (type === 'fireflies') {
            // Orbital float
            p.angle = (p.angle || 0) + (p.orbitSpeed || 0.02);
            p.x = (p.originX || p.x) + Math.cos(p.angle) * (p.orbitRadius || 20);
            p.y = (p.originY || p.y) + Math.sin(p.angle) * (p.orbitRadius || 20);
            p.originY = (p.originY || p.y) + 0.1; // Gentle float down
            p.life -= 0.006;
        } else if (type === 'snowfall') {
            // Snow physics: gentle sway + fall
            p.rotation = (p.rotation || 0) + 0.02;
            p.x += p.vx + Math.sin(p.rotation * 3) * 0.3;
            p.y += p.vy;
            p.life -= 0.008;
        } else if (type === 'rainbow') {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04; // Slight gravity
            p.life -= 0.02;
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
        } else if (type === 'ghost-cursors') {
            // Draw fading cursor arrows
            drawCursorArrow(ctx, p.x, p.y, p.size / 14, p.life * 0.7);
        } else if (type === 'fireflies') {
            // Glowing orb
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(0.4, p.color.replace(')', ', 0.4)').replace('hsl(', 'hsla('));
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();
            // Bright core
            ctx.fillStyle = '#fffbe6';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'snowfall') {
            // Six-pointed snowflake
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation || 0);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
            ctx.strokeStyle = `rgba(200, 220, 255, ${p.life * 0.8})`;
            ctx.lineWidth = 1;
            for (let arm = 0; arm < 6; arm++) {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(0, -p.size);
              ctx.stroke();
              // Add a tiny branch
              ctx.beginPath();
              ctx.moveTo(0, -p.size * 0.5);
              ctx.lineTo(p.size * 0.3, -p.size * 0.7);
              ctx.stroke();
              ctx.rotate(Math.PI / 3);
            }
            // Tiny center dot
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (type === 'rainbow') {
            // Colorful rounded particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
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
  if (type === 'oneko') return <Oneko />;

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}