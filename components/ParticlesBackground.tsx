import React, { useMemo } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { type ISourceOptions, type Engine } from '@tsparticles/engine';
import { GamePhase } from '../types';

interface Props {
  phase: GamePhase;
}

const ParticlesBackground: React.FC<Props> = ({ phase }) => {
  const [hasError, setHasError] = React.useState(false);
  
  // Initialize particles engine
  React.useEffect(() => {
    try {
      loadSlim(async (engine: Engine) => {
        // Particles are loaded and ready
      }).catch((error) => {
        console.error('Failed to load particles:', error);
        setHasError(true);
      });
    } catch (error) {
      console.error('Particles initialization error:', error);
      setHasError(true);
    }
  }, []);

  const options: ISourceOptions = useMemo(() => {
    // Color schemes based on phase
    const phaseColors = {
      Calm: {
        primary: '#22d3ee', // cyan-400
        secondary: '#06b6d4', // cyan-500
        tertiary: '#0891b2'  // cyan-600
      },
      Surge: {
        primary: '#fbbf24', // amber-400
        secondary: '#f59e0b', // amber-500
        tertiary: '#d97706'  // amber-600
      },
      Quantum: {
        primary: '#e879f9', // fuchsia-400
        secondary: '#d946ef', // fuchsia-500
        tertiary: '#c026d3'  // fuchsia-600
      }
    };

    const colors = phaseColors[phase];

    return {
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: false,
          },
          onHover: {
            enable: true,
            mode: 'grab',
          },
        },
        modes: {
          grab: {
            distance: 200,
            links: {
              opacity: 0.3,
            },
          },
        },
      },
      particles: {
        color: {
          value: [colors.primary, colors.secondary, colors.tertiary],
        },
        links: {
          color: colors.primary,
          distance: 150,
          enable: true,
          opacity: phase === 'Quantum' ? 0.4 : 0.2,
          width: 1,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'out',
          },
          random: true,
          speed: phase === 'Quantum' ? 2 : phase === 'Surge' ? 1.5 : 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: phase === 'Quantum' ? 120 : phase === 'Surge' ? 80 : 60,
        },
        opacity: {
          value: phase === 'Quantum' ? 0.6 : phase === 'Surge' ? 0.5 : 0.4,
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
        },
        shape: {
          type: ['circle', 'triangle'],
        },
        size: {
          value: { min: 1, max: phase === 'Quantum' ? 4 : 3 },
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05,
            opacity: 1,
          },
        },
      },
      detectRetina: true,
      transition: {
        duration: 2000,
        enable: true,
      },
    };
  }, [phase]);

  // If particles fail to load, return empty div instead of crashing
  if (hasError) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <Particles
        id="tsparticles-background"
        options={options}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default ParticlesBackground;
