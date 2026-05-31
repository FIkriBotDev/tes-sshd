import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';

interface ScanNode {
  ip: string;
  hostname: string;
  status: 'online' | 'offline' | 'suspicious';
  ports: string;
  note?: string;
}

export default function ScannerApp() {
  const { hardware, skills, addXP } = useGameStore();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [nodes, setNodes] = useState<ScanNode[]>([]);
  const [selected, setSelected] = useState<ScanNode | null>(null);

  const BASE_NODES: ScanNode[] = [
    { ip: '192.168.1.1',   hostname: 'gateway.local',     status: 'online',     ports: '80, 443' },
    { ip: '192.168.1.100', hostname: 'localhost',          status: 'online',     ports: '22, 80' },
    { ip: '192.168.1.101', hostname: 'ECLIPSE-NODE-03',    status: 'suspicious', ports: '22, 80, 443, 9999', note: 'Unusual hostname. Port 9999 unrecognized.' },
  ];

  const startScan = async () => {
    setScanning(true);
    setProgress(0);
    setNodes([]);
    setSelected(null);

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 80 + Math.random() * 60));
      setProgress(Math.round((i / steps) * 100));
      if (i === 8)  setNodes([BASE_NODES[0]]);
      if (i === 14) setNodes([BASE_NODES[0], BASE_NODES[1]]);
      if (i === 18) setNodes(BASE_NODES);
    }

    addXP(20);
    setScanning(false);
  };

  const statusColor = (s: ScanNode['status']) => {
    if (s === 'online')     return 'text-[#00ff41]';
    if (s === 'suspicious') return 'text-[#ffb300]';
    return 'text-[#ff4444]';
  };

  return (
    <motion.div
      className="h-full flex flex-col p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[#00ff41] font-mono text-base font-bold">NETWORK SCANNER</h2>
          <p className="text-[#3a6a3a] font-mono text-xs mt-1">
            Router: {hardware.router.name} — Range: {hardware.router.tier * 10} nodes
          </p>
        </div>
        <button
          onClick={startScan}
          disabled={scanning}
          className="px-5 py-2 border border-[#00ff41]/40 text-[#00ff41] font-mono text-sm rounded hover:bg-[#00ff41]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {scanning ? 'Scanning...' : '▶ Start Scan'}
        </button>
      </div>

      {/* Progress */}
      {scanning && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-[#3a6a3a] font-mono text-xs">Scanning subnet 192.168.1.0/24...</span>
            <span className="text-[#00ff41] font-mono text-xs">{progress}%</span>
          </div>
          <div className="h-1 bg-[#0d1a0d] border border-[#1a3a1a] rounded overflow-hidden">
            <motion.div
              className="h-full bg-[#00ff41]"
              style={{ boxShadow: '0 0 6px rgba(0,255,65,0.6)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Node list */}
        <div className="w-80 flex flex-col">
          <div className="text-[#3a6a3a] font-mono text-xs uppercase tracking-widest mb-2">
            Discovered Nodes ({nodes.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {nodes.map((node) => (
              <motion.button
                key={node.ip}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelected(node)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selected?.ip === node.ip
                    ? 'border-[#00ff41]/40 bg-[#00ff41]/10'
                    : 'border-[#1a3a1a] bg-[#0d1a0d]/50 hover:border-[#2a5a2a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#6aaa6a] font-mono text-xs">{node.ip}</span>
                  <span className={`font-mono text-xs ${statusColor(node.status)}`}>
                    {node.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-[#3a6a3a] font-mono text-xs mt-1 truncate">{node.hostname}</div>
              </motion.button>
            ))}
            {nodes.length === 0 && !scanning && (
              <div className="text-[#2a4a2a] font-mono text-xs text-center py-8">
                Run a scan to discover network nodes
              </div>
            )}
          </div>
        </div>

        {/* Node detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <motion.div
              key={selected.ip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded border border-[#1a3a1a] bg-[#0d1a0d]/50 h-full"
            >
              <h3 className="text-[#00ff41] font-mono text-sm font-bold mb-4">Node Analysis</h3>
              <div className="space-y-3 font-mono text-xs">
                <Row label="IP Address" value={selected.ip} />
                <Row label="Hostname" value={selected.hostname} valueClass={selected.status === 'suspicious' ? 'text-[#ffb300]' : 'text-[#6aaa6a]'} />
                <Row label="Status" value={selected.status.toUpperCase()} valueClass={statusColor(selected.status)} />
                <Row label="Open Ports" value={selected.ports} />
              </div>
              {selected.note && (
                <div className="mt-4 p-3 rounded border border-[#ffb300]/30 bg-[#ffb300]/5">
                  <span className="text-[#ffb300] font-mono text-xs">⚠ {selected.note}</span>
                </div>
              )}
              {selected.status === 'suspicious' && (
                <div className="mt-4 p-3 rounded border border-[#00ff41]/20 bg-[#00ff41]/5">
                  <span className="text-[#00ff41] font-mono text-xs">
                    This node may be related to Project Eclipse. Use Terminal: analyze {selected.ip}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-[#2a4a2a] font-mono text-xs">Select a node to analyze</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, valueClass = 'text-[#6aaa6a]' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-[#3a6a3a] w-28 shrink-0">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
