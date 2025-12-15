import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RotateCw, Target, Check, Diamond } from 'lucide-react';
import { cn } from '../lib/utils';
import { WHEEL_ORDER, getNumberColor } from '../constants-orginal';
import { getAnimalImagePath, getAnimalName } from '../animalMapping';

// TYPES
type GamePhase = 'WAITING_FOR_BETS' | 'SPINNING' | 'RESULTS';
interface Props {
    phase: GamePhase;
    winningNumber: string | null;
    onBetPlaced?: (number: string, amount: number) => void;
}

// CONSTANTS
const POCKET_COUNT = 38;
const TOTAL_SPIN_DURATION = 8000;
const BALL_LANDING_POSITION = 135;

// Custom easing functions
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const RouletteWheel: React.FC<Props> = ({ phase, winningNumber, onBetPlaced }) => {
    // State
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);
    const [ballRadius, setBallRadius] = useState(60);
    const [ballOpacity, setBallOpacity] = useState(0);
    const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastWinningNumber, setLastWinningNumber] = useState<string | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [alignmentDebug, setAlignmentDebug] = useState<string>('');
    const [spinDirection, setSpinDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise');

    // Refs
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Get color for a number
    const getColor = (number: string): 'red' | 'black' | 'green' => {
        return getNumberColor(number);
    };

    // Idle animation
    useEffect(() => {
        if (phase === 'WAITING_FOR_BETS') {
            cancelAnimationFrame(requestRef.current);
            setIsSpinning(false);

            const idleSpin = () => {
                setWheelRotation(prev => {
                    const newRotation = prev + 0.015;
                    return newRotation >= 360 ? newRotation - 360 : newRotation;
                });
                requestRef.current = requestAnimationFrame(idleSpin);
            };

            requestRef.current = requestAnimationFrame(idleSpin);
            setBallOpacity(0);
        } else if (phase === 'SPINNING' && winningNumber) {
            setIsSpinning(true);
            setLastWinningNumber(winningNumber);
            const dir = Math.random() > 0.5 ? 'clockwise' : 'counterclockwise';
            setSpinDirection(dir);
            cancelAnimationFrame(requestRef.current);
            startSpinSequence(winningNumber, dir);
        }

        return () => cancelAnimationFrame(requestRef.current);
    }, [phase, winningNumber]);

    const startSpinSequence = (targetNumber: string, direction: 'clockwise' | 'counterclockwise') => {
        startTimeRef.current = performance.now();
        setBallOpacity(1);

        const targetIndex = WHEEL_ORDER.indexOf(targetNumber);
        if (targetIndex === -1) {
            console.error('Invalid target number:', targetNumber);
            return;
        }

        const anglePerPocket = 360 / POCKET_COUNT;
        const OFFSET = -10;
        const adjustedIndex = (targetIndex - OFFSET + POCKET_COUNT) % POCKET_COUNT;
        const targetWheelAngle = adjustedIndex * anglePerPocket;

        const startWheelAngle = wheelRotation % 360;
        const ballStartAngle = 0;
        const isClockwise = direction === 'clockwise';
        const dirMultiplier = isClockwise ? 1 : -1;
        const targetFinalAngle = (BALL_LANDING_POSITION - targetWheelAngle + 360) % 360;

        const extraRotations = 5;
        const totalWheelRotation = 360 * extraRotations;
        const finalWheelAngle = startWheelAngle + (totalWheelRotation * dirMultiplier) + (targetFinalAngle * dirMultiplier);

        const animate = (time: number) => {
            const elapsed = time - startTimeRef.current;
            const progress = Math.min(elapsed / TOTAL_SPIN_DURATION, 1);

            // Wheel rotation
            const wheelEase = easeOutCubic(progress);
            const currentWheelAngle = startWheelAngle + (finalWheelAngle - startWheelAngle) * wheelEase;
            setWheelRotation(currentWheelAngle);

            // Ball animation
            let ballAngle;
            let currentBallRadius;

            if (progress < 0.5) {
                const phaseProgress = progress / 0.5;
                const orbitSpeed = 10;
                ballAngle = ballStartAngle + (360 * orbitSpeed * phaseProgress * dirMultiplier);
                currentBallRadius = 60 - (30 * phaseProgress);
            } else if (progress < 0.85) {
                const phaseProgress = (progress - 0.5) / 0.35;
                const ballFollowEase = easeOutBack(phaseProgress);
                const targetBallAngle = currentWheelAngle + targetWheelAngle;
                const transitionStart = ballStartAngle + (360 * 10 * dirMultiplier);
                ballAngle = transitionStart + (targetBallAngle - transitionStart) * ballFollowEase;
                const wobble = Math.sin(phaseProgress * Math.PI * 6) * 8 * (1 - phaseProgress);
                ballAngle += wobble;
                currentBallRadius = 30 + (Math.sin(phaseProgress * Math.PI * 3) * 4);
            } else {
                const phaseProgress = (progress - 0.85) / 0.15;
                const settleEase = 1 - Math.pow(1 - phaseProgress, 3);
                const targetBallAngle = currentWheelAngle + targetWheelAngle;
                const finalWobble = Math.sin(phaseProgress * Math.PI * 8) * 3 * (1 - phaseProgress);
                ballAngle = targetBallAngle + finalWobble;
                currentBallRadius = 30;
            }

            setBallRotation(ballAngle);
            setBallRadius(currentBallRadius);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                setSelectedNumber(targetNumber);
                setAlignmentDebug(`✅ Perfect alignment on ${targetNumber}`);
            }
        };

        requestRef.current = requestAnimationFrame(animate);
    };

    const handleNumberClick = (number: string) => {
        if (phase === 'WAITING_FOR_BETS' && onBetPlaced) {
            setSelectedNumber(number);
            onBetPlaced(number, 10);
        }
    };

    // SVG calculations
    const wheelSize = 600;
    const center = wheelSize / 2;
    const outerRadius = center - 30;
    const innerRadius = 120;
    const pocketAngle = 360 / POCKET_COUNT;
    const imageRadius = outerRadius - 40;
    const numberRadius = imageRadius - 45;

    return (
        <div className="relative flex items-center justify-center p-6">
            {/* Main Wheel Container with 3D Perspective */}
            <div
                className="relative w-[400px] h-[400px] md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px]"
                style={{
                    perspective: '1200px',
                    perspectiveOrigin: 'center center'
                }}
            >
                {/* Outer Wooden Frame with Diamond Decorations */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `
              radial-gradient(circle at 30% 30%, #453c0540 0%, #53430fff 30%, #352806ff 60%, #3e300dff 100%)
            `,
                        boxShadow: `
              0 0 0 8px #1a0f00,
              0 0 0 12px #D4AF37,
              0 0 0 16px #1a0f00,
              0 25px 80px rgba(0, 0, 0, 0.8),
              inset 0 -10px 30px rgba(0, 0, 0, 0.6),
              inset 0 10px 30px rgba(255, 255, 255, 0.3)
            `,
                        transform: 'rotateX(15deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Diamond Decorations on Frame */}
                    {[0, 90, 180, 270].map((angle, idx) => (
                        <div
                            key={idx}
                            className="absolute"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${center - 15}px)`,
                            }}
                        >
                            <Diamond
                                className="w-6 h-6 text-[#FFE55C]"
                                fill="#FFD700"
                                style={{
                                    filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))'
                                }}
                            />
                        </div>
                    ))}

                    {/* Inner Bowl Shadow */}
                    <div
                        className="absolute inset-[40px] rounded-full"
                        style={{
                            background: `
                radial-gradient(circle at center, 
                  transparent 0%, 
                  transparent 40%, 
                  rgba(0, 0, 0, 0.4) 70%,
                  rgba(0, 0, 0, 0.8) 100%
                )
              `,
                            boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.9)'
                        }}
                    />
                </div>

                {/* Inner Bowl with Gradient Depth */}
                <div
                    className="absolute inset-[45px] rounded-full overflow-hidden"
                    style={{
                        background: `
              radial-gradient(circle at 35% 35%, 
                #1a1a1a 0%, 
                #0a0a0a 40%, 
                #000000 70%,
                #000000 100%
              )
            `,
                        boxShadow: `
              inset 0 15px 40px rgba(0, 0, 0, 0.9),
              inset 0 -5px 20px rgba(255, 215, 0, 0.1)
            `,
                        transform: 'rotateX(15deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Rotating Wheel Numbers and Pockets */}
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            transition: isSpinning ? 'none' : 'transform 0.05s linear',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <svg
                            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                            width="100%"
                            height="100%"
                            className="absolute inset-0"
                            style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))' }}
                        >
                            <defs>
                                {/* Enhanced Gradients for Realistic Pockets */}
                                <radialGradient id="redGradient" cx="50%" cy="30%">
                                    <stop offset="0%" stopColor="#ff4444" />
                                    <stop offset="50%" stopColor="#cc0000" />
                                    <stop offset="100%" stopColor="#800000" />
                                </radialGradient>

                                <radialGradient id="blackGradient" cx="50%" cy="30%">
                                    <stop offset="0%" stopColor="#444444" />
                                    <stop offset="50%" stopColor="#1a1a1a" />
                                    <stop offset="100%" stopColor="#000000" />
                                </radialGradient>

                                <radialGradient id="greenGradient" cx="50%" cy="30%">
                                    <stop offset="0%" stopColor="#00ff66" />
                                    <stop offset="50%" stopColor="#00aa44" />
                                    <stop offset="100%" stopColor="#006622" />
                                </radialGradient>

                                <linearGradient id="goldDivider" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFE55C" />
                                    <stop offset="50%" stopColor="#FFD700" />
                                    <stop offset="100%" stopColor="#B8860B" />
                                </linearGradient>

                                {/* Beveled Edge Effect */}
                                <filter id="bevelEffect">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                                    <feOffset dx="1" dy="1" result="offsetblur" />
                                    <feComponentTransfer>
                                        <feFuncA type="linear" slope="0.5" />
                                    </feComponentTransfer>
                                    <feMerge>
                                        <feMergeNode />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Render All Pockets */}
                            {WHEEL_ORDER.map((number, index) => {
                                const color = getColor(number);
                                const baseAngle = index * pocketAngle;
                                const centerAngle = baseAngle + pocketAngle / 2;

                                const startAngle = baseAngle * Math.PI / 180;
                                const endAngle = (baseAngle + pocketAngle) * Math.PI / 180;
                                const centerAngleRad = centerAngle * Math.PI / 180;

                                // Pocket vertices for trapezoid shape
                                const innerStartX = center + Math.cos(startAngle) * innerRadius;
                                const innerStartY = center + Math.sin(startAngle) * innerRadius;
                                const innerEndX = center + Math.cos(endAngle) * innerRadius;
                                const innerEndY = center + Math.sin(endAngle) * innerRadius;
                                const outerStartX = center + Math.cos(startAngle) * outerRadius;
                                const outerStartY = center + Math.sin(startAngle) * outerRadius;
                                const outerEndX = center + Math.cos(endAngle) * outerRadius;
                                const outerEndY = center + Math.sin(endAngle) * outerRadius;

                                const imageX = center + Math.cos(centerAngleRad) * imageRadius;
                                const imageY = center + Math.sin(centerAngleRad) * imageRadius;
                                const numberX = center + Math.cos(centerAngleRad) * numberRadius;
                                const numberY = center + Math.sin(centerAngleRad) * numberRadius;

                                const gradientId = color === 'red' ? 'redGradient' :
                                    color === 'green' ? 'greenGradient' : 'blackGradient';

                                const imagePath = getAnimalImagePath(number);

                                return (
                                    <g key={`${number}-${index}`}>
                                        {/* Pocket Background with Beveled Edges */}
                                        <path
                                            d={`M ${innerStartX} ${innerStartY}
                          L ${outerStartX} ${outerStartY}
                          L ${outerEndX} ${outerEndY}
                          L ${innerEndX} ${innerEndY}
                          Z`}
                                            fill={`url(#${gradientId})`}
                                            stroke="url(#goldDivider)"
                                            strokeWidth="3"
                                            strokeLinejoin="bevel"
                                            filter="url(#bevelEffect)"
                                            className={cn(
                                                "cursor-pointer transition-all duration-200",
                                                lastWinningNumber === number && !isSpinning &&
                                                "drop-shadow-[0_0_20px_rgba(255,215,0,0.9)]"
                                            )}
                                            onMouseEnter={() => setHoveredNumber(number)}
                                            onMouseLeave={() => setHoveredNumber(null)}
                                            onClick={() => handleNumberClick(number)}
                                        />

                                        {/* Gold Separator Lines */}
                                        <line
                                            x1={innerStartX}
                                            y1={innerStartY}
                                            x2={outerStartX}
                                            y2={outerStartY}
                                            stroke="url(#goldDivider)"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />

                                        {/* Animal Image with White Circle Background */}
                                        <g>
                                            {/* Outer glow ring */}
                                            <circle
                                                cx={imageX}
                                                cy={imageY}
                                                r="14"
                                                fill="none"
                                                stroke="#FFD700"
                                                strokeWidth="1.5"
                                                opacity="0.6"
                                                style={{
                                                    filter: 'drop-shadow(0 0 6px rgba(255, 77, 0, 0.36))'
                                                }}
                                            />

                                            {/* White background circle */}
                                            <circle
                                                cx={imageX}
                                                cy={imageY}
                                                r="12"
                                                fill="white"
                                                stroke="#FFD700"
                                                strokeWidth="2.5"
                                                style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                                }}
                                            />

                                            {/* Animal Image */}
                                            {imagePath && (
                                                <image
                                                    href={imagePath}
                                                    x={imageX - 15}
                                                    y={imageY - 15}
                                                    width="30"
                                                    height="30"
                                                    preserveAspectRatio="xMidYMid meet"
                                                    className="brightness-110 contrast-110"
                                                />
                                            )}

                                            {/* Inner decorative ring */}
                                            <circle
                                                cx={imageX}
                                                cy={imageY}
                                                r="24"
                                                fill="none"
                                                stroke="#ffb7001b"
                                                strokeWidth="1"
                                                strokeDasharray="3,3"
                                                opacity="0.5"
                                            />
                                        </g>

                                        {/* Number Circle */}
                                        <g>
                                            <circle
                                                cx={numberX}
                                                cy={numberY}
                                                r="12"
                                                fill="white"
                                                stroke={color === 'green' ? '#00aa44' : color === 'red' ? '#cc0000' : '#000'}
                                                strokeWidth="2.5"
                                                style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'
                                                }}
                                            />

                                            <text
                                                x={numberX}
                                                y={numberY + 6}
                                                textAnchor="middle"
                                                fontSize="14"
                                                fontWeight="900"
                                                fill={color === 'green' ? '#006622' : color === 'red' ? '#990000' : '#000'}
                                                className="select-none"
                                                style={{ fontFamily: 'Arial, sans-serif' }}
                                            >
                                                {number}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}

                            {/* Center Turret Base */}
                            <circle
                                cx={center}
                                cy={center}
                                r={innerRadius}
                                fill="url(#goldDivider)"
                                stroke="#2a1c01"
                                strokeWidth="8"
                                style={{
                                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6))'
                                }}
                            />

                            {/* Center Cross Pattern */}
                            <g>
                                <line
                                    x1={center - 40}
                                    y1={center}
                                    x2={center + 40}
                                    y2={center}
                                    stroke="#2a1c01"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />
                                <line
                                    x1={center}
                                    y1={center - 40}
                                    x2={center}
                                    y2={center + 40}
                                    stroke="#2a1c01"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />

                                {/* Central knob */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={20}
                                    fill="#2a1c01"
                                    style={{
                                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))'
                                    }}
                                />

                                {/* Highlight on knob */}
                                <circle
                                    cx={center - 5}
                                    cy={center - 5}
                                    r={8}
                                    fill="rgba(255, 215, 0, 0.3)"
                                />
                            </g>
                        </svg>
                    </div>

                    {/* Center Turret (Non-rotating) */}
                    <div
                        className="absolute inset-[40%] rounded-full flex items-center justify-center"
                        style={{
                            background: `
                radial-gradient(circle at 30% 30%, 
                  #ffa35cd0 0%, 
                  #ffb7001b 30%, 
                  #d4af3757 60%, 
                  #b8860b1b 100%
                )
              `,
                            boxShadow: `
                0 0 0 6px #2a1c01,
                0 10px 30px rgba(0, 0, 0, 0.7),
                inset 0 -8px 16px rgba(0, 0, 0, 0.4),
                inset 0 8px 16px rgba(255, 255, 255, 0.3)
              `,
                            transform: 'translateZ(20px)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        {/* Turret Finial */}
                        <div
                            className="w-8 h-8 rounded-full"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, #ffa35cd0, #ffb7001b)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)'
                            }}
                        />
                    </div>
                </div>

                {/* Roulette Ball */}
                <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        transform: `rotate(${ballRotation}deg)`,
                        opacity: ballOpacity,
                        transition: 'opacity 0.3s'
                    }}
                >
                    <div
                        className="absolute left-1/2"
                        style={{
                            top: `${50 - ballRadius}%`,
                            transform: `translate(-50%, -50%)`,
                        }}
                    >
                        <motion.div
                            className="relative"
                            animate={{
                                rotate: isSpinning ? 360 : 0,
                                scale: isSpinning ? [1, 1.15, 1] : 1
                            }}
                            transition={{
                                duration: 0.3,
                                repeat: isSpinning ? Infinity : 0,
                                ease: "linear"
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-full"
                                style={{
                                    background: `
                    radial-gradient(circle at 30% 30%, 
                      #ffffff 0%, 
                      #f0f0f0 40%, 
                      #d0d0d0 70%,
                      #a0a0a0 100%
                    )
                  `,
                                    boxShadow: `
                    0 0 20px rgba(255, 255, 255, 0.9),
                    inset 0 -3px 6px rgba(0, 0, 0, 0.3),
                    inset 3px 3px 8px rgba(255, 255, 255, 0.8)
                  `,
                                    border: '2px solid rgba(255, 255, 255, 0.6)'
                                }}
                            >
                                {/* Highlight spot */}
                                <div
                                    className="absolute top-2 left-2 w-3 h-3 rounded-full"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        filter: 'blur(1px)'
                                    }}
                                />
                            </div>

                            {/* Ball glow */}
                            <div
                                className="absolute -inset-6 rounded-full -z-10"
                                style={{
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                                    filter: 'blur(8px)'
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Reflection Overlay */}
                <div
                    className="absolute inset-[45px] rounded-full pointer-events-none z-30"
                    style={{
                        background: `
              radial-gradient(circle at 25% 25%, 
                rgba(255, 255, 255, 0.15) 0%, 
                transparent 50%
              )
            `,
                        mixBlendMode: 'overlay'
                    }}
                />
            </div>

            {/* Winning Number Display */}
            <AnimatePresence>
                {lastWinningNumber && !isSpinning && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute -right-64 top-1/2 transform -translate-y-1/2"
                    >
                        <div
                            className="relative rounded-3xl p-8 min-w-[280px] text-center"
                            style={{
                                background: `
                  linear-gradient(135deg, 
                    rgba(0, 0, 0, 0.95) 0%, 
                    rgba(26, 26, 26, 0.95) 100%
                  )
                `,
                                backdropFilter: 'blur(20px)',
                                border: '3px solid',
                                borderImage: 'linear-gradient(135deg, #FFD700, #D4AF37) 1',
                                boxShadow: `
                  0 25px 80px rgba(0, 0, 0, 0.7),
                  inset 0 0 40px rgba(255, 215, 0, 0.1)
                `
                            }}
                        >
                            <div className="text-[#FFD700] text-xl font-bold tracking-[0.3em] mb-6 uppercase">
                                Winner
                            </div>

                            {/* Animal Image */}
                            {getAnimalImagePath(lastWinningNumber) && (
                                <div className="w-24 h-24 mx-auto mb-4 relative">
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)',
                                            animation: 'pulse 2s ease-in-out infinite'
                                        }}
                                    />
                                    <img
                                        src={getAnimalImagePath(lastWinningNumber)}
                                        alt={`Animal ${lastWinningNumber}`}
                                        className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(255,215,0,0.3)]"
                                    />
                                </div>
                            )}

                            {/* Winning Number */}
                            <div
                                className={cn(
                                    "text-9xl font-black mb-6 py-6 px-10 rounded-2xl relative",
                                    "transition-all duration-300"
                                )}
                                style={{
                                    background: getColor(lastWinningNumber) === 'green'
                                        ? 'linear-gradient(135deg, rgba(0, 170, 68, 0.3), rgba(0, 102, 34, 0.5))'
                                        : getColor(lastWinningNumber) === 'red'
                                            ? 'linear-gradient(135deg, rgba(204, 0, 0, 0.3), rgba(128, 0, 0, 0.5))'
                                            : 'linear-gradient(135deg, rgba(68, 68, 68, 0.3), rgba(0, 0, 0, 0.5))',
                                    color: getColor(lastWinningNumber) === 'green' ? '#00ff66'
                                        : getColor(lastWinningNumber) === 'red' ? '#ff4444' : '#ffffff',
                                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                                    border: '3px solid',
                                    borderColor: getColor(lastWinningNumber) === 'green' ? '#00aa44'
                                        : getColor(lastWinningNumber) === 'red' ? '#cc0000' : '#666'
                                }}
                            >
                                {lastWinningNumber}
                            </div>

                            {/* Animal Name */}
                            {getAnimalName(lastWinningNumber) && (
                                <div className="mb-6">
                                    <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">
                                        Animal
                                    </div>
                                    <div className="text-[#FFD700] text-2xl font-bold">
                                        {getAnimalName(lastWinningNumber)}
                                    </div>
                                </div>
                            )}

                            {/* Verification Badge */}
                            <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-gray-800">
                                <Check className="w-6 h-6 text-emerald-400" />
                                <span className="text-sm text-gray-300 uppercase tracking-wider">
                                    Verified Result
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Panel */}
            <div className="absolute -left-56 top-1/2 transform -translate-y-1/2 text-center">
                <div className="text-[#FFD700] text-lg font-bold mb-4 uppercase tracking-wider">
                    Game Status
                </div>

                <div
                    className={cn(
                        "px-8 py-4 rounded-full text-lg font-bold mb-8 uppercase tracking-wider",
                        phase === 'WAITING_FOR_BETS'
                            ? "bg-gradient-to-r from-emerald-700 to-emerald-900 text-white animate-pulse"
                            : "bg-gradient-to-r from-amber-700 to-amber-900 text-white"
                    )}
                    style={{
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                    }}
                >
                    {phase === 'WAITING_FOR_BETS' ? "Place Bets" : "Spinning..."}
                </div>

                {/* Spin Direction */}
                <div className="text-gray-400 text-sm mb-4">
                    <div className="mb-2 uppercase tracking-wider">Direction:</div>
                    <div
                        className={cn(
                            "text-lg font-bold px-4 py-2 rounded-full",
                            spinDirection === 'clockwise'
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-purple-900/50 text-purple-300"
                        )}
                    >
                        {spinDirection === 'clockwise' ? 'Clockwise ↻' : 'Counter ↺'}
                    </div>
                </div>

                {/* Info */}
                <div className="text-gray-500 text-xs uppercase tracking-wider">
                    <div className="mb-1">American Roulette</div>
                    <div>38 Numbers</div>
                </div>
            </div>
        </div>
    );
};
