import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import ExOSTaskbar from './ExOSTaskbar';
import ExOSDesktop from './ExOSDesktop';
import TerminalApp from './apps/TerminalApp';
import MailApp from './apps/MailApp';
import MissionsApp from './apps/MissionsApp';
import ScannerApp from './apps/ScannerApp';
import InventoryApp from './apps/InventoryApp';
import StatusApp from './apps/StatusApp';
import MarketplaceApp from './apps/MarketplaceApp';
import ResearchApp from './apps/ResearchApp';

export type ExOSApp =
  | 'desktop'
  | 'terminal'
  | 'mail'
  | 'missions'
  | 'scanner'
  | 'inventory'
  | 'status'
  | 'marketplace'
  | 'research';

export default function ExOS() {
  const [activeApp, setActiveApp] = useState<ExOSApp>('desktop');
  const setUsingComputer = useGameStore((s) => s.setUsingComputer);
  const playerName = useGameStore((s) => s.playerName);
  const unreadMail = useGameStore((s) => s.mail.filter((m) => !m.read).length);

  const handleClose = () => setUsingComputer(false);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col exos-window"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 exos-scanline pointer-events-none z-10 opacity-30" />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-[#0d1a0d] border-b border-[#1a3a1a]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button
              onClick={handleClose}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all"
              title="Exit ExOS"
            />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[#3a6a3a] font-mono text-xs">ExOS v4.2.1</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#00ff41]/60 font-mono text-xs">
            {playerName}@neo-satria
          </span>
          <ExOSClock />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
            <span className="text-[#00ff41]/50 font-mono text-xs">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="relative z-20 flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ExOSTaskbar activeApp={activeApp} setActiveApp={setActiveApp} unreadMail={unreadMail} />

        {/* App area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeApp === 'desktop'     && <ExOSDesktop key="desktop" setActiveApp={setActiveApp} unreadMail={unreadMail} />}
            {activeApp === 'terminal'    && <TerminalApp key="terminal" />}
            {activeApp === 'mail'        && <MailApp key="mail" />}
            {activeApp === 'missions'    && <MissionsApp key="missions" />}
            {activeApp === 'scanner'     && <ScannerApp key="scanner" />}
            {activeApp === 'inventory'   && <InventoryApp key="inventory" />}
            {activeApp === 'status'      && <StatusApp key="status" />}
            {activeApp === 'marketplace' && <MarketplaceApp key="marketplace" />}
            {activeApp === 'research'    && <ResearchApp key="research" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-1 bg-[#0d1a0d] border-t border-[#1a3a1a]">
        <span className="text-[#2a4a2a] font-mono text-xs">
          Press ESC to exit computer
        </span>
        <span className="text-[#2a4a2a] font-mono text-xs">
          Neo Satria City Network — Encrypted
        </span>
      </div>
    </motion.div>
  );
}

function ExOSClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-[#00ff41]/50 font-mono text-xs">{time}</span>;
}
