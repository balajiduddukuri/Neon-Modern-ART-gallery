
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryWall } from './components/GalleryWall';
import { ControlPanel } from './components/ControlPanel';
import { ArtPiece, GeneratorState, ViewMode } from './types';
import { generateRandomConfig, constructPrompt } from './services/promptService';
import { generateArt } from './services/geminiService';

// Auto-generation interval in ms
const AUTO_INTERVAL = 10000; 

// Helper: Convert Base64 to Blob for Sharing
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
  const [state, setState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  
  // Use number for setTimeout return type in browser environment
  const autoTimeoutRef = useRef<number | null>(null);
  
  // Infinite Scroll Trigger Ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
      setHistory(prev => [newPiece, ...prev].slice(0, 50)); // Increased limit for infinite scroll feel
      setState(GeneratorState.IDLE);
    } catch (error) {
      console.error("Generation failed", error);
      setState(GeneratorState.ERROR);
      setIsAutoMode(false);
    }
  }, [state]);

  // Handle Auto Mode Logic (Only in Single View)
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

  // Infinite Scroll Observer
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

  // Downloads
  const handleDownload = () => {
    if (!currentArt) return;
    const link = document.createElement('a');
    link.href = currentArt.url;
    link.download = `aether-neon-${currentArt.config.subject.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Social Share - Returns true if successful (for UI feedback)
  const handleShare = async (): Promise<boolean> => {
    if (!currentArt) return false;
    
    try {
      const blob = dataURItoBlob(currentArt.url);
      const file = new File([blob], 'art.png', { type: 'image/png' });
      const title = 'Aether & Neon Gallery';
      const text = `Created with Aether & Neon: ${currentArt.config.count} ${currentArt.config.subject} featuring ${currentArt.config.feature}.`;

      // 1. Try Native Web Share (Mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file]
        });
        return true;
      }
      
      // 2. Try Copying Image to Clipboard (Desktop)
      // Check for clipboard item support
      if (typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          // We return true here to show the "Checkmark" which implies "Copied" in this context
          return true;
        } catch (clipboardErr) {
          console.warn("Clipboard image copy failed, falling back to text", clipboardErr);
        }
      }

      // 3. Fallback: Copy Text to Clipboard
      await navigator.clipboard.writeText(`${text} \n\nPrompt: ${currentArt.prompt}`);
      return true;

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  };

  const handleHistorySelect = (piece: ArtPiece) => {
    setIsAutoMode(false);
    setCurrentArt(piece);
    setViewMode('single'); // Switch back to single view to focus
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#111] text-white selection:bg-neutral-700 font-sans">
      
      {/* Main Area */}
      <main className={`flex-1 flex flex-col relative transition-all duration-500 ${viewMode === 'infinite' ? 'md:w-full' : ''}`}>
        
        {/* Header */}
        <header className={`fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center transition-all duration-300 ${viewMode === 'infinite' ? 'bg-[#111]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent pointer-events-none'}`}>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl tracking-[0.2em] text-[#f5f5f5] drop-shadow-lg">AETHER & NEON</h1>
            <p className="hidden md:block text-[10px] text-neutral-400 tracking-[0.4em] uppercase mt-1 font-light border-l border-neutral-600 pl-3">Generative Minimalism</p>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase bg-black/20 px-3 py-1 rounded-full border border-white/5">
            {state === GeneratorState.GENERATING ? 'Dreaming...' : 'Connected'}
          </div>
        </header>

        {/* Dynamic Content View */}
        <div className="flex-1 pt-20 relative">
            
            {/* SINGLE VIEW */}
            {viewMode === 'single' && (
               <div className="h-full flex flex-col">
                  <GalleryWall currentArt={currentArt} state={state} className="flex-1" />
                  {/* Floating Controls for Single View */}
                  <div className="relative z-40 pb-8 px-4 -mt-24 md:-mt-20 pointer-events-auto">
                    <ControlPanel 
                      currentArt={currentArt}
                      state={state}
                      isAutoMode={isAutoMode}
                      viewMode={viewMode}
                      onToggleAuto={() => {
                        if (!isAutoMode) generateNewPiece();
                        setIsAutoMode(!isAutoMode);
                      }}
                      onNext={generateNewPiece}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      onToggleViewMode={() => setViewMode('infinite')}
                    />
                  </div>
               </div>
            )}

            {/* INFINITE VIEW */}
            {viewMode === 'infinite' && (
              <div className="w-full flex flex-col items-center gap-24 py-10">
                 {/* Map through history for the feed */}
                 {history.length === 0 && !currentArt && (
                   <div className="h-[50vh] flex items-center justify-center">
                      <p className="text-neutral-500 font-serif tracking-widest">Start the generator...</p>
                   </div>
                 )}
                 
                 {history.map((art) => (
                    <div key={art.id} className="w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                       <GalleryWall currentArt={art} state={GeneratorState.IDLE} className="min-h-[70vh] rounded-xl shadow-2xl" />
                       <div className="text-center mt-6 text-neutral-500 font-serif text-xs tracking-widest uppercase opacity-60">
                          {new Date(art.timestamp).toLocaleTimeString()} — {art.config.subject}
                       </div>
                    </div>
                 ))}

                 {/* Loader / Trigger at bottom */}
                 <div ref={loadMoreRef} className="h-32 w-full flex items-center justify-center">
                    {state === GeneratorState.GENERATING && (
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="text-xs font-serif tracking-widest">Expanding Gallery...</span>
                      </div>
                    )}
                 </div>

                 {/* Sticky Control Panel for Infinite View */}
                 <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
                    <ControlPanel 
                        currentArt={currentArt}
                        state={state}
                        isAutoMode={false} // Auto disabled in infinite
                        viewMode={viewMode}
                        onToggleAuto={() => {}} 
                        onNext={generateNewPiece}
                        onDownload={handleDownload}
                        onShare={handleShare}
                        onToggleViewMode={() => setViewMode('single')}
                      />
                 </div>
              </div>
            )}
        </div>
      </main>

      {/* History Sidebar (Only in Single View) */}
      {viewMode === 'single' && (
        <aside className="w-full md:w-80 bg-[#0a0a0a] border-l border-white/5 p-6 flex flex-col h-[30vh] md:h-screen overflow-hidden z-30 shadow-2xl transition-all duration-500">
          <div className="mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full"></div>
            <h3 className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.3em]">Archives</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-neutral-700 opacity-50">
                <span className="font-serif italic text-sm">Silence</span>
              </div>
            )}
            {history.map((piece) => (
              <button 
                key={piece.id}
                onClick={() => handleHistorySelect(piece)}
                className={`w-full group flex items-center gap-4 p-3 rounded-sm transition-all duration-300 border border-transparent ${currentArt?.id === piece.id ? 'bg-white/5 border-white/10' : 'hover:bg-white/5 hover:border-white/5'}`}
              >
                <div className="w-12 h-12 overflow-hidden relative opacity-80 group-hover:opacity-100 transition-opacity">
                  <img src={piece.url} alt="thumbnail" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-serif text-neutral-300 truncate capitalize tracking-wide group-hover:text-white transition-colors">
                    {piece.config.subject}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: piece.config.color.includes('neon') ? piece.config.color.split(' ')[1] : piece.config.color }}></span>
                    <p className="text-[10px] text-neutral-500 capitalize truncate">{piece.config.color.replace('neon ', '')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

    </div>
  );
}

export default App;
