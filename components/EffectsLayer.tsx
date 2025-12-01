import React, { useEffect, useRef } from 'react';
import { GamePhase, LineWin } from '../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
  type: 'spark' | 'ember' | 'glitch_rect';
}

interface Props {
  active: boolean;
  phase: GamePhase;
  wins: LineWin[];
}

const EffectsLayer: React.FC<Props> = ({ active, phase, wins }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  // Helper to get coordinates
  const getCellCenter = (r: number, c: number, width: number, height: number) => {
    // These offsets align with the ReelsPanel padding/gaps
    const colW = width / 3;
    const rowH = height / 3;
    return {
      x: c * colW + colW / 2,
      y: r * rowH + rowH / 2
    };
  };

  useEffect(() => {
    if (!active || wins.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Canvas sizing
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const w = canvas.width;
    const h = canvas.height;

    wins.forEach(win => {
      win.coordinates.forEach(([r, c]) => {
        const { x, y } = getCellCenter(r, c, w, h);
        
        // EXPLOSION count
        const count = 30;

        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          // Higher speed for explosion
          const speed = Math.random() * 8 + 2; 
          
          let color = '255, 255, 255';
          let type: Particle['type'] = 'spark';
          let decay = 0.02;

          if (phase === 'Calm') {
            color = '6, 182, 212'; // Cyan
            decay = 0.01; // Slower fade
          }
          if (phase === 'Surge') {
            color = '245, 158, 11'; // Amber
            type = 'ember';
          }
          if (phase === 'Quantum') {
            color = '232, 121, 249'; // Fuchsia
            type = Math.random() > 0.5 ? 'glitch_rect' : 'spark';
            decay = 0.04; // Fast glitch
          }

          particlesRef.current.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay,
            color,
            size: Math.random() * 4 + 2,
            type
          });
        }
      });
    });

  }, [active, wins, phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        // Friction
        p.vx *= 0.95;
        p.vy *= 0.95;

        // Gravity
        if (phase !== 'Quantum') p.vy += 0.15;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        if (p.type === 'glitch_rect') {
           ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
           ctx.fillRect(p.x, p.y, p.size * 4, p.size);
        } else if (p.type === 'ember') {
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
           ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
           ctx.fill();
           // Ember trail
           p.y -= 0.5; // Rise
        } else {
           // Spark
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
           ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
           ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [phase]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-50 pointer-events-none w-full h-full mix-blend-screen"
    />
  );
};

export default React.memo(EffectsLayer);