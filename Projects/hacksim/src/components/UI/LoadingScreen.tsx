import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LOADING_LINES = [
  'Initializing ExOS v4.2.1...',
  'Loading Neo Satria City map data...',
  'Spawning NPC schedules...',
  'Connecting to local network...',
  'Mounting filesystem...',
  'Loading mission database...',
  'Calibrating network scanner...',
  'Decrypting story fragments...',
  'Warming up hardware systems...',
  'World ready. Welcome, Operator.',
];

export default function LoadingScreen() {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < LOADING_LINES.length) {
        setLines((prev) => [...prev, LOADING_LINES[i]]);
        setProgress(Math.round(((i + 1) / LOADING_LINES.length) * 100));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0a0f0a] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scanline */}
      <div className="absolute inset-0 exos-scanline opacity-20 pointer-events-none" />

      <div className="w-full max-w-lg px-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#00ff41]/30 font-mono text-xs tracking-widest mb-2">BOOTING</div>
          <div className="font-mono font-bold text-[#00ff41] text-2xl"
            style={{ textShadow: '0 0 20px rgba(0,255,65,0.4)' }}>
            HACKER LIFE SIMULATOR 3D
          </div>
        </div>

        {/* Terminal output */}
        <div className="bg-[#0d1a0d]/80 border border-[#1a3a1a] rounded-lg p-4 mb-4 h-48 overflow-hidden font-mono text-xs">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={i === lines.length - 1 ? 'text-[#00ff41]' : 'text-[#3a6a3a]'}
            >
              <span className="text-[#00ff41]/40 mr-2">{'>'}</span>
              {line}
            </motion.div>
          ))}
          {lines.length < LOADING_LINES.length && (
            <span className="text-[#00ff41] terminal-cursor" />
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#0d1a0d] border border-[#1a3a1a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#00ff41] rounded-full"
            style={{ boxShadow: '0 0 8px rgba(0,255,65,0.6)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[#2a4a2a] font-mono text-xs">Loading world...</span>
          <span className="text-[#00ff41]/50 font-mono text-xs">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}
