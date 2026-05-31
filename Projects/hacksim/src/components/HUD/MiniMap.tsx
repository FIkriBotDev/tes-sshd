import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

// District positions on the minimap (normalized 0-1)
const DISTRICT_DOTS = [
  { id: 'residential', label: 'RES', x: 0.2, y: 0.4, color: '#88cc44' },
  { id: 'shopping',    label: 'SHP', x: 0.45, y: 0.45, color: '#ffb300' },
  { id: 'university',  label: 'UNI', x: 0.3, y: 0.2, color: '#00aaff' },
  { id: 'business',    label: 'BIZ', x: 0.7, y: 0.4, color: '#cc88ff' },
  { id: 'industrial',  label: 'IND', x: 0.8, y: 0.6, color: '#888888' },
  { id: 'datacenter',  label: 'DAT', x: 0.75, y: 0.2, color: '#ff4444' },
  { id: 'underground', label: 'UND', x: 0.5, y: 0.75, color: '#ff8844' },
  { id: 'government',  label: 'GOV', x: 0.5, y: 0.2, color: '#44ffcc' },
  { id: 'techpark',    label: 'TCH', x: 0.65, y: 0.25, color: '#00ff41' },
];

// Key locations
const LOCATIONS = [
  { id: 'apartment',     label: 'Home',    x: 0.45, y: 0.5, icon: '⌂' },
  { id: 'cyber-cafe',    label: 'Cafe',    x: 0.5, y: 0.42, icon: '☕' },
  { id: 'computer-store',label: 'Store',   x: 0.55, y: 0.48, icon: '⚙' },
  { id: 'university',    label: 'Uni',     x: 0.3, y: 0.22, icon: '◈' },
];

export default function MiniMap() {
  const { currentLocation, unlockedDistricts } = useGameStore();
  const SIZE = 160;

  return (
    <motion.div
      className="absolute bottom-6 right-4 pointer-events-none"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{
          width: SIZE,
          height: SIZE,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Map background — simple city grid */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          {/* Roads */}
          <line x1={SIZE * 0.5} y1={0} x2={SIZE * 0.5} y2={SIZE} stroke="#444" strokeWidth={3} />
          <line x1={0} y1={SIZE * 0.5} x2={SIZE} y2={SIZE * 0.5} stroke="#444" strokeWidth={3} />
          <line x1={SIZE * 0.3} y1={0} x2={SIZE * 0.3} y2={SIZE} stroke="#333" strokeWidth={1.5} />
          <line x1={SIZE * 0.7} y1={0} x2={SIZE * 0.7} y2={SIZE} stroke="#333" strokeWidth={1.5} />
          <line x1={0} y1={SIZE * 0.3} x2={SIZE} y2={SIZE * 0.3} stroke="#333" strokeWidth={1.5} />
          <line x1={0} y1={SIZE * 0.7} x2={SIZE} y2={SIZE * 0.7} stroke="#333" strokeWidth={1.5} />

          {/* District zones */}
          {DISTRICT_DOTS.map((d) => {
            const unlocked = unlockedDistricts.includes(d.id as any);
            return (
              <circle
                key={d.id}
                cx={d.x * SIZE}
                cy={d.y * SIZE}
                r={8}
                fill={unlocked ? `${d.color}30` : '#ffffff08'}
                stroke={unlocked ? d.color : '#333'}
                strokeWidth={1}
              />
            );
          })}

          {/* Location markers */}
          {LOCATIONS.map((loc) => (
            <g key={loc.id}>
              <circle
                cx={loc.x * SIZE}
                cy={loc.y * SIZE}
                r={4}
                fill={currentLocation === loc.id ? '#00ff41' : '#ffffff40'}
              />
            </g>
          ))}
        </svg>

        {/* Player dot */}
        <div
          className="absolute w-3 h-3 rounded-full bg-[#00ff41] border-2 border-white"
          style={{
            left: SIZE * 0.45 - 6,
            top: SIZE * 0.5 - 6,
            boxShadow: '0 0 8px rgba(0,255,65,0.8)',
          }}
        />

        {/* Label */}
        <div className="absolute bottom-1.5 left-0 right-0 text-center">
          <span className="text-white/30 font-mono text-[9px]">NEO SATRIA CITY</span>
        </div>

        {/* Compass */}
        <div className="absolute top-1.5 right-2 text-white/30 font-mono text-[9px]">N</div>
      </div>
    </motion.div>
  );
}
