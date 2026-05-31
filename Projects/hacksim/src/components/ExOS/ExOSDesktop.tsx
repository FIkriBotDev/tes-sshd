import { motion } from 'framer-motion';
import type { ExOSApp } from './ExOS';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  setActiveApp: (app: ExOSApp) => void;
  unreadMail: number;
}

const DESKTOP_APPS: { id: ExOSApp; label: string; icon: string; color: string }[] = [
  { id: 'terminal',    label: 'Terminal',    icon: '>_',  color: '#00ff41' },
  { id: 'mail',        label: 'Mail',        icon: '✉',   color: '#00aaff' },
  { id: 'missions',    label: 'Missions',    icon: '◈',   color: '#ffb300' },
  { id: 'scanner',     label: 'Scanner',     icon: '◎',   color: '#00ff41' },
  { id: 'inventory',   label: 'Inventory',   icon: '▣',   color: '#cc88ff' },
  { id: 'marketplace', label: 'Marketplace', icon: '◆',   color: '#ff8844' },
  { id: 'research',    label: 'Research',    icon: '◉',   color: '#44ffcc' },
  { id: 'status',      label: 'Status',      icon: '◐',   color: '#88ff44' },
];

export default function ExOSDesktop({ setActiveApp, unreadMail }: Props) {
  const { playerName, stats, story } = useGameStore();

  return (
    <motion.div
      className="h-full flex flex-col p-6 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Welcome header */}
      <div className="mb-6">
        <div className="text-[#3a6a3a] font-mono text-xs mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h2 className="text-[#00ff41] font-mono text-xl font-bold">
          Welcome back, {playerName}
        </h2>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-[#6aaa6a] font-mono text-xs">
            Level {stats.level} · {stats.reputationRank}
          </span>
          <span className="text-[#3a6a3a] font-mono text-xs">|</span>
          <span className="text-[#6aaa6a] font-mono text-xs">
            Chapter: {story.currentChapter.toUpperCase()}
          </span>
          {unreadMail > 0 && (
            <>
              <span className="text-[#3a6a3a] font-mono text-xs">|</span>
              <span className="text-[#ff4444] font-mono text-xs animate-pulse">
                {unreadMail} unread message{unreadMail > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* App grid */}
      <div className="grid grid-cols-4 gap-3 max-w-2xl">
        {DESKTOP_APPS.map((app, i) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setActiveApp(app.id)}
            className="relative flex flex-col items-center gap-2 p-4 rounded-lg border border-[#1a3a1a] bg-[#0d1a0d]/50 hover:border-[#2a5a2a] hover:bg-[#0d1a0d] transition-all group"
          >
            {app.id === 'mail' && unreadMail > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#ff3333] text-white text-[9px] flex items-center justify-center font-bold">
                {unreadMail}
              </span>
            )}
            <span
              className="text-2xl font-mono transition-all group-hover:scale-110"
              style={{ color: app.color, textShadow: `0 0 10px ${app.color}40` }}
            >
              {app.icon}
            </span>
            <span className="text-[#6aaa6a] font-mono text-xs group-hover:text-[#00ff41] transition-colors">
              {app.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-3 gap-3 max-w-2xl">
        <StatCard label="Credits" value={`$${stats.money.toLocaleString()}`} color="#ffb300" />
        <StatCard label="XP" value={`${stats.xp} / ${stats.xpToNext}`} color="#00ff41" />
        <StatCard label="Reputation" value={`${stats.reputation} pts`} color="#00aaff" />
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded border border-[#1a3a1a] bg-[#0d1a0d]/50">
      <div className="text-[#3a6a3a] font-mono text-xs mb-1">{label}</div>
      <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
