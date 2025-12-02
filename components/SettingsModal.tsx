
import React, { useState, useEffect } from 'react';
import { XMarkIcon, KeyIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isHighContrast }) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    const storedKey = localStorage.getItem('aether_notion_key');
    const storedDb = localStorage.getItem('aether_notion_db');
    if (storedKey) setApiKey(storedKey);
    if (storedDb) setDatabaseId(storedDb);
  }, []);

  const handleSave = () => {
    localStorage.setItem('aether_notion_key', apiKey);
    localStorage.setItem('aether_notion_db', databaseId);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  };

  if (!isOpen) return null;

  const bgClass = isHighContrast ? 'bg-black border-2 border-white' : 'bg-[#1a1a1a] border border-white/10 shadow-2xl';
  const textClass = isHighContrast ? 'text-white' : 'text-neutral-200';
  const inputClass = isHighContrast 
    ? 'bg-white text-black border-black' 
    : 'bg-[#0a0a0a] border-white/10 text-neutral-300 focus:border-white/30';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-xl p-6 relative ${bgClass} ${textClass}`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="font-serif text-2xl mb-6 tracking-wide">Configuration</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-sm tracking-wider uppercase opacity-70 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Notion Integration
            </h3>
            <p className="text-xs opacity-50 mb-4">
              Push your generated art metadata to a Notion Database. 
              <br />
              Note: Images are not uploaded due to API limitations.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1 opacity-70">Integration Secret Key</label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="secret_..."
                    className={`w-full pl-9 pr-4 py-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/50 ${inputClass}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1 opacity-70">Database ID</label>
                <div className="relative">
                  <TableCellsIcon className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
                  <input 
                    type="text" 
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                    placeholder="32 character ID"
                    className={`w-full pl-9 pr-4 py-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/50 ${inputClass}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${status === 'saved' ? 'bg-green-500 text-white' : (isHighContrast ? 'bg-white text-black hover:bg-neutral-200' : 'bg-blue-600 text-white hover:bg-blue-500')}`}
          >
            {status === 'saved' ? 'Saved' : 'Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
};
