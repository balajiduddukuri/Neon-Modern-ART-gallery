
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryWall } from './components/GalleryWall';
import { ControlPanel } from './components/ControlPanel';
import { ArtPiece, GeneratorState, ViewMode } from './types';
import { generateRandomConfig, constructPrompt } from './services/promptService';
import { generateArt } from './services/geminiService';
import { playSuccessSound, triggerHaptic } from './services/a11yService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Auto-generation interval in ms
const AUTO_INTERVAL = 10000; 

const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

function App() {
  const [currentArt, setCurrentArt] = useState<ArtPiece | null>(null);
  const [history, setHistory] = useState<ArtPiece[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ArtPiece[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  const autoTimeoutRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter History based on Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredHistory(history.filter(p => 
        p.config.subject.toLowerCase().includes(query) || 
        p.config.color.toLowerCase().includes(query) ||
        p.config.feature.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, history]);

  const generateNewPiece = useCallback(async () => {
    if (state === GeneratorState.GENERATING) return;

    setState(GeneratorState.GENERATING);
    const config = generateRandomConfig();
    const prompt = constructPrompt(config);

    try {
      const imageData = await generateArt(prompt);
      
      const newPiece: ArtPiece = {
        id: crypto.randomUUID(),
        url: imageData,
        config,
        prompt,
        timestamp: Date.now()
      };

      setCurrentArt(newPiece);
      setHistory(prev => {
        const newHistory = [newPiece, ...prev].slice(0, 50);
        return newHistory;
      });
      setState(GeneratorState.IDLE);
      
      // Audio/Haptic Feedback for Success
      playSuccessSound();
      triggerHaptic([10, 50, 10]);

    } catch (error) {
      console.error("Generation failed", error);
      setState(GeneratorState.ERROR);
      setIsAutoMode(false);
    }
  }, [state]);

  useEffect(() => {
    if (isAutoMode && state === GeneratorState.IDLE && viewMode === 'single') {
      if (autoTimeoutRef.current) window.clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = window.setTimeout(() => {
        generateNewPiece();
      }, AUTO_INTERVAL);
    }
    return () => {
      if (autoTimeoutRef.current) window.clearTimeout(autoTimeoutRef.current);
    };
  }, [isAutoMode, state, generateNewPiece, viewMode]);

  useEffect(() => {
    if (viewMode !== 'infinite') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && state === GeneratorState.IDLE) {
        generateNewPiece();
      }
    }, { threshold: 0.5 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [viewMode, state, generateNewPiece]);

  const handleDownload = () => {
    if (!currentArt) return;
    const link = document.createElement('a');
    link.href = currentArt.url;
    link.download = `aether-neon-${currentArt.config.subject.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (): Promise<boolean> => {
    if (!currentArt) return false;
    
    try {
      const blob = dataURItoBlob(currentArt.url);
      const file = new File([blob], 'art.png', { type: 'image/png' });
      const title = 'Aether & Neon Gallery';
      const text = `Created with Aether & Neon: ${currentArt.config.count} ${currentArt.config.subject}.`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return true;
      }
      
      if (typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          return true;
        } catch (clipboardErr) {
          console.warn("Clipboard image copy failed", clipboardErr);
        }
      }

      await navigator.clipboard.writeText(`${text} \n\nPrompt: ${currentArt.prompt}`);
      return true;

    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Error sharing:', error);
      return false;
    }
  };

  const handleHistorySelect = (piece: ArtPiece) => {
    setIsAutoMode(false);
    setCurrentArt(piece);
    setViewMode('single');
  };

  const bgColor = isHighContrast ? "bg-black" : "bg-[#111]";
  const textColor = isHighContrast ? "text-yellow-300" : "text-[#e5e5e5]";

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${bgColor} ${textColor} selection:bg-yellow-500 selection:text-black font-sans`}>
      
      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] bg-yellow-400 text-black px-4 py-2 font-bold rounded-md ring-4 ring-black"
      >
        Skip to content
      </a>

      {/* Main Area */}
      <main id="main-content" className={`flex-1 flex flex-col relative transition-all duration-500 ${viewMode === 'infinite' ? 'md:w-full' : ''}`} role="main">
        
        {/* Header */}
        <header className={`fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center transition-all duration-300 ${isHighContrast ? 'bg-black border-b-2 border-white' : (viewMode === 'infinite' ? 'bg-[#111]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent pointer-events-none')}`}>
          <div className="flex flex-col">
            <h1 className={`font-serif text-2xl md:text-3xl tracking-[0.2em] drop-shadow-lg ${isHighContrast ? 'text-white' : 'text-[#f5f5f5]'}`}>AETHER & NEON</h1>
            <div className={`mt-2 flex items-center gap-3 ${isHighContrast ? 'opacity-100' : 'opacity-80'}`}>
              <p className={`hidden md:block text-[10px] tracking-[0.4em] uppercase font-light border-l pl-3 ${isHighContrast ? 'text-yellow-300 border-white' : 'text-neutral-300 border-neutral-600'}`}>Generative Minimalism</p>
              <div className={`text-[10px] font-bold tracking-widest ${isHighContrast ? 'text-white' : 'text-neutral-400'}`}>
                By Balaji Duddukuri
              </div>
            </div>
          </div>
          <div 
            className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full border ${isHighContrast ? 'bg-white text-black border-white font-bold' : 'bg-black/20 text-neutral-400 border-white/5'}`}
            role="status"
          >
            {state === GeneratorState.GENERATING ? 'Dreaming...' : 'Connected'}
          </div>
        </header>

        {/* Dynamic Content View */}
        <div className="flex-1 pt-24 relative">
            
            {/* SINGLE VIEW */}
            {viewMode === 'single' && (
               <div className="h-full flex flex-col">
                  <GalleryWall currentArt={currentArt} state={state} className="flex-1" isHighContrast={isHighContrast} />
                  {/* Floating Controls */}
                  <div className="relative z-40 pb-8 px-4 -mt-24 md:-mt-20 pointer-events-auto">
                    <ControlPanel 
                      currentArt={currentArt}
                      state={state}
                      isAutoMode={isAutoMode}
                      viewMode={viewMode}
                      isHighContrast={isHighContrast}
                      onToggleAuto={() => {
                        if (!isAutoMode) generateNewPiece();
                        setIsAutoMode(!isAutoMode);
                      }}
                      onNext={generateNewPiece}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      onToggleViewMode={() => setViewMode('infinite')}
                      onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
                    />
                  </div>
               </div>
            )}

            {/* INFINITE VIEW */}
            {viewMode === 'infinite' && (
              <div className="w-full flex flex-col items-center gap-24 py-10">
                 {history.length === 0 && !currentArt && (
                   <div className="h-[50vh] flex items-center justify-center">
                      <p className={`font-serif tracking-widest ${isHighContrast ? 'text-yellow-300' : 'text-neutral-500'}`}>Start the generator...</p>
                   </div>
                 )}
                 
                 {history.map((art) => (
                    <article key={art.id} className="w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                       <GalleryWall currentArt={art} state={GeneratorState.IDLE} className={`min-h-[70vh] rounded-xl ${isHighContrast ? 'border-4 border-white' : 'shadow-2xl'}`} isHighContrast={isHighContrast} />
                       <div className={`text-center mt-6 font-serif text-xs tracking-widest uppercase ${isHighContrast ? 'text-white' : 'text-neutral-500 opacity-60'}`}>
                          {new Date(art.timestamp).toLocaleTimeString()} — {art.config.subject}
                       </div>
                    </article>
                 ))}

                 <div ref={loadMoreRef} className="h-32 w-full flex items-center justify-center">
                    {state === GeneratorState.GENERATING && (
                      <div className="flex flex-col items-center gap-4 opacity-50" role="status">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <span className="sr-only">Loading more art</span>
                      </div>
                    )}
                 </div>

                 <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
                    <ControlPanel 
                        currentArt={currentArt}
                        state={state}
                        isAutoMode={false} 
                        viewMode={viewMode}
                        isHighContrast={isHighContrast}
                        onToggleAuto={() => {}} 
                        onNext={generateNewPiece}
                        onDownload={handleDownload}
                        onShare={handleShare}
                        onToggleViewMode={() => setViewMode('single')}
                        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
                      />
                 </div>
              </div>
            )}
        </div>
      </main>

      {/* History Sidebar */}
      {viewMode === 'single' && (
        <aside 
          className={`w-full md:w-80 border-l p-6 flex flex-col h-[30vh] md:h-screen overflow-hidden z-30 transition-all duration-500 ${isHighContrast ? 'bg-black border-white' : 'bg-[#0a0a0a] border-white/5 shadow-2xl'}`}
          aria-label="History and Search"
        >
          <div className="mb-4">
             <div className="flex items-center gap-2 mb-4">
                <div className={`w-1.5 h-1.5 rounded-full ${isHighContrast ? 'bg-yellow-400' : 'bg-neutral-500'}`}></div>
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isHighContrast ? 'text-white' : 'text-neutral-400'}`}>Archives</h3>
             </div>
             
             {/* Search Bar */}
             <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isHighContrast ? 'text-black' : 'text-neutral-500'}`}>
                   <MagnifyingGlassIcon className="h-4 w-4" />
                </div>
                <input 
                  type="search"
                  placeholder="Filter subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    isHighContrast 
                      ? 'bg-white text-black placeholder-gray-600 border border-transparent' 
                      : 'bg-[#1a1a1a] text-neutral-200 placeholder-neutral-600 border border-white/5 hover:border-white/10'
                  }`}
                  aria-label="Search art history"
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.length === 0 && (
              <div className={`h-full flex flex-col items-center justify-center opacity-50 ${isHighContrast ? 'text-white' : 'text-neutral-600'}`}>
                <span className="font-serif italic text-sm">{history.length === 0 ? "Silence" : "No matches"}</span>
              </div>
            )}
            
            <ul className="space-y-4">
              {filteredHistory.map((piece) => (
                <li key={piece.id}>
                  <button 
                    onClick={() => handleHistorySelect(piece)}
                    className={`w-full group flex items-center gap-4 p-3 rounded-sm transition-all duration-300 border ${
                      currentArt?.id === piece.id 
                        ? (isHighContrast ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10') 
                        : (isHighContrast ? 'border-transparent hover:border-white text-white' : 'border-transparent hover:bg-white/5 hover:border-white/5 text-neutral-300')
                    } focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                    aria-current={currentArt?.id === piece.id ? 'page' : undefined}
                  >
                    <div className={`w-12 h-12 overflow-hidden relative ${isHighContrast ? 'border border-white' : 'opacity-80 group-hover:opacity-100'}`}>
                      <img src={piece.url} alt={`Thumbnail of ${piece.config.subject}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-serif truncate capitalize tracking-wide ${isHighContrast ? 'font-bold' : 'group-hover:text-white transition-colors'}`}>
                        {piece.config.subject}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span 
                          className={`w-2 h-2 rounded-full ${isHighContrast ? 'border border-black' : ''}`} 
                          style={{ backgroundColor: piece.config.color.includes('neon') ? piece.config.color.split(' ')[1] : piece.config.color }}
                          aria-hidden="true"
                        ></span>
                        <p className={`text-[10px] capitalize truncate ${isHighContrast ? 'text-inherit' : 'text-neutral-500'}`}>
                          {piece.config.color.replace('neon ', '')}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

    </div>
  );
}

export default App;
