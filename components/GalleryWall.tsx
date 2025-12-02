
import React, { useState, useEffect } from 'react';
import { ArtPiece, GeneratorState } from '../types';

interface GalleryWallProps {
  currentArt: ArtPiece | null;
  state: GeneratorState;
  className?: string;
}

export const GalleryWall: React.FC<GalleryWallProps> = ({ currentArt, state, className = "" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset loaded state when art changes
  useEffect(() => {
    if (state === GeneratorState.GENERATING) {
      setImageLoaded(false);
    }
  }, [state, currentArt]);

  // For infinite scroll, we treat it as loaded if it's an old history item (not the one actively generating)
  // But strictly, if we pass `currentArt`, we want to check its load status. 
  // Simplified: If `currentArt` is present, we wait for onLoad.
  
  const isVisuallyLoading = state === GeneratorState.GENERATING && !currentArt; 
  // Note: specific logic for "loading next" vs "loading image" can be refined, 
  // but for the gallery wall component, it cares if *its* specific art is ready.
  
  return (
    <div className={`flex items-center justify-center p-4 md:p-8 bg-neutral-900 relative overflow-hidden min-h-[60vh] ${className}`}>
      {/* Wall Texture - Subtle Noise */}
      <div className="absolute inset-0 bg-[#1a1a1a] opacity-100" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-white blur-[120px] opacity-[0.05] pointer-events-none" />

      {/* Frame Container */}
      <div className="relative z-10 max-w-lg w-full aspect-[3/4] transition-transform duration-700 ease-out hover:scale-[1.01]">
        
        {/* The Frame - Deep architectural shadows */}
        <div className="absolute inset-0 bg-[#e5e5e5] border-r-4 border-b-4 border-[#d4d4d4] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
           
           {/* Matting */}
           <div className="absolute inset-0 border-[24px] md:border-[48px] border-[#f5f5f5] bg-[#f5f5f5] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
              
              {/* Canvas Area */}
              <div className="w-full h-full bg-[#e0e0e0] relative overflow-hidden flex items-center justify-center shadow-inner">
                
                {currentArt && (
                  <img 
                    src={currentArt.url} 
                    alt={currentArt.prompt}
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${!imageLoaded ? 'opacity-0 scale-105' : 'opacity-100 scale-100 grayscale-[0.1]'}`}
                  />
                )}

                {/* Empty State */}
                {!currentArt && !isVisuallyLoading && (
                  <div className="text-neutral-400 font-serif text-center px-6 opacity-60">
                    <p className="text-xl tracking-widest mb-3">THE CANVAS AWAITS</p>
                    <p className="text-xs font-sans text-neutral-500 tracking-wider uppercase">Summon the Aether</p>
                  </div>
                )}

                {/* Loading State - Breathing Mist */}
                {(!currentArt || !imageLoaded) && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center bg-[#e0e0e0] z-20 transition-opacity duration-500 ${imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                     {/* The Breathing Orb */}
                     <div className="relative">
                        <div className="w-32 h-32 bg-neutral-300 rounded-full blur-2xl animate-pulse opacity-50"></div>
                        <div className="absolute inset-0 w-32 h-32 bg-white rounded-full blur-[40px] animate-[pulse_3s_ease-in-out_infinite] opacity-40"></div>
                     </div>
                     <p className="text-neutral-500 font-serif tracking-[0.3em] text-xs mt-8 animate-pulse">MANIFESTING...</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Floor Reflection */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-black/80 to-transparent blur-xl pointer-events-none" />
    </div>
  );
};
