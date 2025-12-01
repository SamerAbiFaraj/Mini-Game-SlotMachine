
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  amount: number;
  onComplete: () => void;
  isBigWin: boolean;
}

const BigWinOverlay: React.FC<Props> = ({ amount, onComplete, isBigWin }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = isBigWin ? 2000 : 1000;
    const startTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setDisplayAmount(amount * ease);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(onComplete, isBigWin ? 1500 : 500); 
      }
    };
    
    tick();
  }, [amount, onComplete, isBigWin]);

  // Different styles for Big Win vs Regular Win
  const title = isBigWin ? "BIG WIN!" : "WINNER!";
  const titleLetters = title.split('');
  const gradient = isBigWin 
    ? "from-yellow-300 via-orange-500 to-red-600"
    : "from-green-300 via-emerald-500 to-teal-600";
  const glow = isBigWin ? "rgba(251,191,36,0.8)" : "rgba(52,211,153,0.8)";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.2,
      transition: { duration: 0.3 },
    },
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      rotateX: -90,
      scale: 0.5,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const amountVariants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <motion.div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {isBigWin && (
        <div className="absolute inset-0 overflow-hidden">
           {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i * 360 / 30) * Math.PI / 180) * 300,
                  y: Math.sin((i * 360 / 30) * Math.PI / 180) * 300,
                  scale: [0, 1, 0.5, 0],
                  opacity: [1, 1, 0.5, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
           ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
         <motion.h1 
           className={`font-black italic text-transparent bg-clip-text bg-gradient-to-b ${gradient} drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] filter flex`}
           style={{ 
             fontSize: isBigWin ? '5rem' : '3rem',
             textShadow: `0 0 30px ${glow}`,
             perspective: '1000px',
           }}
           variants={{
             hidden: { opacity: 0 },
             visible: {
               opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
         >
           {titleLetters.map((letter, i) => (
             <motion.span
               key={i}
               variants={letterVariants}
               style={{
                 display: 'inline-block',
                 transformStyle: 'preserve-3d',
               }}
               whileHover={{
                 scale: 1.2,
                 y: -10,
                 transition: { type: "spring", stiffness: 400 },
               }}
             >
               {letter === ' ' ? '\u00A0' : letter}
             </motion.span>
           ))}
         </motion.h1>
         
         <motion.div
           variants={amountVariants}
           className="mt-4 font-mono font-bold text-white drop-shadow-md relative"
           style={{ fontSize: isBigWin ? '4rem' : '2.5rem' }}
           animate={{
             scale: isBigWin ? [1, 1.1, 1] : 1,
           }}
           transition={{
             duration: 0.5,
             repeat: isBigWin ? Infinity : 0,
             repeatType: "reverse",
             repeatDelay: 0.5,
           }}
         >
           <motion.span
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
           >
             $
           </motion.span>
           <motion.span
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
           >
             {displayAmount.toFixed(2)}
           </motion.span>
         </motion.div>

         {/* Pulsing rings for big wins */}
         {isBigWin && (
           <>
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 className="absolute top-1/2 left-1/2 border-4 border-yellow-400 rounded-full"
                 style={{
                   width: 200 + i * 150,
                   height: 200 + i * 150,
                   x: '-50%',
                   y: '-50%',
                 }}
                 initial={{ scale: 0, opacity: 0.8 }}
                 animate={{
                   scale: [0, 2, 2.5],
                   opacity: [0.8, 0.4, 0],
                 }}
                 transition={{
                   duration: 2,
                   delay: i * 0.3,
                   repeat: Infinity,
                   ease: "easeOut",
                 }}
               />
             ))}
           </>
         )}
      </div>
    </motion.div>
  );
};

export default BigWinOverlay;
