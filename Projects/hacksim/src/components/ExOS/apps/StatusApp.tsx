import { motion } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import type { SkillTree } from '../../../types';
import { formatPlaytime } from '../../../utils/saveSystem';

const SKILL_LABELS: Record<keyof SkillTree, string> = {
  networking:       'Networking',
  programming:      'Programming',
  research:         'Research',
  osint:            'OSINT',
  cryptography:     'Cryptography',
  digitalForensics: 'Digital Forensics',
  automation:       'Automation',
  socialEngineering:'Social Engineering',
};

const SKILL_COLORS: Record<keyof SkillTree, string> = {
  networking:       '#00ff41',
  programming:      '#00aaff',
  research:         '#44ffcc',
  osint:            '#ffb300',
  cryptography:     '#cc88ff',
  digitalForensics: '#ff8844',
  automation:       '#88ff44',
  socialEngineering:'#ff44aa',
};

const CHAPTER_NAMES: Record<string, string> = {
  ch1:  'Chapter 1 — The Missing Packet',
  ch2:  'Chapter 2 — Project Eclipse',
  ch3:  'Chapter 3 — Ghost Network',
  ch4:  'Chapter 4 — The Watchers',
  ch5:  'Chapter 5 — The Seven Architects',
  ch6:  'Chapter 6 — Digital Shadows',
  ch7:  'Chapter 7 — The Vault',
  ch8:  'Chapter 8 — Revelation',
  ch9:  'Chapter 9 — Eclipse Awakens',
  ch10: 'Final Chapter — The Last Node',
};

