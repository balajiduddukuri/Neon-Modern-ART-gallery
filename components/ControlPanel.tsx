
import React, { useState } from 'react';
import { ArtPiece, GeneratorState, ViewMode } from '../types';
import { 
  ArrowDownTrayIcon, 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon, 
  ShareIcon,
  QueueListIcon,
  Square2StackIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { playClickSound, triggerHaptic } from '../services/a11yService';

interface ControlPanelProps {
  currentArt: ArtPiece | null;
  state: GeneratorState;
  isAutoMode: boolean;
  viewMode: ViewMode;
  isHighContrast: boolean;
  onToggleAuto: () => void;
  onNext: () => void;
  onDownload: () => void;
  onShare: () => Promise<boolean>;
  onToggleViewMode: () => void;
  onToggleHighContrast: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentArt,
  state,
  isAutoMode,
  viewMode,
  isHighContrast,
  onToggleAuto,
  onNext,
  onDownload,
  onShare,
  onToggleViewMode,
  onToggleHighContrast
}) => {
  const [isShared, setIsShared] = useState(false);

  const handleInteraction = (action: () => void) => {
    playClickSound();
    triggerHaptic();
    action();
  };

  const handleShareClick = async () => {
    playClickSound();
    triggerHaptic();
    const success = await onShare();
    if (success) {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    }
  };

  // High Contrast Styles
  const containerClass = isHighContrast 
    ? "bg-black border-2 border-yellow-400 shadow-none rounded-lg" 
    : "bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl";

  const buttonBaseClass = "p-3 rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black";
  
  const standardButtonClass = isHighContrast
    ? "bg-black text-yellow-400 border border-yellow-400 hover:bg-yellow-400 hover:text-black"
    : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border border-white/5";

  return (
    <div 
      className={`w-full max-w-2xl mx-auto mt-8 p-6 transition-all duration-300 ${containerClass}`}
      role="region" 
      aria-label="Gallery Controls"
    >
      
      {/* Art Details */}
      <div className="mb-8 text-center space-y-3 min-h-[90px] flex flex-col justify-center" aria-live="polite">
        {currentArt ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h2 className={`font-serif text-2xl tracking-wide capitalize drop-shadow-md ${isHighContrast ? 'text-yellow-300 font-bold' : 'text-white/90'}`}>
              {currentArt.config.count} {currentArt.config.subject}
            </h2>
            <div className={`flex items-center justify-center gap-3 text-xs tracking-widest uppercase mt-2 ${isHighContrast ? 'text-white' : 'text-neutral-400'}`}>
               <span 
                 className={`w-2 h-2 rounded-full inline-block ${isHighContrast ? 'border border-white' : 'shadow-[0_0_8px_currentColor]'}`} 
                 style={{ 
                   backgroundColor: currentArt.config.color.includes('neon') ? currentArt.config.color.replace('neon ', '') : currentArt.config.color,
                 }}
                 aria-hidden="true"
               ></span>
               <span>{currentArt.config.color}</span>
            </div>
          </div>
        ) : (
           <div className={`flex items-center justify-center font-serif italic text-sm tracking-widest ${isHighContrast ? 'text-white' : 'text-neutral-600 opacity-50'}`}>
             Initiate Generation
           </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        
        {/* Left Group: Modes */}
        <div className="flex items-center gap-4">
           <button
            onClick={() => handleInteraction(onToggleViewMode)}
            className={standardButtonClass + " " + buttonBaseClass}
            title={viewMode === 'single' ? "Switch to Infinite Feed" : "Switch to Single View"}
            aria-label={viewMode === 'single' ? "Switch to Infinite Feed View" : "Switch to Single Focus View"}
          >
            {viewMode === 'single' ? <QueueListIcon className="w-5 h-5" /> : <Square2StackIcon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleInteraction(onToggleHighContrast)}
            className={standardButtonClass + " " + buttonBaseClass}
            title={isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
            aria-label={isHighContrast ? "Disable High Contrast Mode" : "Enable High Contrast Mode"}
            aria-pressed={isHighContrast}
          >
             {isHighContrast ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleInteraction(onToggleAuto)}
            disabled={viewMode === 'infinite'}
            className={`flex items-center gap-3 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black ${
              isAutoMode 
                ? (isHighContrast ? 'bg-red-600 text-white border-2 border-white' : 'bg-neutral-800 text-red-300 hover:bg-neutral-700 hover:shadow-[0_0_15px_rgba(255,100,100,0.1)]') 
                : (isHighContrast ? 'bg-white text-black border-2 border-black' : 'bg-neutral-100 text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]')
            } ${viewMode === 'infinite' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Auto-generate every 10 seconds"
            aria-label={isAutoMode ? "Pause Auto Generation" : "Start Auto Generation Loop"}
            aria-pressed={isAutoMode}
          >
            {isAutoMode ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            {isAutoMode ? 'Pause' : 'Auto Curate'}
          </button>
        </div>

        {/* Right Group: Actions */}
        <div className="flex gap-3">
             <button
            onClick={handleShareClick}
            disabled={!currentArt}
            className={`${buttonBaseClass} disabled:opacity-30 disabled:cursor-not-allowed ${
              isShared 
                ? 'bg-green-700 text-white border-green-500' 
                : standardButtonClass
            }`}
            title="Share Art"
            aria-label="Share current artwork"
            >
            {isShared ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
            </button>

            <button
            onClick={() => handleInteraction(onDownload)}
            disabled={!currentArt}
            className={`${standardButtonClass} ${buttonBaseClass} disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Download Art"
            aria-label="Download current artwork"
            >
            <ArrowDownTrayIcon className="w-5 h-5" />
            </button>

            <button
            onClick={() => handleInteraction(onNext)}
            disabled={state === GeneratorState.GENERATING}
            className={`${standardButtonClass} ${buttonBaseClass} disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Generate Next"
            aria-label="Generate New Artwork"
            >
            <ForwardIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Progress Bar for Auto Mode */}
      {isAutoMode && viewMode === 'single' && (
        <div 
          className={`mt-8 relative w-full h-1 overflow-hidden rounded-full ${isHighContrast ? 'bg-gray-800' : 'bg-neutral-800 opacity-50'}`}
          role="progressbar"
          aria-label="Time until next generation"
        >
          {!isHighContrast && (
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_2s_infinite]" />
          )}
          <div className={`h-full animate-[progress_10s_linear_infinite] origin-left ${isHighContrast ? 'bg-yellow-400' : 'bg-neutral-400'}`} />
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
