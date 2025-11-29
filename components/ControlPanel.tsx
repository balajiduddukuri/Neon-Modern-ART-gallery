import React from 'react';
import { ArtPiece, GeneratorState } from '../types';
import { ArrowDownTrayIcon, PlayIcon, PauseIcon, ForwardIcon } from '@heroicons/react/24/outline';

interface ControlPanelProps {
  currentArt: ArtPiece | null;
  state: GeneratorState;
  isAutoMode: boolean;
  onToggleAuto: () => void;
  onNext: () => void;
  onDownload: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentArt,
  state,
  isAutoMode,
  onToggleAuto,
  onNext,
  onDownload,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto mt-8 p-6 bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      
      {/* Art Details */}
      <div className="mb-8 text-center space-y-3 min-h-[90px] flex flex-col justify-center">
        {currentArt ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h2 className="font-serif text-2xl text-white/90 tracking-wide capitalize drop-shadow-md">
              {currentArt.config.count} {currentArt.config.subject}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs tracking-widest uppercase text-neutral-400 mt-2">
               <span className="w-1.5 h-1.5 rounded-full inline-block shadow-[0_0_8px_currentColor]" style={{ 
                 backgroundColor: currentArt.config.color.includes('neon') ? currentArt.config.color.replace('neon ', '') : currentArt.config.color,
                 color: currentArt.config.color.includes('neon') ? currentArt.config.color.replace('neon ', '') : currentArt.config.color
               }}></span>
               <span>{currentArt.config.color}</span>
            </div>
          </div>
        ) : (
           <div className="flex items-center justify-center text-neutral-600 font-serif italic text-sm tracking-widest opacity-50">
             Initiate Generation
           </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-6 px-2">
        
        <button
          onClick={onToggleAuto}
          className={`flex items-center gap-3 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500 ${
            isAutoMode 
              ? 'bg-neutral-800 text-red-300 hover:bg-neutral-700 hover:shadow-[0_0_15px_rgba(255,100,100,0.1)]' 
              : 'bg-neutral-100 text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          }`}
        >
          {isAutoMode ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {isAutoMode ? 'Pause Loop' : 'Auto Curate'}
        </button>

        <div className="flex gap-3">
            <button
            onClick={onDownload}
            disabled={!currentArt}
            className="p-3 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/5"
            title="Download Art"
            >
            <ArrowDownTrayIcon className="w-4 h-4" />
            </button>

            <button
            onClick={onNext}
            disabled={state === GeneratorState.GENERATING}
            className="p-3 rounded-full bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/5"
            title="Generate Next"
            >
            <ForwardIcon className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Progress Bar for Auto Mode - Organic */}
      {isAutoMode && (
        <div className="mt-8 relative w-full h-0.5 bg-neutral-800 overflow-hidden rounded-full opacity-50">
          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_2s_infinite]" />
          <div className="h-full bg-neutral-400 animate-[progress_10s_linear_infinite] origin-left" />
        </div>
      )}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};