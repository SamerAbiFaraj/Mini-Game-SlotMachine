import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  amount: number;
  onComplete: () => void;
  isBigWin: boolean;
}

const BigWinOverlay: React.FC<Props> = ({ amount, onComplete, isBigWin }) => {
  const [displayAmount, setDisplayAmount] = useState(0);
  const completedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const countDuration = isBigWin ? 2000 : 1000;
    const extraVisible = isBigWin ? 2000 : 1000;
    const startTime = Date.now();

    completedRef.current = false;

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / countDuration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      setDisplayAmount(amount * ease);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        timeoutRef.current = window.setTimeout(() => {
          onComplete();
        }, extraVisible);
      }
    };

    tick();

    return () => {
      completedRef.current = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [amount, onComplete, isBigWin]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, when: 'beforeChildren' as const, staggerChildren: 0.05 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  const amountVariants = {
    hidden: { scale: 0.6, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 },
    },
  };

  const titleText = isBigWin ? 'BIG WIN!' : 'WINNER!';
  const titleSize = isBigWin ? '5rem' : '3.5rem';
  const gradientColors = isBigWin
    ? { start: '#fde047', middle: '#f59e0b', end: '#dc2626' }
    : { start: '#86efac', middle: '#10b981', end: '#059669' };
  const glowColor = isBigWin ? 'rgba(251,191,36,0.9)' : 'rgba(52,211,153,0.9)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        style={{
          textAlign: 'center',
          padding: '3rem',
          borderRadius: '12px',
          maxWidth: '90%',
          width: '600px',
          color: 'white',
        }}
      >
        {/* Title */}
        <motion.div style={{ marginBottom: '2rem', whiteSpace: 'nowrap' }}>
          {titleText.split('').map((letter, i) => (
            <motion.span
              key={i}
              variants={letterVariants}
              style={{
                display: 'inline-block',
                fontSize: titleSize,
                fontWeight: 900,
                fontStyle: 'italic',
                color: isBigWin ? gradientColors.middle : gradientColors.start,
                textShadow: `
                  0 0 10px ${glowColor},
                  0 0 30px ${glowColor},
                  0 0 60px ${glowColor}
                `,
                margin: '0 2px',
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.div>

        {/* Win Amount */}
        <motion.div
          variants={amountVariants}
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '1rem 0',
            textShadow: `
              0 0 10px ${glowColor},
              0 0 30px ${glowColor},
              0 0 60px rgba(255,255,255,0.9)
            `,
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: `2px solid ${gradientColors.middle}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          ${displayAmount.toFixed(2)}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BigWinOverlay;
