// components/WinConfetti.tsx
import React from 'react';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

interface Props {
  active: boolean;
  isBigWin: boolean;
}

const WinConfetti: React.FC<Props> = ({ active, isBigWin }) => {
  const { width, height } = useWindowSize();

  if (!active) return null;

  // Big, heavy, long‑lasting for big wins
  const pieceCount = isBigWin ? 1200 : 400;
  const gravity = isBigWin ? 0.7 : 0.4;          // higher = falls faster
  const tweenDuration = isBigWin ? 9000 : 6000;  // how long pieces live (ms)

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1100 }}>
      <Confetti
        width={width}
        height={height}
        numberOfPieces={pieceCount}
        recycle={false}
        run={true}
        gravity={gravity}
        tweenDuration={tweenDuration}
        wind={0.02}
        colors={['#facc15', '#f97316', '#22c55e', '#0ea5e9', '#a855f7']}
        // Source across the full top so it rains everywhere
        confettiSource={{ x: 0, y: 0, w: width, h: 0 }}
        drawShape={ctx => {
          // Bigger pieces on big win
          const size = isBigWin ? 14 : 8;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(size, 0);
          ctx.lineTo(size, size);
          ctx.lineTo(0, size);
          ctx.closePath();
          ctx.fill();
        }}
      />
    </div>
  );
};

export default WinConfetti;
