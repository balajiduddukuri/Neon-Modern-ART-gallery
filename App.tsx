import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryWall } from './components/GalleryWall';
import { ControlPanel } from './components/ControlPanel';
import { ArtPiece, GeneratorState } from './types';
import { generateRandomConfig, constructPrompt } from './services/promptService';
import { generateArt } from './services/geminiService';

// Auto-generation interval in ms
const AUTO_INTERVAL = 10000; 

function App() {
  const [currentArt, setCurrentArt] = useState<ArtPiece | null>(null);
  const [history, setHistory] = useState<ArtPiece[]>([]);
  const [state, setState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [isAutoMode, setIsAutoMode] = useState(false);
  
  // Use number for setTimeout return type in browser environment
  const autoTimeoutRef = useRef<number | null>(null);

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
      setHistory(prev => [newPiece, ...prev].slice(0, 20)); // Keep last 20
      setState(GeneratorState.IDLE);
    } catch (error) {
      console.error("Generation failed", error);
      setState(GeneratorState.ERROR);
      // If error in auto mode, stop auto mode to prevent spamming errors
      setIsAutoMode(false);
    }
  }, [state]);

  // Handle Auto Mode Logic
  useEffect(() => {
    if (isAutoMode && state === GeneratorState.IDLE) {
      // Clear any existing timeout
      if (autoTimeoutRef.current) window.clearTimeout(autoTimeoutRef.current);

      // Set new timeout for next generation
      autoTimeoutRef.current = window.setTimeout(() => {
        generateNewPiece();
      }, AUTO_INTERVAL);
    }

    return () => {
      if (autoTimeoutRef.current) window.clearTimeout(autoTimeoutRef.current);
    };
  }, [isAutoMode, state, generateNewPiece]);

  const handleDownload = () => {
    if (!currentArt) return;
    const link = document.createElement('a');
    link.href = currentArt.url;
    link.download = `aether-neon-${currentArt.config.subject.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHistorySelect = (piece: ArtPiece) => {
    setIsAutoMode(false); // Stop auto if user interacts
    setCurrentArt(piece);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#111] text-white selection:bg-neutral-700">
      
      {/* Main Gallery Area */}
      <main className="flex-1 flex flex-col relative">
        <header className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-start md:items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div>
            <h1 className="font-serif text-3xl tracking-[0.2em] text-[#f5f5f5] drop-shadow-lg">AETHER & NEON</h1>
            <p className="text-[10px] text-neutral-400 tracking-[0.4em] uppercase mt-2 font-light border-l border-neutral-600 pl-3">Generative Minimalism</p>
          </div>
          <div className="hidden md:block text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
            {state === GeneratorState.GENERATING ? 'Dreaming...' : 'Connected'}
          </div>
        </header>

        <GalleryWall currentArt={currentArt} state={state} />
        
        <div className="relative z-20 pb-8 px-4 -mt-24 md:-mt-20">
            <ControlPanel 
              currentArt={currentArt}
              state={state}
              isAutoMode={isAutoMode}
              onToggleAuto={() => {
                if (!isAutoMode) generateNewPiece(); // Start immediately if turning on
                setIsAutoMode(!isAutoMode);
              }}
              onNext={generateNewPiece}
              onDownload={handleDownload}
            />
        </div>
      </main>

      {/* History Sidebar */}
      <aside className="w-full md:w-80 bg-[#0a0a0a] border-l border-white/5 p-6 flex flex-col h-[30vh] md:h-screen overflow-hidden z-30 shadow-2xl">
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

    </div>
  );
}

export default App;