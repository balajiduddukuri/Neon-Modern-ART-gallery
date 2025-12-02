
import React, { useState, useEffect } from 'react';
import { ArtPiece, GeneratorState } from '../types';

interface GalleryWallProps {
  currentArt: ArtPiece | null;
  state: GeneratorState;
  className?: string;
  isHighContrast?: boolean;
}

export const GalleryWall: React.FC<GalleryWallProps> = ({ currentArt, state, className = "", isHighContrast = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  useEffect(() => {
    if (state === GeneratorState.GENERATING) {
      setImageLoaded(false);
    }
  }, [state, currentArt]);

  const isVisuallyLoading = state === GeneratorState.GENERATING && !currentArt; 
  
  // High Contrast Styles
  const wallBg = isHighContrast ? "bg-black" : "bg-neutral-900";
  const frameShadow = isHighContrast ? "shadow-none border-4 border-white" : "shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] border-r-4 border-b-4 border-[#d4d4d4]";
  const mattingColor = isHighContrast ? "bg-white border-0" : "bg-[#f5f5f5] border-[#f5f5f5] border-[24px] md:border-[48px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]";

  return (
    <div 
      className={`flex items-center justify-center p-4 md:p-8 relative overflow-hidden min-h-[60vh] ${wallBg} ${className}`}
      role="region"
      aria-label="Art Display Area"
    >
      {/* Wall Texture - Hidden in High Contrast */}
      {!isHighContrast && (
        <>
          <div className="absolute inset-0 bg-[#1a1a1a] opacity-100" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-white blur-[120px] opacity-[0.05] pointer-events-none" />
        </>
      )}

      {/* Frame Container */}
      <div className={`relative z-10 max-w-lg w-full aspect-[3/4] transition-transform duration-700 ease-out ${!isHighContrast && 'hover:scale-[1.01]'}`}>
        
        {/* The Frame */}
        <div className={`absolute inset-0 overflow-hidden bg-[#e5e5e5] ${frameShadow}`}>
           
           {/* Matting */}
           <div className={`absolute inset-0 flex items-center justify-center ${mattingColor}`}>
              
              {/* Canvas Area */}
              <div className={`w-full h-full relative overflow-hidden flex items-center justify-center ${isHighContrast ? 'bg-black' : 'bg-[#e0e0e0] shadow-inner'}`}>
                
                {currentArt && (
                  <img 
                    src={currentArt.url} 
                    alt={`Generative art piece: ${currentArt.prompt}`}
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${!imageLoaded ? 'opacity-0 scale-105' : 'opacity-100 scale-100'} ${!isHighContrast && imageLoaded ? 'grayscale-[0.1]' : ''}`}
                  />
                )}

                {/* Empty State */}
                {!currentArt && !isVisuallyLoading && (
                  <div className={`font-serif text-center px-6 ${isHighContrast ? 'text-white' : 'text-neutral-400 opacity-60'}`}>
                    <p className="text-xl tracking-widest mb-3">THE CANVAS AWAITS</p>
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
                          <div className="w-32 h-32 bg-neutral-300 rounded-full blur-2xl animate-pulse opacity-50"></div>
                          <div className="absolute inset-0 w-32 h-32 bg-white rounded-full blur-[40px] animate-[pulse_3s_ease-in-out_infinite] opacity-40"></div>
                       </div>
                     ) : (
                       <div className="w-16 h-16 border-4 border-t-yellow-400 border-white rounded-full animate-spin mb-8"></div>
                     )}
                     <p className={`font-serif tracking-[0.3em] text-xs mt-8 animate-pulse ${isHighContrast ? 'text-yellow-300' : 'text-neutral-500'}`}>MANIFESTING...</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Floor Reflection - Hidden in High Contrast */}
      {!isHighContrast && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-black/80 to-transparent blur-xl pointer-events-none" />
      )}
    </div>
  );
};
