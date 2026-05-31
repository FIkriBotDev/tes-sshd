import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  onClose: () => void;
}

export default function ImportSaveModal({ onClose }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const importSave = useGameStore((s) => s.importSave);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const ok = importSave(json);
      if (ok) {
        setStatus('success');
        setMessage('Save loaded successfully. Entering world...');
      } else {
        setStatus('error');
        setMessage('Invalid save file. Please check the file and try again.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="exos-window rounded-xl p-6 w-full max-w-sm mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-[#00aaff] animate-pulse" />
          <span className="font-mono text-[#00aaff] text-sm">IMPORT SAVE FILE</span>
        </div>
        <div className="h-px bg-[#1a3a1a] mb-5" />

        {status === 'idle' && (
          <>
            <p className="text-[#6aaa6a] font-mono text-xs mb-5 leading-relaxed">
              Select a .json save file exported from Hacker Life Simulator 3D.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 border border-dashed border-[#1a3a1a] text-[#3a6a3a] font-mono text-sm rounded hover:border-[#00aaff]/40 hover:text-[#00aaff]/70 transition-colors"
            >
              ↑ Select Save File
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          </>
        )}

        {status === 'success' && (
          <p className="text-[#00ff41] font-mono text-sm text-center py-4">{message}</p>
        )}

        {status === 'error' && (
          <>
            <p className="text-[#ff3333] font-mono text-sm mb-4">{message}</p>
            <button
              onClick={() => { setStatus('idle'); setMessage(''); }}
              className="w-full py-2 border border-[#1a3a1a] text-[#3a6a3a] font-mono text-sm rounded hover:border-[#2a5a2a] transition-colors"
            >
              Try Again
            </button>
          </>
        )}

        {status !== 'success' && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-[#2a4a2a] font-mono text-xs hover:text-[#3a6a3a] transition-colors"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
