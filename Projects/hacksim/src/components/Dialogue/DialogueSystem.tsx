import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { NPCS_DATA } from '../../data/npcs';
import type { DialogueLine } from '../../types';

export default function DialogueSystem() {
  const {
    activeDialogueNPC,
    setActiveDialogueNPC,
    setStoryFlag,
    addInventoryItem,
    setActiveMission,
    discoverNPC,
    addXP,
  } = useGameStore();

  const npc = NPCS_DATA.find((n) => n.id === activeDialogueNPC);
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentLine: DialogueLine | null = currentLineId
    ? npc?.dialogues.lines.find((l) => l.id === currentLineId) ?? null
    : null;

  const activeText = currentLine ? currentLine.text : npc?.dialogues.greeting ?? '';

  // Typewriter effect
  useEffect(() => {
    if (!activeText) return;
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const id = setInterval(() => {
      setDisplayedText(activeText.slice(0, i + 1));
      i++;
      if (i >= activeText.length) {
        clearInterval(id);
        setIsTyping(false);
      }
    }, 18);
    return () => clearInterval(id);
  }, [activeText]);

  // On open: discover NPC, give XP
  useEffect(() => {
    if (npc) {
      discoverNPC(npc.id);
      addXP(5);
    }
  }, [npc?.id]);

  const handleResponse = (response: { text: string; nextId?: string; endsDialogue?: boolean }) => {
    if (response.endsDialogue) {
      handleClose();
      return;
    }
    if (response.nextId) {
      const nextLine = npc?.dialogues.lines.find((l) => l.id === response.nextId);
      if (nextLine) {
        // Trigger side effects
        if (nextLine.triggersFlag) setStoryFlag(nextLine.triggersFlag, true);
        if (nextLine.givesItem) {
          addInventoryItem({
            id: nextLine.givesItem,
            name: 'Network Log',
            description: 'Suspicious network traffic logs from the university campus.',
            category: 'research-note',
            quantity: 1,
          });
        }
        if (nextLine.startsMission) {
          setActiveMission(nextLine.startsMission);
        }
        setCurrentLineId(response.nextId);
      }
    }
  };

  const handleClose = () => {
    setActiveDialogueNPC(null);
    setCurrentLineId(null);
  };

  const skipTyping = () => {
    if (isTyping) {
      setDisplayedText(activeText);
      setIsTyping(false);
    }
  };

  if (!npc) return null;

  const responses = currentLine?.responses ?? [
    { text: 'Tell me more.', nextId: npc.dialogues.lines[0]?.id },
    { text: 'Goodbye.', endsDialogue: true },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Dialogue box */}
      <motion.div
        className="relative pointer-events-auto mx-auto w-full max-w-3xl mb-8 px-4"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="glass-dark rounded-2xl overflow-hidden border border-white/10">
          {/* NPC name bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00aaff]/30 to-[#00ff41]/30 border border-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{npc.name[0]}</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{npc.name}</div>
                <div className="text-white/40 text-xs capitalize">{npc.occupation.replace('-', ' ')}</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/30 hover:text-white/60 transition-colors text-sm font-mono"
            >
              [ESC]
            </button>
          </div>

          {/* Dialogue text */}
          <div
            className="px-6 py-5 min-h-[80px] cursor-pointer"
            onClick={skipTyping}
          >
            <p className="text-white/90 text-sm leading-relaxed">
              {displayedText}
              {isTyping && <span className="animate-[blink_0.7s_step-end_infinite] text-white/60">▌</span>}
            </p>
          </div>

          {/* Response options */}
          <AnimatePresence>
            {!isTyping && (
              <motion.div
                className="px-6 pb-5 space-y-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {responses.map((resp, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleResponse(resp)}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 font-mono text-xs group-hover:text-[#00ff41] transition-colors">
                        {i + 1}.
                      </span>
                      <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                        {resp.text}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hint */}
        <div className="text-center mt-2">
          <span className="text-white/20 text-xs font-mono">Click text to skip · ESC to close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
