import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import type { Mission } from '../../../types';

const STATUS_COLOR: Record<string, string> = {
  available: 'text-[#00ff41]',
  active:    'text-[#ffb300]',
  completed: 'text-[#3a6a3a]',
  locked:    'text-[#1a3a1a]',
  failed:    'text-[#ff4444]',
};

const TYPE_LABEL: Record<string, string> = {
  story: 'STORY',
  side:  'SIDE',
  daily: 'DAILY',
};

export default function MissionsApp() {
  const { missions, activeMissionId, setActiveMission, stats } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'story' | 'side'>('all');
  const [selected, setSelected] = useState<Mission | null>(null);

  const filtered = missions.filter((m) => {
    if (filter !== 'all' && m.type !== filter) return false;
    return m.status !== 'locked' || (m.requiredLevel ?? 1) <= stats.level;
  });

  return (
    <motion.div
      className="h-full flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* List */}
      <div className="w-72 border-r border-[#1a3a1a] flex flex-col">
        <div className="px-4 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d]">
          <span className="text-[#00ff41] font-mono text-sm font-bold">MISSION BOARD</span>
        </div>
        {/* Filter tabs */}
        <div className="flex border-b border-[#1a3a1a]">
          {(['all', 'story', 'side'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 font-mono text-xs transition-colors ${
                filter === f ? 'text-[#00ff41] bg-[#00ff41]/10' : 'text-[#3a6a3a] hover:text-[#6aaa6a]'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className={`w-full text-left px-4 py-3 border-b border-[#1a3a1a]/50 transition-colors ${
                selected?.id === m.id ? 'bg-[#00ff41]/10' : 'hover:bg-[#0d1a0d]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#6aaa6a] font-mono text-xs font-bold truncate">{m.title}</span>
                <span className={`font-mono text-xs shrink-0 ml-2 ${STATUS_COLOR[m.status]}`}>
                  {m.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#2a4a2a] font-mono text-xs">{TYPE_LABEL[m.type]}</span>
                {m.chapter && <span className="text-[#2a4a2a] font-mono text-xs">CH.{m.chapter}</span>}
                {activeMissionId === m.id && (
                  <span className="text-[#ffb300] font-mono text-xs">● ACTIVE</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[#00ff41] font-mono text-base font-bold">{selected.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`font-mono text-xs ${STATUS_COLOR[selected.status]}`}>
                    {selected.status.toUpperCase()}
                  </span>
                  <span className="text-[#3a6a3a] font-mono text-xs">{TYPE_LABEL[selected.type]}</span>
                  {selected.chapter && (
                    <span className="text-[#3a6a3a] font-mono text-xs">Chapter {selected.chapter}</span>
                  )}
                </div>
              </div>
              {selected.status === 'available' && (
                <button
                  onClick={() => setActiveMission(activeMissionId === selected.id ? null : selected.id)}
                  className={`px-4 py-2 font-mono text-xs rounded border transition-colors ${
                    activeMissionId === selected.id
                      ? 'border-[#ff4444]/40 text-[#ff4444] hover:bg-[#ff4444]/10'
                      : 'border-[#00ff41]/40 text-[#00ff41] hover:bg-[#00ff41]/10'
                  }`}
                >
                  {activeMissionId === selected.id ? 'Deactivate' : 'Set Active'}
                </button>
              )}
            </div>

            <p className="text-[#c8ffc8] font-mono text-sm leading-relaxed mb-6">
              {selected.description}
            </p>

            {/* Objectives */}
            <div className="mb-6">
              <h3 className="text-[#3a6a3a] font-mono text-xs uppercase tracking-widest mb-3">Objectives</h3>
              <div className="space-y-2">
                {selected.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-start gap-3">
                    <span className={`font-mono text-sm mt-0.5 ${obj.completed ? 'text-[#00ff41]' : 'text-[#2a4a2a]'}`}>
                      {obj.completed ? '✓' : '○'}
                    </span>
                    <span className={`font-mono text-xs ${obj.completed ? 'text-[#3a6a3a] line-through' : 'text-[#6aaa6a]'}`}>
                      {obj.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards */}
            <div className="p-4 rounded border border-[#1a3a1a] bg-[#0d1a0d]/50">
              <h3 className="text-[#3a6a3a] font-mono text-xs uppercase tracking-widest mb-3">Rewards</h3>
              <div className="flex gap-6">
                <div>
                  <div className="text-[#2a4a2a] font-mono text-xs">XP</div>
                  <div className="text-[#00ff41] font-mono text-sm font-bold">+{selected.rewards.xp}</div>
                </div>
                <div>
                  <div className="text-[#2a4a2a] font-mono text-xs">Credits</div>
                  <div className="text-[#ffb300] font-mono text-sm font-bold">+${selected.rewards.money}</div>
                </div>
                <div>
                  <div className="text-[#2a4a2a] font-mono text-xs">Reputation</div>
                  <div className="text-[#00aaff] font-mono text-sm font-bold">+{selected.rewards.reputation}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-[#2a4a2a] font-mono text-sm">Select a mission to view details</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