export default function StatusApp() {
  const { playerName, stats, skills, hardware, story, playtime, upgradeSkill } = useGameStore();
  const money = stats.money;

  const xpPercent = Math.round((stats.xp / stats.xpToNext) * 100);

  return (
    <motion.div
      className="h-full overflow-y-auto p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-2xl space-y-6">

        {/* ── Operator Profile ─────────────────────────────── */}
        <Section title="OPERATOR PROFILE">
          <div className="grid grid-cols-2 gap-4">
            <StatRow label="Name"       value={playerName} />
            <StatRow label="Level"      value={String(stats.level)} color="#00ff41" />
            <StatRow label="Credits"    value={`$${stats.money.toLocaleString()}`} color="#ffb300" />
            <StatRow label="Reputation" value={`${stats.reputation} pts`} color="#00aaff" />
            <StatRow label="Rank"       value={stats.reputationRank} color="#cc88ff" />
            <StatRow label="Playtime"   value={formatPlaytime(playtime)} />
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-[#3a6a3a] font-mono text-xs">Experience</span>
              <span className="text-[#00ff41] font-mono text-xs">{stats.xp} / {stats.xpToNext} XP</span>
            </div>
            <div className="h-2 bg-[#0d1a0d] border border-[#1a3a1a] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00ff41] rounded-full"
                style={{ boxShadow: '0 0 6px rgba(0,255,65,0.5)' }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Reputation bar */}
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-[#3a6a3a] font-mono text-xs">Reputation</span>
              <span className="text-[#00aaff] font-mono text-xs">{stats.reputation} / 1000</span>
            </div>
            <div className="h-2 bg-[#0d1a0d] border border-[#1a3a1a] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00aaff] rounded-full"
                style={{ boxShadow: '0 0 6px rgba(0,170,255,0.5)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.reputation / 1000) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </Section>

        {/* ── Story Progress ───────────────────────────────── */}
        <Section title="STORY PROGRESS">
          <div className="mb-2">
            <span className="text-[#3a6a3a] font-mono text-xs">Current: </span>
            <span className="text-[#00ff41] font-mono text-xs">
              {CHAPTER_NAMES[story.currentChapter] ?? story.currentChapter}
            </span>
          </div>
          <div className="space-y-1">
            {Object.entries(CHAPTER_NAMES).map(([id, name]) => {
              const done = story.completedChapters.includes(id as any);
              const current = story.currentChapter === id;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className={`font-mono text-xs ${done ? 'text-[#00ff41]' : current ? 'text-[#ffb300]' : 'text-[#1a3a1a]'}`}>
                    {done ? '✓' : current ? '▶' : '○'}
                  </span>
                  <span className={`font-mono text-xs ${done ? 'text-[#3a6a3a]' : current ? 'text-[#ffb300]' : 'text-[#1a3a1a]'}`}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Skill Tree ───────────────────────────────────── */}
        <Section title="SKILL TREE">
          <p className="text-[#3a6a3a] font-mono text-xs mb-4">
            Upgrade cost: Level × $500. Click to upgrade.
          </p>
          <div className="space-y-3">
            {(Object.keys(SKILL_LABELS) as (keyof SkillTree)[]).map((skill) => {
              const level = skills[skill];
              const cost = (level + 1) * 500;
              const canUpgrade = level < 10 && money >= cost;
              return (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-[#3a6a3a] font-mono text-xs w-36 shrink-0">
                    {SKILL_LABELS[skill]}
                  </span>
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-2 rounded-sm"
                        style={{
                          background: i < level
                            ? SKILL_COLORS[skill]
                            : '#1a3a1a',
                          boxShadow: i < level ? `0 0 4px ${SKILL_COLORS[skill]}60` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[#3a6a3a] font-mono text-xs w-8 text-right">{level}/10</span>
                  {level < 10 && (
                    <button
                      onClick={() => upgradeSkill(skill)}
                      disabled={!canUpgrade}
                      className={`px-2 py-0.5 font-mono text-xs rounded border transition-colors ${
                        canUpgrade
                          ? 'border-[#00ff41]/30 text-[#00ff41] hover:bg-[#00ff41]/10'
                          : 'border-[#1a3a1a] text-[#1a3a1a] cursor-not-allowed'
                      }`}
                      title={canUpgrade ? `Upgrade for $${cost}` : `Need $${cost}`}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Hardware ─────────────────────────────────────── */}
        <Section title="HARDWARE">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'CPU',     item: hardware.cpu },
              { label: 'RAM',     item: hardware.ram },
              { label: 'SSD',     item: hardware.ssd },
              { label: 'GPU',     item: hardware.gpu },
              { label: 'Monitor', item: hardware.monitor },
              { label: 'Router',  item: hardware.router },
            ].map(({ label, item }) => (
              <div key={label} className="p-3 rounded border border-[#1a3a1a] bg-[#0d1a0d]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#3a6a3a] font-mono text-xs">{label}</span>
                  <TierBadge tier={item.tier} />
                </div>
                <div className="text-[#6aaa6a] font-mono text-xs font-bold">{item.name}</div>
                <div className="text-[#2a4a2a] font-mono text-xs mt-1">{item.bonus}</div>
              </div>
            ))}
            {hardware.serverRack && (
              <div className="p-3 rounded border border-[#1a3a1a] bg-[#0d1a0d]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#3a6a3a] font-mono text-xs">Server Rack</span>
                  <TierBadge tier={hardware.serverRack.tier} />
                </div>
                <div className="text-[#6aaa6a] font-mono text-xs font-bold">{hardware.serverRack.name}</div>
              </div>
            )}
            {hardware.aiAssistant && (
              <div className="p-3 rounded border border-[#cc88ff]/30 bg-[#cc88ff]/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#3a6a3a] font-mono text-xs">AI Assistant</span>
                  <TierBadge tier={hardware.aiAssistant.tier} />
                </div>
                <div className="text-[#cc88ff] font-mono text-xs font-bold">{hardware.aiAssistant.name}</div>
              </div>
            )}
          </div>
        </Section>

      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[#3a6a3a] font-mono text-xs uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-[#1a3a1a]" />
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, color = '#6aaa6a' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[#1a3a1a]/50">
      <span className="text-[#3a6a3a] font-mono text-xs">{label}</span>
      <span className="font-mono text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: number }) {
  const colors = ['', '#6aaa6a', '#00aaff', '#ffb300', '#cc88ff', '#ff44aa'];
  return (
    <span className="font-mono text-xs px-1.5 py-0.5 rounded border" style={{
      color: colors[tier] ?? '#6aaa6a',
      borderColor: `${colors[tier] ?? '#6aaa6a'}40`,
      background: `${colors[tier] ?? '#6aaa6a'}10`,
    }}>
      T{tier}
    </span>
  );
}
