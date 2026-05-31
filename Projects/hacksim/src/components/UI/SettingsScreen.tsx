import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

export default function SettingsScreen() {
  const { settings, updateSettings, setScreen, screen } = useGameStore();
  const prevScreen = screen === 'settings' ? 'main-menu' : 'world';

  const back = () => setScreen(prevScreen as 'main-menu' | 'world');

  const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.05 }: {
    label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; step?: number;
  }) => (
    <div className="flex items-center gap-4 py-2">
      <span className="text-[#6aaa6a] font-mono text-xs w-40">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#00ff41] h-1"
      />
      <span className="text-[#00ff41] font-mono text-xs w-10 text-right">
        {max === 1 ? Math.round(value * 100) + '%' : value}
      </span>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0a0f0a] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="exos-scanline absolute inset-0 opacity-20 pointer-events-none" />

      <div className="exos-window rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff41]" />
            <span className="font-mono text-[#00ff41] text-sm">SYSTEM SETTINGS</span>
          </div>
          <button onClick={back} className="text-[#3a6a3a] font-mono text-xs hover:text-[#00ff41] transition-colors">
            ✕ Close
          </button>
        </div>
        <div className="h-px bg-[#1a3a1a] mb-5" />

        <div className="space-y-1">
          <div className="text-[#3a6a3a] font-mono text-xs mb-2 uppercase tracking-widest">Audio</div>
          <Slider label="Master Volume" value={settings.masterVolume} onChange={(v) => updateSettings({ masterVolume: v })} />
          <Slider label="Music Volume" value={settings.musicVolume} onChange={(v) => updateSettings({ musicVolume: v })} />
          <Slider label="SFX Volume" value={settings.sfxVolume} onChange={(v) => updateSettings({ sfxVolume: v })} />

          <div className="h-px bg-[#1a3a1a] my-3" />
          <div className="text-[#3a6a3a] font-mono text-xs mb-2 uppercase tracking-widest">Controls</div>
          <Slider label="Mouse Sensitivity" value={settings.mouseSensitivity} onChange={(v) => updateSettings({ mouseSensitivity: v })} />
          <Slider label="Field of View" value={settings.fov} onChange={(v) => updateSettings({ fov: v })} min={60} max={110} step={1} />

          <div className="h-px bg-[#1a3a1a] my-3" />
          <div className="text-[#3a6a3a] font-mono text-xs mb-2 uppercase tracking-widest">Graphics</div>
          <div className="flex items-center gap-4 py-2">
            <span className="text-[#6aaa6a] font-mono text-xs w-40">Quality</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => updateSettings({ graphicsQuality: q })}
                  className={`px-3 py-1 font-mono text-xs rounded border transition-colors ${
                    settings.graphicsQuality === q
                      ? 'border-[#00ff41]/60 text-[#00ff41] bg-[#00ff41]/10'
                      : 'border-[#1a3a1a] text-[#3a6a3a] hover:border-[#2a5a2a]'
                  }`}
                >
                  {q.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <span className="text-[#6aaa6a] font-mono text-xs w-40">Show FPS</span>
            <button
              onClick={() => updateSettings({ showFPS: !settings.showFPS })}
              className={`w-10 h-5 rounded-full border transition-colors relative ${
                settings.showFPS ? 'border-[#00ff41]/60 bg-[#00ff41]/20' : 'border-[#1a3a1a] bg-transparent'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                settings.showFPS ? 'left-5 bg-[#00ff41]' : 'left-0.5 bg-[#2a4a2a]'
              }`} />
            </button>
          </div>
        </div>

        <div className="h-px bg-[#1a3a1a] mt-5 mb-4" />
        <button
          onClick={back}
          className="w-full py-2 border border-[#00ff41]/30 text-[#00ff41] font-mono text-sm rounded hover:bg-[#00ff41]/10 transition-colors"
        >
          Save & Close
        </button>
      </div>
    </motion.div>
  );
}
