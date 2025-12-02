
import React, { useState, useEffect } from 'react';
import { ArtPiece, GeneratorState } from '../types';
import { HeartIcon, XMarkIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { triggerHaptic, playClickSound } from '../services/a11yService';

interface GalleryWallProps {
  currentArt: ArtPiece | null;
  state: GeneratorState;
  className?: string;
  isHighContrast?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  minimal?: boolean; // New prop for grid view optimization
}

export const GalleryWall: React.FC<GalleryWallProps> = ({ 
  currentArt, 
  state, 
  className = "", 
  isHighContrast = false,
  isFavorite = false,
  onToggleFavorite,
  minimal = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [justFavorited, setJustFavorited] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  useEffect(() => {
    if (state === GeneratorState.GENERATING) {
      setImageLoaded(false);
      setIsZoomed(false);
    }
  }, [state, currentArt]);

  // Handle Escape key to close zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      playClickSound();
      triggerHaptic();
      onToggleFavorite();
      if (!isFavorite) {
        setJustFavorited(true);
        setTimeout(() => setJustFavorited(false), 1000);
      }
    }
  };

  const toggleZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentArt && imageLoaded) {
      playClickSound();
      setIsZoomed(!isZoomed);
    }
  };

  const isVisuallyLoading = state === GeneratorState.GENERATING && !currentArt; 
  
  // High Contrast Styles
  const wallBg = isHighContrast ? "bg-black" : (minimal ? "bg-transparent" : "bg-neutral-900");
  const frameShadow = isHighContrast ? "shadow-none border-4 border-white" : "shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] border-r-4 border-b-4 border-[#d4d4d4]";
  const mattingColor = isHighContrast ? "bg-white border-0" : "bg-[#f5f5f5] border-[#f5f5f5] border-[24px] md:border-[48px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]";

  // In minimal mode (grid), reduce padding and borders
  const containerPadding = minimal ? "p-0" : "p-4 md:p-8";
  const mattingStyle = minimal ? "border-[12px] md:border-[24px]" : mattingColor;

  return (
    <>
      <div 
        className={`flex items-center justify-center relative overflow-hidden ${wallBg} ${containerPadding} ${className}`}
        role="region"
        aria-label={minimal ? `Artwork: ${currentArt?.config.subject}` : "Art Display Area"}
      >
        {/* Wall Texture - Hidden in High Contrast or Minimal Mode */}
        {!isHighContrast && !minimal && (
          <>
            <div className="absolute inset-0 bg-[#1a1a1a] opacity-100" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-white blur-[120px] opacity-[0.05] pointer-events-none" />
          </>
        )}

        {/* Frame Container */}
        <div className={`relative z-10 w-full aspect-[3/4] transition-transform duration-700 ease-out ${!isHighContrast && !minimal && 'hover:scale-[1.01]'} ${!minimal ? 'max-w-lg' : ''}`}>
          
          {/* The Frame */}
          <div className={`absolute inset-0 overflow-hidden bg-[#e5e5e5] ${frameShadow}`}>
            
            {/* Matting */}
            <div className={`absolute inset-0 flex items-center justify-center ${minimal ? 'bg-[#f5f5f5] ' + mattingStyle : mattingColor}`}>
                
                {/* Canvas Area */}
                <div 
                  className={`w-full h-full relative overflow-hidden flex items-center justify-center group ${isHighContrast ? 'bg-black' : 'bg-[#e0e0e0] shadow-inner'} ${currentArt && imageLoaded ? 'cursor-zoom-in' : ''}`}
                  onClick={toggleZoom}
                  title={currentArt && imageLoaded ? "Click to zoom" : undefined}
                >
                  
                  {currentArt && (
                    <>
                      <img 
                        src={currentArt.url} 
                        alt={`Generative art piece: ${currentArt.prompt}`}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${!imageLoaded ? 'opacity-0 scale-105' : 'opacity-100 scale-100'} ${!isHighContrast && imageLoaded ? 'grayscale-[0.1]' : ''}`}
                      />
                      
                      {/* Zoom Hint Icon (Visible on hover if not mobile) */}
                      {imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-black/10">
                          <MagnifyingGlassPlusIcon className="w-12 h-12 text-white/80 drop-shadow-md" />
                        </div>
                      )}

                      {/* Favorite Overlay Button (Always visible on mobile/touch, hover on desktop) */}
                      {onToggleFavorite && (
                        <button
                          onClick={handleFavoriteClick}
                          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 z-30 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                            isFavorite 
                              ? 'bg-white/90 text-red-500 shadow-lg scale-100' 
                              : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'
                          } ${justFavorited ? 'animate-[ping_0.5s_ease-in-out]' : ''}`}
                          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          aria-pressed={isFavorite}
                        >
                          {isFavorite ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                        </button>
                      )}
                    </>
                  )}

                  {/* Empty State */}
                  {!currentArt && !isVisuallyLoading && (
                    <div className={`font-serif text-center px-6 ${isHighContrast ? 'text-white' : 'text-neutral-400 opacity-60'}`}>
                      <p className={`${minimal ? 'text-sm' : 'text-xl'} tracking-widest mb-3`}>THE CANVAS AWAITS</p>
                      <p className={`text-xs font-sans tracking-wider uppercase ${isHighContrast ? 'text-yellow-300' : 'text-neutral-500'}`}>Summon the Aether</p>
                    </div>
                  )}

                  {/* Loading State - Live Region for Screen Readers */}
                  <div aria-live="polite" aria-busy={!currentArt || !imageLoaded} className="sr-only">
                    {(!currentArt || !imageLoaded) ? "Generating art, please wait..." : "Art loaded."}
                  </div>

                  {/* Visual Loading State */}
                  {(!currentArt || !imageLoaded) && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 transition-opacity duration-500 ${isHighContrast ? 'bg-black' : 'bg-[#e0e0e0]'} ${imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      {/* The Breathing Orb */}
                      {!isHighContrast ? (
                        <div className="relative">
                            <div className={`${minimal ? 'w-16 h-16' : 'w-32 h-32'} bg-neutral-300 rounded-full blur-2xl animate-pulse opacity-50`}></div>
                            <div className={`absolute inset-0 ${minimal ? 'w-16 h-16' : 'w-32 h-32'} bg-white rounded-full blur-[40px] animate-[pulse_3s_ease-in-out_infinite] opacity-40`}></div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 border-4 border-t-yellow-400 border-white rounded-full animate-spin mb-8"></div>
                      )}
                      {!minimal && (
                        <p className={`font-serif tracking-[0.3em] text-xs mt-8 animate-pulse ${isHighContrast ? 'text-yellow-300' : 'text-neutral-500'}`}>MANIFESTING...</p>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Floor Reflection - Hidden in High Contrast or Minimal */}
        {!isHighContrast && !minimal && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-black/80 to-transparent blur-xl pointer-events-none" />
        )}
      </div>

      {/* Full Screen Zoom Overlay */}
      {isZoomed && currentArt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={toggleZoom}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen view"
        >
          <div className="absolute top-4 right-4 z-[110]">
             <button 
               onClick={toggleZoom}
               className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
               aria-label="Close zoom view"
             >
               <XMarkIcon className="w-8 h-8" />
             </button>
          </div>
          <img 
            src={currentArt.url} 
            alt={currentArt.config.subject} 
            className="max-h-[95vh] max-w-[95vw] object-contain shadow-2xl cursor-zoom-out"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself? Actually, clicking usually closes lightbox too. Let's keep it consistent or allow pan? For now, clicking image won't close, background will.
          />
          <div className="absolute bottom-8 text-center text-white/70 font-serif tracking-widest text-sm pointer-events-none">
             {currentArt.config.count} {currentArt.config.subject}
          </div>
        </div>
      )}
    </>
  );
};
