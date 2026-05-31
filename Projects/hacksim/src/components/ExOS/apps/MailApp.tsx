import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import type { MailMessage } from '../../../types';

export default function MailApp() {
  const { mail, markMailRead } = useGameStore();
  const [selected, setSelected] = useState<MailMessage | null>(null);

  const handleSelect = (msg: MailMessage) => {
    setSelected(msg);
    if (!msg.read) markMailRead(msg.id);
  };

  return (
    <motion.div
      className="h-full flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Mail list */}
      <div className="w-72 border-r border-[#1a3a1a] flex flex-col">
        <div className="px-4 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d]">
          <span className="text-[#00ff41] font-mono text-sm font-bold">INBOX</span>
          <span className="ml-2 text-[#3a6a3a] font-mono text-xs">
            ({mail.filter((m) => !m.read).length} unread)
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mail.map((msg) => (
            <button
              key={msg.id}
              onClick={() => handleSelect(msg)}
              className={`w-full text-left px-4 py-3 border-b border-[#1a3a1a]/50 transition-colors ${
                selected?.id === msg.id
                  ? 'bg-[#00ff41]/10 border-l-2 border-l-[#00ff41]'
                  : 'hover:bg-[#0d1a0d]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {!msg.read && <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] shrink-0" />}
                <span className={`font-mono text-xs truncate ${msg.read ? 'text-[#3a6a3a]' : 'text-[#00ff41]'}`}>
                  {msg.from}
                </span>
              </div>
              <div className={`font-mono text-xs truncate ${msg.read ? 'text-[#2a4a2a]' : 'text-[#6aaa6a]'}`}>
                {msg.subject}
              </div>
              <div className="text-[#1a3a1a] font-mono text-xs mt-1">
                {new Date(msg.timestamp).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mail content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 pb-4 border-b border-[#1a3a1a]">
                <h2 className="text-[#00ff41] font-mono text-base font-bold mb-2">{selected.subject}</h2>
                <div className="text-[#3a6a3a] font-mono text-xs space-y-1">
                  <div>From: <span className="text-[#6aaa6a]">{selected.from}</span></div>
                  <div>Date: <span className="text-[#6aaa6a]">{new Date(selected.timestamp).toLocaleString()}</span></div>
                </div>
              </div>
              <pre className="text-[#c8ffc8] font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {selected.body}
              </pre>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="h-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-[#2a4a2a] font-mono text-sm">Select a message to read</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
