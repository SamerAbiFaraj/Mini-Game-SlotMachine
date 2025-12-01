import React, { useEffect, useMemo, useState, useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions, Engine } from "@tsparticles/engine";
import { GamePhase } from "../types";

interface Props {
  active: boolean;
  phase: GamePhase;
  isBigWin?: boolean;
}

const WinParticles: React.FC<Props> = ({ active, phase, isBigWin = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // tsParticles init callback
  const particlesInit = useCallback(
    async (engine: Engine) => {
      try {
        await loadSlim(engine);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to load win particles:", error);
        setHasError(true);
      }
    },
    []
  );

  const options: ISourceOptions = useMemo(() => {
    if (!active || !loaded) {
      return { particles: { number: { value: 0 } } };
    }

    const phaseColors = {
      Calm: {
        primary: "#22d3ee",
        secondary: "#06b6d4",
      },
      Surge: {
        primary: "#fbbf24",
        secondary: "#f59e0b",
      },
      Quantum: {
        primary: "#e879f9",
        secondary: "#d946ef",
      },
    };

    const colors = phaseColors[phase];
    const particleCount = isBigWin ? 200 : 100;

    return {
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      particles: {
        color: {
          value: [colors.primary, colors.secondary, "#ffffff"],
        },
        move: {
          direction: "top",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: isBigWin ? 8 : 5,
          straight: false,
          attract: {
            enable: true,
            rotateX: 600,
            rotateY: 1200,
          },
        },
        number: {
          value: particleCount,
        },
        opacity: {
          value: 0.8,
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        shape: {
          type: ["star", "circle"],
        },
        size: {
          value: { min: 2, max: isBigWin ? 8 : 5 },
          animation: {
            enable: true,
            speed: 3,
            sync: false,
          },
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.1,
            opacity: 1,
          },
        },
      },
      emitters: [
        {
          position: {
            x: 50,
            y: 50,
          },
          rate: {
            quantity: isBigWin ? 50 : 25,
            delay: 0.1,
          },
          life: {
            count: 1,
            delay: 0,
            duration: isBigWin ? 2 : 1,
          },
        },
      ],
      detectRetina: true,
    };
  }, [active, phase, isBigWin, loaded]);

  if (!active || hasError) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      <Particles
        id="tsparticles-win"
        init={particlesInit}
        options={options}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default WinParticles;
