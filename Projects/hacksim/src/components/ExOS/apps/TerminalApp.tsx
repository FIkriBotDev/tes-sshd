import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import { processCommand } from '../../../utils/terminalCommands';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
}

const BOOT_LINES: TerminalLine[] = [
  { type: 'system', text: 'ExOS Terminal v4.2.1 — Secure Shell' },
  { type: 'system', text: 'Connected to: neo-satria-local-net' },
  { type: 'system', text: 'Encryption: AES-256 [ACTIVE]' },
  { type: 'system', text: '─────────────────────────────────────' },
  { type: 'output', text: 'Type "help" for available commands.' },
  { type: 'output', text: '' },
];

export default function TerminalApp() {
  const [lines, setLines] = useState<TerminalLine[]>(BOOT_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const store = useGameStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    // Add input line
    addLines([{ type: 'input', text: `operator@neo-satria:~$ ${cmd}` }]);
    setHistory((h) => [cmd, ...h.slice(0, 49)]);
    setHistoryIdx(-1);
    setInput('');
    setIsProcessing(true);

    // Process command
    const result = await processCommand(cmd, store);

    // Handle clear signal
    if (result.some((l) => l.text === '__CLEAR__')) {
      setLines(BOOT_LINES);
    } else {
      addLines(result);
    }

    setIsProcessing(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':   return 'text-[#00ff41]';
      case 'output':  return 'text-[#c8ffc8]';
      case 'error':   return 'text-[#ff4444]';
      case 'success': return 'text-[#44ff88]';
      case 'system':  return 'text-[#3a6a3a]';
    }
  };

  return (
    <motion.div
      className="h-full flex flex-col bg-[#0a0f0a] font-mono text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {lines.map((line, i) => (
          <div key={i} className={`${lineColor(line.type)} leading-5 whitespace-pre-wrap break-all`}>
            {line.text}
          </div>
        ))}
        {isProcessing && (
          <div className="text-[#00ff41]/60 animate-pulse">Processing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-[#1a3a1a] bg-[#0d1a0d]">
        <span className="text-[#00ff41]/70 shrink-0">operator@neo-satria:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className="flex-1 bg-transparent text-[#00ff41] outline-none caret-[#00ff41] placeholder:text-[#2a4a2a]"
          placeholder="type a command..."
          autoComplete="off"
          spellCheck={false}
        />
        <span className="text-[#00ff41] animate-[blink_1s_step-end_infinite]">█</span>
      </form>
    </motion.div>
  );
}
