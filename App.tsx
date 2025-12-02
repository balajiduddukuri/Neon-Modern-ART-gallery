
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryWall } from './components/GalleryWall';
import { ControlPanel } from './components/ControlPanel';
import { SettingsModal } from './components/SettingsModal';
import { ArtPiece, GeneratorState, ViewMode } from './types';
import { generateRandomConfig, constructPrompt } from './services/promptService';
import { generateArt } from './services/geminiService';
import { addWatermark } from './services/imageService';
import { pushToNotion } from './services/notionService';
import { playSuccessSound, triggerHaptic } from './services/a11yService';
import { MagnifyingGlassIcon, ArchiveBoxIcon, HeartIcon } from '@heroicons/react/24/outline';

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
  const [favorites, setFavorites] = useState<ArtPiece[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ArtPiece[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'favorites'>('history');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const autoTimeoutRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initialize Favorites from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aether_neon_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  }, []);

  // Filter History/Favorites based on Search & Tab
  useEffect(() => {
    const listToFilter = sidebarTab === 'history' ? history : favorites;
    
    if (!searchQuery.trim()) {
      setFilteredHistory(listToFilter);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredHistory(listToFilter.filter(p => 
        p.config.subject.toLowerCase().includes(query) || 
        p.config.color.toLowerCase().includes(query) ||
        p.config.feature.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, history, favorites, sidebarTab]);

  const generateNewPiece = useCallback(async () => {
    if (state === GeneratorState.GENERATING) return;

    setState(GeneratorState.GENERATING);
    const config = generateRandomConfig();
    const prompt = constructPrompt(config);

    try {
      const imageData = await generateArt(prompt);
      
      // Apply Watermark
      const watermarkedImage = await addWatermark(imageData);

      const newPiece: ArtPiece = {
        id: crypto.randomUUID(),
        url: watermarkedImage,
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

  const handleToggleFavorite = useCallback((art: ArtPiece | null = currentArt) => {
    if (!art) return;
    
    setFavorites(prev => {
      const exists = prev.some(f => f.id === art.id);
      let newFavorites;
      if (exists) {
        newFavorites = prev.filter(f => f.id !== art.id);
      } else {
        newFavorites = [art, ...prev];
      }
      
      localStorage.setItem('aether_neon_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, [currentArt]);

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

  const handlePushToNotion = async (): Promise<boolean> => {
    if (!currentArt) return false;
    const apiKey = localStorage.getItem('aether_notion_key');
    const databaseId = localStorage.getItem('aether_notion_db');

    if (!apiKey || !databaseId) {
      setIsSettingsOpen(true);
      return false;
    }

    try {
      await pushToNotion(currentArt, { apiKey, databaseId });
      return true;
    } catch (e) {
      console.error("Notion Push Failed", e);
      alert("Failed to push to Notion. Check console for CORS or credential errors.");
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

  const isCurrentFavorite = currentArt ? favorites.some(f => f.id === currentArt.id) : false;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${bgColor} ${textColor} selection:bg-yellow-500 selection:text-black font-sans`}>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isHighContrast={isHighContrast}
      />

      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] bg-yellow-400 text-black px-4 py-2 font-bold rounded-md ring-4 ring-black"
      >
        Skip to content
      </a>

      {/* Main Area */}
      <main id="main-content" className={`flex-1 flex flex-col relative transition-all duration-500 ${viewMode !== 'single' ? 'md:w-full' : ''}`} role="main">
        
        {/* Header */}
        <header className={`fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center transition-all duration-300 ${isHighContrast ? 'bg-black border-b-2 border-white' : (viewMode !== 'single' ? 'bg-[#111]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent pointer-events-none')}`}>
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
                  <GalleryWall 
                    currentArt={currentArt} 
                    state={state} 
                    className="flex-1" 
                    isHighContrast={isHighContrast}
                    isFavorite={isCurrentFavorite}
                    onToggleFavorite={() => handleToggleFavorite()}
                  />
                  {/* Floating Controls */}
                  <div className="relative z-40 pb-8 px-4 -mt-24 md:-mt-20 pointer-events-auto">
                    <ControlPanel 
                      currentArt={currentArt}
                      state={state}
                      isAutoMode={isAutoMode}
                      viewMode={viewMode}
                      isHighContrast={isHighContrast}
                      isFavorite={isCurrentFavorite}
                      onToggleAuto={() => {
                        if (!isAutoMode) generateNewPiece();
                        setIsAutoMode(!isAutoMode);
                      }}
                      onNext={generateNewPiece}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      onToggleViewMode={() => setViewMode('infinite')}
                      onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
                      onToggleFavorite={() => handleToggleFavorite()}
                      onSwitchToFavorites={() => setViewMode('favorites')}
                      onOpenSettings={() => setIsSettingsOpen(true)}
                      onPushToNotion={handlePushToNotion}
                    />
                  </div>
               </div>
            )}

            {/* INFINITE & FAVORITES GRID VIEW */}
            {(viewMode === 'infinite' || viewMode === 'favorites') && (
              <div className="w-full flex flex-col items-center gap-12 py-10 px-4 md:px-8">
                 
                 {/* Title for Favorites */}
                 {viewMode === 'favorites' && (
                    <div className="w-full max-w-7xl mb-8 flex items-center gap-4">
                       <HeartIcon className="w-8 h-8 text-red-500" />
                       <h2 className={`font-serif text-3xl tracking-widest ${isHighContrast ? 'text-yellow-300' : 'text-white'}`}>COLLECTION</h2>
                    </div>
                 )}

                 {/* Empty States */}
                 {viewMode === 'infinite' && history.length === 0 && !currentArt && (
                   <div className="h-[50vh] flex items-center justify-center">
                      <p className={`font-serif tracking-widest ${isHighContrast ? 'text-yellow-300' : 'text-neutral-500'}`}>Start the generator...</p>
                   </div>
                 )}

                 {viewMode === 'favorites' && favorites.length === 0 && (
                   <div className="h-[50vh] flex flex-col items-center justify-center text-center">
                      <HeartIcon className="w-16 h-16 opacity-20 mb-4" />
                      <p className={`font-serif tracking-widest ${isHighContrast ? 'text-yellow-300' : 'text-neutral-500'}`}>No favorites yet.</p>
                      <button onClick={() => setViewMode('single')} className="mt-4 text-xs underline opacity-50 hover:opacity-100">Go explore</button>
                   </div>
                 )}
                 
                 {/* Grid Layout */}
                 <div className="w-full max-w-[1600px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                     {(viewMode === 'infinite' ? history : favorites).map((art) => (
                        <article key={art.id} className="w-full flex flex-col group animate-in fade-in slide-in-from-bottom-10 duration-700">
                           <div className={`relative w-full aspect-[3/4] ${isHighContrast ? 'border-4 border-white' : 'shadow-2xl'}`}>
                             <GalleryWall 
                                currentArt={art} 
                                state={GeneratorState.IDLE} 
                                className="w-full h-full" 
                                isHighContrast={isHighContrast} 
                                isFavorite={favorites.some(f => f.id === art.id)}
                                onToggleFavorite={() => handleToggleFavorite(art)}
                                minimal={true} // Use minimal style for grid
                              />
                           </div>
                           <div className={`mt-4 flex justify-between items-start font-serif text-xs tracking-widest uppercase ${isHighContrast ? 'text-white' : 'text-neutral-500'}`}>
                              <span className="opacity-80 group-hover:opacity-100 transition-opacity">{art.config.subject}</span>
                              <span className="opacity-40">{new Date(art.timestamp).toLocaleDateString()}</span>
                           </div>
                        </article>
                     ))}
                 </div>

                 {viewMode === 'infinite' && (
                    <div ref={loadMoreRef} className="h-32 w-full flex items-center justify-center mt-12">
                        {state === GeneratorState.GENERATING && (
                          <div className="flex flex-col items-center gap-4 opacity-50" role="status">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                            <span className="sr-only">Loading more art</span>
                          </div>
                        )}
                    </div>
                 )}

                 {/* Sticky Controls at Bottom for Grid Views */}
                 <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
                    <ControlPanel 
                        currentArt={currentArt} // Keeps context of "active" generation even in grid
                        state={state}
                        isAutoMode={false} 
                        viewMode={viewMode}
                        isHighContrast={isHighContrast}
                        onToggleAuto={() => {}} 
                        onNext={generateNewPiece} // Allows generating while in grid view
                        onDownload={() => {}} // Download disabled in grid generic context
                        onShare={() => Promise.resolve(false)}
                        onToggleViewMode={() => setViewMode(viewMode === 'infinite' ? 'single' : 'infinite')}
                        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
                        onSwitchToFavorites={() => setViewMode(viewMode === 'favorites' ? 'single' : 'favorites')}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onPushToNotion={handlePushToNotion}
                      />
                 </div>
              </div>
            )}
        </div>
      </main>

      {/* Sidebar - Only visible in Single View */}
      {viewMode === 'single' && (
        <aside 
          className={`w-full md:w-80 border-l p-6 flex flex-col h-[30vh] md:h-screen overflow-hidden z-30 transition-all duration-500 ${isHighContrast ? 'bg-black border-white' : 'bg-[#0a0a0a] border-white/5 shadow-2xl'}`}
          aria-label="Sidebar"
        >
          {/* Sidebar Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-2">
             <button 
                onClick={() => setSidebarTab('history')}
                className={`flex items-center gap-2 pb-2 -mb-2.5 border-b-2 transition-all ${sidebarTab === 'history' ? (isHighContrast ? 'border-yellow-400 text-yellow-400' : 'border-white text-white') : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
             >
                <ArchiveBoxIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Archives</span>
             </button>
             <button 
                onClick={() => setSidebarTab('favorites')}
                className={`flex items-center gap-2 pb-2 -mb-2.5 border-b-2 transition-all ${sidebarTab === 'favorites' ? (isHighContrast ? 'border-yellow-400 text-yellow-400' : 'border-white text-white') : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
             >
                <HeartIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Favorites</span>
             </button>
          </div>
          
          <div className="mb-4">
             {/* Search Bar */}
             <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isHighContrast ? 'text-black' : 'text-neutral-500'}`}>
                   <MagnifyingGlassIcon className="h-4 w-4" />
                </div>
                <input 
                  type="search"
                  placeholder={`Search ${sidebarTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    isHighContrast 
                      ? 'bg-white text-black placeholder-gray-600 border border-transparent' 
                      : 'bg-[#1a1a1a] text-neutral-200 placeholder-neutral-600 border border-white/5 hover:border-white/10'
                  }`}
                  aria-label={`Search ${sidebarTab}`}
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {filteredHistory.length === 0 && (
              <div className={`h-full flex flex-col items-center justify-center opacity-50 ${isHighContrast ? 'text-white' : 'text-neutral-600'}`}>
                <span className="font-serif italic text-sm">
                  {sidebarTab === 'favorites' ? "No favorites saved" : (history.length === 0 ? "Silence" : "No matches")}
                </span>
              </div>
            )}
            
            <ul className="space-y-4">
              {filteredHistory.map((piece) => (
                <li key={piece.id}>
                  <div className="group relative">
                    <button 
                      onClick={() => handleHistorySelect(piece)}
                      className={`w-full flex items-center gap-4 p-3 rounded-sm transition-all duration-300 border ${
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
                    
                    {/* Quick Favorite Action in Sidebar */}
                    <button 
                       onClick={(e) => { e.stopPropagation(); handleToggleFavorite(piece); }}
                       className={`absolute top-2 right-2 p-1.5 rounded-full transition-opacity ${
                          favorites.some(f => f.id === piece.id) 
                            ? 'opacity-100 text-red-500 bg-white/10' 
                            : 'opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white bg-black/50'
                       }`}
                       aria-label="Toggle favorite"
                    >
                       {favorites.some(f => f.id === piece.id) ? <HeartIcon className="w-3 h-3 fill-current" /> : <HeartIcon className="w-3 h-3" />}
                    </button>
                  </div>
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
