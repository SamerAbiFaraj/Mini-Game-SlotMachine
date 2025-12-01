
import React from 'react';
import { SymbolId } from '../types';
import { getImageForSymbol, getRandomSpinImage } from '../lib/imageMapper';

interface Props {
  id: SymbolId;
  className?: string;
  style?: React.CSSProperties;
  dim?: boolean;
  spinNumber?: number;
  isSpinning?: boolean;
}

const SymbolIcon: React.FC<Props> = ({ id, className, style, dim, spinNumber, isSpinning }) => {
  const [imageError, setImageError] = React.useState(false);
  const [loadedImage, setLoadedImage] = React.useState<string | null>(null);

  // Styles for the container
  const containerClass = `
    relative flex items-center justify-center w-full h-full p-2
    transition-all duration-300
    ${dim ? 'opacity-30 grayscale blur-[1px]' : 'opacity-100'}
  `;

  // Get image path for this symbol with error handling
  const imagePath = React.useMemo(() => {
    try {
      return isSpinning ? getRandomSpinImage() : getImageForSymbol(id, spinNumber);
    } catch (error) {
      console.error('Error getting image path:', error);
      // Return a fallback image or placeholder
      return '/Images/lotto activo/lotto activo/Gato_2.webp';
    }
  }, [id, spinNumber, isSpinning]);

  // Reset error state when image path changes
  React.useEffect(() => {
    setImageError(false);
    setLoadedImage(null);
  }, [imagePath]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load image:', imagePath);
    setImageError(true);
    // Don't throw, just show placeholder
    e.stopPropagation();
  };

  const handleImageLoad = () => {
    setImageError(false);
    setLoadedImage(imagePath);
  };

  const renderIcon = () => {
    // If image failed to load, show placeholder
    if (imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded border border-slate-700">
          <span className="text-xs text-slate-500">?</span>
        </div>
      );
    }

    // Render image with error handling - always show, even if loading
    return (
      <img
        src={imagePath}
        alt={id}
        className="w-full h-full object-contain"
        style={{
          imageRendering: 'high-quality',
          opacity: loadedImage === imagePath ? 1 : 1,
          backgroundColor: 'transparent',
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="eager"
      />
    );
  };

  // Get neon glow color based on symbol type
  const getNeonGlow = () => {
    if (dim) return null;
    switch (id) {
      case 'quantum_wild':
        return 'rgba(204, 0, 255, 0.8)'; // Purple
      case 'wild':
        return 'rgba(255, 215, 0, 0.8)'; // Gold
      default:
        return 'rgba(0, 240, 255, 0.6)'; // Cyan
    }
  };

  const neonGlow = getNeonGlow();

  return (
    <div 
      className={`${containerClass} ${className}`} 
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        filter: !dim && neonGlow ? `
          drop-shadow(0 0 5px ${neonGlow})
          drop-shadow(0 0 10px ${neonGlow})
          drop-shadow(0 0 15px ${neonGlow})
          drop-shadow(0 0 20px ${neonGlow})
          drop-shadow(0 8px 16px rgba(0,0,0,0.6))
        ` : undefined,
      }}
    >
       <div
         style={{
           transform: 'perspective(500px) translateZ(10px)',
           transformStyle: 'preserve-3d',
           minHeight: '100%',
           minWidth: '100%',
         }}
       >
         {renderIcon()}
         {/* Loading placeholder - only show when image is actually loading */}
         {!loadedImage && !imageError && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
             <div className="w-4 h-4 border border-cyan-500/30 border-t-transparent rounded-full animate-spin" />
           </div>
         )}
       </div>
       {/* Enhanced Neon Glow Effect */}
       {!dim && neonGlow && (
         <>
           <div 
             className="absolute inset-0 rounded-full blur-xl opacity-40 pointer-events-none"
             style={{
               background: `radial-gradient(circle, ${neonGlow} 0%, transparent 70%)`,
               transform: 'translateZ(-5px)',
               animation: 'neon-glow 2s ease-in-out infinite alternate',
             }}
           />
           <div 
             className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none"
             style={{
               background: `radial-gradient(circle, ${neonGlow} 0%, transparent 80%)`,
               transform: 'translateZ(-10px)',
             }}
           />
         </>
       )}
    </div>
  );
};

export default React.memo(SymbolIcon);
