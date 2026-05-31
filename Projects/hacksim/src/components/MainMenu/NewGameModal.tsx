import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  onClose: () => void;
}

export default function NewGameModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const newGame = useGameStore((s) => s.newGame);

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your operator name.'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (trimmed.length > 20) { setError('Name must be 20 characters or less.'); return; }
    newGame(trimmed);
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
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
          <span className="font-mono text-[#00ff41] text-sm">NEW OPERATOR PROFILE</span>
        </div>

        <div className="h-px bg-[#1a3a1a] mb-5" />

        {/* Story intro */}
        <p className="text-[#6aaa6a] font-mono text-xs leading-relaxed mb-5">
          Neo Satria City, 2047.<br />
          You just moved into a small apartment.<br />
          An anonymous email is waiting in your inbox.<br />
          <br />
          <span className="text-[#00ff41]/70">What do they call you?</span>
        </p>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-[#3a6a3a] font-mono text-xs mb-2">
            OPERATOR NAME
          </label>
          <div className="flex items-center border border-[#1a3a1a] rounded bg-[#0d1a0d] focus-within:border-[#00ff41]/50 transition-colors">
            <span className="px-3 text-[#00ff41]/50 font-mono text-sm">{'>'}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); if (e.key === 'Escape') onClose(); }}
              placeholder="Enter name..."
              maxLength={20}
              autoFocus
              className="flex-1 bg-transparent text-[#00ff41] font-mono text-sm py-2.5 pr-3 outline-none placeholder:text-[#2a4a2a]"
            />
          </div>
          {error && (
            <p className="mt-1.5 text-[#ff3333] font-mono text-xs">{error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#1a3a1a] text-[#3a6a3a] font-mono text-sm rounded hover:border-[#2a5a2a] hover:text-[#4a8a4a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="flex-1 py-2 border border-[#00ff41]/40 text-[#00ff41] font-mono text-sm rounded hover:bg-[#00ff41]/10 hover:border-[#00ff41]/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={name.trim() ? { boxShadow: '0 0 10px rgba(0,255,65,0.1)' } : {}}
          >
            Initialize
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
