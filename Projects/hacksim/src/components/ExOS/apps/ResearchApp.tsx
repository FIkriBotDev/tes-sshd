import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';

interface ResearchEntry {
  id: string;
  title: string;
  category: 'network' | 'eclipse' | 'npc' | 'location' | 'tech';
  content: string;
  unlocked: boolean;
  requiredFlag?: string;
}

const RESEARCH_DB: ResearchEntry[] = [
  {
    id: 'r-exos',
    title: 'ExOS Operating System',
    category: 'tech',
    content: `ExOS is a fictional operating system used by operators in Neo Satria City.

Version: 4.2.1
Architecture: Monolithic kernel, modular userspace
Security: AES-256 encryption on all network traffic
Origin: Developed by an unknown collective, distributed freely

ExOS is designed for investigation and network analysis. Its terminal interface provides direct access to network tools, file systems, and communication channels.

Key features:
- Encrypted mail system
- Network scanner with node enumeration
- Integrated mission tracking
- Hardware monitoring
- Research database (this app)`,
    unlocked: true,
  },
  {
    id: 'r-neo-satria',
    title: 'Neo Satria City',
    category: 'location',
    content: `Neo Satria City is a modern metropolitan area with an estimated population of 25,000.

Districts:
- Residential District: Housing blocks, apartments, parks
- Shopping District: Commercial area, tech stores, cafes
- University District: Academic campus, research labs
- Business District: Corporate offices, financial center
- Industrial District: Warehouses, manufacturing
- Data Center Zone: Server infrastructure (restricted)
- Underground Market: Black market (access restricted)
- Government Complex: City administration (restricted)
- Technology Park: Startup hub, innovation center

The city has a modern, clean aesthetic. Public transport runs on schedule. Crime rate is officially low.

Unofficially — something is wrong.`,
    unlocked: true,
  },
  {
    id: 'r-project-eclipse',
    title: 'Project Eclipse — Fragment 1',
    category: 'eclipse',
    content: `CLASSIFICATION: UNKNOWN
SOURCE: Anonymous

"Project Eclipse is not a product. It is not a service. It is an experiment.

The city is the lab. The people are the subjects.

They have been watching network traffic for years. Mapping behavior. Building profiles. The data goes somewhere — somewhere that doesn't appear on any official network map.

I found three nodes. All with the same naming pattern: ECLIPSE-NODE-XX.

They are listening."

— Source: Recovered from encrypted drive`,
    unlocked: true,
    requiredFlag: 'met_zara',
  },
  {
    id: 'r-eclipse-node',
    title: 'ECLIPSE-NODE-03 Analysis',
    category: 'eclipse',
    content: `Node discovered during local network scan.

IP: 192.168.1.101
Hostname: ECLIPSE-NODE-03
Open ports: 22, 80, 443, 9999

Port 9999 is non-standard. No known service uses this port in standard configurations.

Traffic analysis shows encrypted packets leaving this node every 4 hours. Destination: unresolved subnet 10.0.eclipse.x

The "eclipse" subdomain does not exist in any public DNS registry.

This node is a relay. It is forwarding data to an unknown destination.

Next step: Trace the 10.0.eclipse subnet. Requires Networking skill level 3+.`,
    unlocked: true,
  },
  {
    id: 'r-zara',
    title: 'Contact: Zara Voss',
    category: 'npc',
    content: `Name: Zara Voss
Occupation: Independent programmer
Location: Cyber Cafe, Meridian Street, Shopping District

Zara is a skilled programmer who operates out of the Cyber Cafe. She appears to have prior knowledge of Project Eclipse and uses coded language ("the packet is missing") to identify trusted contacts.

She is cautious. She will not share information freely.

Known connections: Unknown. She has contacts in the underground tech community.

Trust level: Neutral → Friendly (after initial contact)

Note: She mentioned that "they" are watching. She seems genuinely afraid.`,
    unlocked: true,
    requiredFlag: 'met_zara',
  },
  {
    id: 'r-university',
    title: 'Neo Satria University',
    category: 'location',
    content: `Neo Satria University is the city's primary academic institution.

Departments:
- Computer Science & Engineering
- Network Systems Research
- Applied Cryptography Lab
- Data Science Institute

Notable staff:
- Professor Hana Reyes (Network Topology Research)
- Dr. Kenji Mori (Cryptography — currently on leave)
- Dr. Sarah Chen (AI Systems — MISSING)

The university's research network has been experiencing unusual activity. Professor Reyes reported missing research files.

The university's AI Systems lab was shut down 6 months ago. Official reason: "Funding reallocation." Unofficial reason: Unknown.`,
    unlocked: true,
  },
  {
    id: 'r-missing-scientists',
    title: 'Missing Persons — Scientists',
    category: 'eclipse',
    content: `CLASSIFIED INVESTIGATION NOTE

Three researchers from Neo Satria University have gone missing in the past year:

1. Dr. Sarah Chen — AI Systems researcher. Last seen: University campus. No official missing persons report filed.

2. Dr. Marcus Webb — Network infrastructure specialist. Resigned suddenly. Forwarding address: unknown.

3. Prof. Yuki Tanaka — Cryptography. Took "sabbatical." Has not been seen since.

All three were working on projects related to large-scale data collection and behavioral analysis.

All three had access to the university's restricted research network.

Pattern: They found something. Then they disappeared.

This is not a coincidence.`,
    unlocked: false,
    requiredFlag: 'found_eclipse_fragment',
  },
  {
    id: 'r-cyber-cafe',
    title: 'Meridian Cyber Cafe',
    category: 'location',
    content: `The Meridian Cyber Cafe is located on Meridian Street in the Shopping District.

It serves as an informal meeting point for the city's tech community. The cafe offers:
- High-speed workstations
- Private booths for sensitive work
- Encrypted local network (owner-operated)
- Coffee, energy drinks, snacks

The owner is known only as "Meridian." They do not ask questions.

The cafe is a safe space for people who need to work without being watched. Or so they believe.

Regular visitors include Zara Voss and several other programmers whose names are not publicly known.`,
    unlocked: true,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  network:  '#00ff41',
  eclipse:  '#ff4444',
  npc:      '#00aaff',
  location: '#ffb300',
  tech:     '#44ffcc',
};

const CATEGORY_LABELS: Record<string, string> = {
  network:  'Network',
  eclipse:  'Eclipse',
  npc:      'Contacts',
  location: 'Locations',
  tech:     'Technology',
};

export default function ResearchApp() {
  const { story } = useGameStore();
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ResearchEntry | null>(null);

  const isUnlocked = (entry: ResearchEntry) => {
    if (!entry.unlocked) return false;
    if (entry.requiredFlag && !story.flags[entry.requiredFlag]) return false;
    return true;
  };

  const entries = RESEARCH_DB.filter((e) => {
    if (filter !== 'all' && e.category !== filter) return false;
    return true;
  });

  const unlockedCount = RESEARCH_DB.filter(isUnlocked).length;

  return (
    <motion.div
      className="h-full flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Sidebar */}
      <div className="w-52 border-r border-[#1a3a1a] flex flex-col">
        <div className="px-4 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d]">
          <span className="text-[#00ff41] font-mono text-sm font-bold">RESEARCH LAB</span>
          <div className="text-[#3a6a3a] font-mono text-xs mt-0.5">
            {unlockedCount}/{RESEARCH_DB.length} entries
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setFilter('all')}
            className={`w-full text-left px-4 py-2 font-mono text-xs transition-colors ${
              filter === 'all' ? 'text-[#00ff41] bg-[#00ff41]/10' : 'text-[#3a6a3a] hover:text-[#6aaa6a]'
            }`}
          >
            All Entries
          </button>
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`w-full text-left px-4 py-2 font-mono text-xs transition-colors flex items-center gap-2 ${
                filter === cat ? 'bg-[#0d1a0d]' : 'hover:bg-[#0d1a0d]/50'
              }`}
              style={filter === cat ? { color: CATEGORY_COLORS[cat] } : { color: '#3a6a3a' }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry list */}
      <div className="w-64 border-r border-[#1a3a1a] flex flex-col">
        <div className="px-4 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d]">
          <span className="text-[#3a6a3a] font-mono text-xs">{entries.length} entries</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {entries.map((entry) => {
            const unlocked = isUnlocked(entry);
            return (
              <button
                key={entry.id}
                onClick={() => unlocked && setSelected(entry)}
                className={`w-full text-left px-4 py-3 border-b border-[#1a3a1a]/50 transition-colors ${
                  selected?.id === entry.id
                    ? 'bg-[#00ff41]/10'
                    : unlocked
                      ? 'hover:bg-[#0d1a0d]'
                      : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[entry.category] }}
                  />
                  <span className={`font-mono text-xs font-bold truncate ${unlocked ? 'text-[#6aaa6a]' : 'text-[#2a4a2a]'}`}>
                    {unlocked ? entry.title : '??? [LOCKED]'}
                  </span>
                </div>
                <span className="font-mono text-xs" style={{ color: CATEGORY_COLORS[entry.category] }}>
                  {CATEGORY_LABELS[entry.category]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[selected.category] }}
                />
                <span className="font-mono text-xs" style={{ color: CATEGORY_COLORS[selected.category] }}>
                  {CATEGORY_LABELS[selected.category].toUpperCase()}
                </span>
              </div>
              <h2 className="text-[#00ff41] font-mono text-base font-bold mb-4">{selected.title}</h2>
              <pre className="text-[#c8ffc8] font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </pre>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="h-full flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-[#1a3a1a] font-mono text-4xl mb-3">◉</span>
              <span className="text-[#2a4a2a] font-mono text-sm">Select an entry to read</span>
              <span className="text-[#1a3a1a] font-mono text-xs mt-1">
                Complete missions to unlock more entries
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
