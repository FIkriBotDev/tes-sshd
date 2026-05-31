import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import MainMenu from './components/MainMenu/MainMenu';
import LoadingScreen from './components/UI/LoadingScreen';
import GameWorld from './components/World/GameWorld';
import SettingsScreen from './components/UI/SettingsScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const loadGame = useGameStore((s) => s.loadGame);
  const hasSave = useGameStore((s) => s.hasSave);

  // Restore save state on mount
  useEffect(() => {
    if (hasSave) {
      // Don't auto-load — let user choose Continue
    }
  }, [hasSave]);

  return (
    <div className="w-full h-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {screen === 'main-menu' && <MainMenu key="main-menu" />}
        {screen === 'loading' && <LoadingScreen key="loading" />}
        {screen === 'world' && <GameWorld key="world" />}
        {screen === 'settings' && <SettingsScreen key="settings" />}
      </AnimatePresence>
    </div>
  );
}
