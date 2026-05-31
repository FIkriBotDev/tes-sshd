import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

export default function HUD() {
  const { stats, activeMissionId, missions, settings, playerName } = useGameStore();
  const [showXPGain, setShowXPGain] = useState<number | null>(null);
  const [prevXP, setPrevXP] = useState(stats.xp);

  const activeMission = missions.find((m) => m.id === activeMissionId);
  const xpPercent = Math.round((stats.xp / stats.xpToNext) * 100);

  // Detect XP gain
  useEffect(() => {
    if (stats.xp !== prevXP && stats.xp > prevXP) {
      setShowXPGain(stats.xp - prevXP);
      setTimeout(() => setShowXPGain(null), 2000);
    }
    setPrevXP(stats.xp);
  }, [stats.xp]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none">

      {/* ── Top-left: Player info ─────────────────────────── */}
      <motion.div
        className="absolute top-4 left-4 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass-dark rounded-xl px-4 py-3 min-w-[200px]">
          {/* Name & level */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 font-semibold text-sm">{playerName}</span>
            <span className="text-[#00ff41] font-mono text-xs bg-[#00ff41]/10 px-2 py-0.5 rounded">
              Lv.{stats.level}
            </span>
          </div>

          {/* XP bar */}
          <div className="mb-1.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-white/40 text-xs">XP</span>
              <span className="text-white/40 text-xs">{stats.xp}/{stats.xpToNext}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00ff41] rounded-full"
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.5 }}
                style={{ boxShadow: '0 0 6px rgba(0,255,65,0.5)' }}
              />
            </div>
          </div>

          {/* Rank */}
          <div className="text-white/40 text-xs">{stats.reputationRank}</div>
        </div>
      </motion.div>

      {/* ── Top-right: Money & Reputation ────────────────── */}
      <motion.div
        className="absolute top-4 right-4 flex flex-col gap-2 items-end"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass-dark rounded-xl px-4 py-2 flex items-center gap-3">
          <span className="text-white/40 text-xs">Credits</span>
          <span className="text-[#ffb300] font-mono text-sm font-bold">
            ${stats.money.toLocaleString()}
          </span>
        </div>
        <div className="glass-dark rounded-xl px-4 py-2 flex items-center gap-3">
          <span className="text-white/40 text-xs">Rep</span>
          <span className="text-[#00aaff] font-mono text-sm font-bold">
            {stats.reputation}
          </span>
        </div>
        {settings.showFPS && <FPSCounter />}
      </motion.div>

      {/* ── Bottom-left: Active mission ───────────────────── */}
      <AnimatePresence>
        {activeMission && (
          <motion.div
            className="absolute bottom-6 left-4 max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="glass-dark rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffb300] animate-pulse" />
                <span className="text-[#ffb300] text-xs font-semibold uppercase tracking-wide">
                  Active Mission
                </span>
              </div>
              <div className="text-white/90 text-sm font-medium mb-2">{activeMission.title}</div>
              <div className="space-y-1">
                {activeMission.objectives
                  .filter((o) => !o.completed)
                  .slice(0, 2)
                  .map((obj) => (
                    <div key={obj.id} className="flex items-start gap-2">
                      <span className="text-white/30 text-xs mt-0.5">○</span>
                      <span className="text-white/60 text-xs leading-tight">{obj.description}</span>
                    </div>
                  ))}
                {activeMission.objectives.filter((o) => !o.completed).length > 2 && (
                  <span className="text-white/30 text-xs">
                    +{activeMission.objectives.filter((o) => !o.completed).length - 2} more...
                  </span>
                )}
              </div>
              {/* Progress */}
              <div className="mt-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffb300] rounded-full transition-all"
                    style={{
                      width: `${(activeMission.objectives.filter((o) => o.completed).length / activeMission.objectives.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── XP gain notification ──────────────────────────── */}
      <AnimatePresence>
        {showXPGain && (
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[#00ff41] font-mono text-lg font-bold"
              style={{ textShadow: '0 0 10px rgba(0,255,65,0.8)' }}>
              +{showXPGain} XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls hint (bottom center) ────────────────── */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-4 text-white/25 text-xs font-mono">
          <span>WASD Move</span>
          <span>·</span>
          <span>Shift Sprint</span>
          <span>·</span>
          <span>E Interact</span>
          <span>·</span>
          <span>ESC Menu</span>
        </div>
      </motion.div>

    </div>
  );
}

function FPSCounter() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    let id: number;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="glass-dark rounded-xl px-3 py-1.5">
      <span className="text-[#00ff41] font-mono text-xs">{fps} FPS</span>
    </div>
  );
}
