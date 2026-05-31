import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

const INTERACTION_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  'home-computer':    { label: 'E', icon: '💻', desc: 'Use Computer' },
  'npc-zara':         { label: 'E', icon: '💬', desc: 'Talk to Zara' },
  'npc-hana':         { label: 'E', icon: '💬', desc: 'Talk to Prof. Hana' },
  'npc-marcus':       { label: 'E', icon: '💬', desc: 'Talk to Marcus' },
  'npc-riko':         { label: 'E', icon: '💬', desc: 'Talk to Riko' },
  'npc-leo':          { label: 'E', icon: '💬', desc: 'Talk to Leo' },
  'cyber-cafe':       { label: 'E', icon: '☕', desc: 'Enter Cyber Cafe' },
  'computer-store':   { label: 'E', icon: '⚙', desc: 'Enter Computer Store' },
  'university':       { label: 'E', icon: '◈', desc: 'Enter University' },
  'uni-server':       { label: 'E', icon: '🖥', desc: 'Access Server Terminal' },
  'corp-terminal':    { label: 'E', icon: '🖥', desc: 'Access Corporate Terminal' },
};

export default function InteractionPrompt() {
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const info = nearbyInteractable ? INTERACTION_LABELS[nearbyInteractable] : null;

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-30"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <div className="glass-dark rounded-xl px-5 py-3 flex items-center gap-3">
            {/* Key badge */}
            <div className="w-8 h-8 rounded-lg border border-white/30 bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{info.label}</span>
            </div>
            {/* Icon + label */}
            <span className="text-lg">{info.icon}</span>
            <span className="text-white/90 font-medium text-sm">{info.desc}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
