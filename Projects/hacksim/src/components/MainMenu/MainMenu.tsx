import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import MenuParticles from './MenuParticles';
import NewGameModal from './NewGameModal';
import ImportSaveModal from './ImportSaveModal';

export default function MainMenu() {
  const { hasSave, loadGame, exportSave, setScreen } = useGameStore();
  const [showNewGame, setShowNewGame] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt to play background music
    const audio = new Audio('/audio/backsound-menu.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(() => {/* autoplay blocked — user interaction needed */});
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const buttons = [
    { id: 'new',      label: 'New Game',     icon: '⬡', action: () => setShowNewGame(true) },
    { id: 'continue', label: 'Continue',     icon: '▶', action: () => loadGame(), disabled: !hasSave },
    { id: 'export',   label: 'Export Save',  icon: '↓', action: () => exportSave(), disabled: !hasSave },
    { id: 'import',   label: 'Import Save',  icon: '↑', action: () => setShowImport(true) },
    { id: 'settings', label: 'Settings',     icon: '⚙', action: () => setScreen('settings') },
    { id: 'exit',     label: 'Exit',         icon: '✕', action: () => window.close() },
  ];

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden bg-[#0e1117]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient background — modern hacker workspace */}
      <div className="absolute inset-0">
        {/* Room gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e1117] via-[#111820] to-[#0a0f0a]" />

        {/* Desk surface glow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0d1a0d]/60 to-transparent" />

        {/* Monitor glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#00ff41]/3 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-[#00aaff]/5 blur-[80px]" />

        {/* Particles */}
        <MenuParticles />

        {/* Scan line overlay */}
        <div className="absolute inset-0 exos-scanline opacity-30 pointer-events-none" />
      </div>

      {/* Monitor frame */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[700px] max-w-[90vw]">
        {/* Monitor bezel */}
        <div className="relative rounded-2xl border border-[#1e2a1e] bg-[#0a0f0a]/90 shadow-2xl shadow-black/80 overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(0,255,65,0.06), 0 40px 80px rgba(0,0,0,0.8)' }}>

          {/* Monitor top bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0d150d] border-b border-[#1a2a1a]">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[#3a5a3a] text-xs font-mono">ExOS v4.2.1 — Main Terminal</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
              <span className="text-[#00ff41]/50 text-xs font-mono">ONLINE</span>
            </div>
          </div>

          {/* Screen content */}
          <div className="relative p-8 min-h-[420px] flex flex-col items-center justify-center">
            {/* Scanline on screen */}
            <div className="absolute inset-0 exos-scanline opacity-20 pointer-events-none" />

            {/* Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="text-[#00ff41]/40 font-mono text-xs tracking-[0.4em] mb-2 uppercase">
                Neo Satria City — 2047
              </div>
              <h1 className="font-mono font-bold text-[#00ff41] leading-none"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', textShadow: '0 0 30px rgba(0,255,65,0.4)' }}>
                HACKER LIFE
              </h1>
              <h2 className="font-mono font-light text-[#00ff41]/70 tracking-[0.3em] text-sm mt-1">
                SIMULATOR 3D
              </h2>
              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#00ff41]/30 to-transparent" />
            </motion.div>

            {/* Buttons */}
            <motion.div
              className="flex flex-col gap-2 w-full max-w-[280px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {buttons.map((btn, i) => (
                <motion.button
                  key={btn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  onMouseEnter={() => setHoveredBtn(btn.id)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className={`
                    relative flex items-center gap-3 px-4 py-2.5 rounded
                    font-mono text-sm transition-all duration-150
                    border
                    ${btn.disabled
                      ? 'border-[#1a2a1a] text-[#2a4a2a] cursor-not-allowed'
                      : hoveredBtn === btn.id
                        ? 'border-[#00ff41]/60 text-[#00ff41] bg-[#00ff41]/8'
                        : 'border-[#1e3a1e] text-[#00cc33] bg-transparent hover:border-[#00ff41]/40'
                    }
                  `}
                  style={hoveredBtn === btn.id && !btn.disabled ? {
                    boxShadow: '0 0 15px rgba(0,255,65,0.15), inset 0 0 15px rgba(0,255,65,0.05)'
                  } : {}}
                >
                  <span className="text-base w-5 text-center opacity-70">{btn.icon}</span>
                  <span>{btn.label}</span>
                  {hoveredBtn === btn.id && !btn.disabled && (
                    <motion.span
                      className="ml-auto text-[#00ff41]/50 text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      ▶
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Version */}
            <motion.div
              className="mt-6 text-[#2a4a2a] font-mono text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              v2.0.0 — Project Eclipse
            </motion.div>
          </div>
        </div>

        {/* Monitor stand */}
        <div className="flex justify-center">
          <div className="w-16 h-4 bg-[#0d150d] border-x border-b border-[#1a2a1a]" />
        </div>
        <div className="flex justify-center">
          <div className="w-32 h-2 bg-[#0d150d] border-x border-b border-[#1a2a1a] rounded-b-lg" />
        </div>
      </div>

      {/* Desk items (decorative) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-8 opacity-20">
        <div className="w-24 h-3 bg-[#1a2a1a] rounded" />
        <div className="w-8 h-8 bg-[#1a2a1a] rounded-sm" />
        <div className="w-4 h-12 bg-[#1a2a1a] rounded-sm" />
        <div className="w-24 h-3 bg-[#1a2a1a] rounded" />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewGame && <NewGameModal onClose={() => setShowNewGame(false)} />}
        {showImport && <ImportSaveModal onClose={() => setShowImport(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
