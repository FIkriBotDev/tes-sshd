import type { ExOSApp } from './ExOS';

interface Props {
  activeApp: ExOSApp;
  setActiveApp: (app: ExOSApp) => void;
  unreadMail: number;
}

const APPS: { id: ExOSApp; label: string; icon: string; desc: string }[] = [
  { id: 'desktop',     label: 'Desktop',     icon: '⬡', desc: 'Home' },
  { id: 'terminal',    label: 'Terminal',    icon: '>', desc: 'Command line' },
  { id: 'mail',        label: 'Mail',        icon: '✉', desc: 'Messages' },
  { id: 'missions',    label: 'Missions',    icon: '◈', desc: 'Active cases' },
  { id: 'scanner',     label: 'Scanner',     icon: '◎', desc: 'Network scan' },
  { id: 'inventory',   label: 'Inventory',   icon: '▣', desc: 'Items' },
  { id: 'marketplace', label: 'Market',      icon: '◆', desc: 'Buy & sell' },
  { id: 'research',    label: 'Research',    icon: '◉', desc: 'Knowledge base' },
  { id: 'status',      label: 'Status',      icon: '◐', desc: 'System info' },
];

export default function ExOSTaskbar({ activeApp, setActiveApp, unreadMail }: Props) {
  return (
    <div className="w-16 flex flex-col items-center py-3 gap-1 bg-[#0a0f0a] border-r border-[#1a3a1a]">
      {APPS.map((app) => (
        <button
          key={app.id}
          onClick={() => setActiveApp(app.id)}
          title={app.desc}
          className={`
            relative w-10 h-10 rounded flex items-center justify-center
            font-mono text-base transition-all duration-150
            ${activeApp === app.id
              ? 'bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/40'
              : 'text-[#3a6a3a] hover:text-[#00cc33] hover:bg-[#00ff41]/8 border border-transparent'
            }
          `}
          style={activeApp === app.id ? { boxShadow: '0 0 8px rgba(0,255,65,0.2)' } : {}}
        >
          {app.icon}
          {app.id === 'mail' && unreadMail > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff3333] text-white text-[9px] flex items-center justify-center font-bold">
              {unreadMail > 9 ? '9+' : unreadMail}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
