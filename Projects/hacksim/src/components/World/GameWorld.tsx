import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Preload } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import PlayerController from './PlayerController';
import ApartmentScene from './scenes/ApartmentScene';
import CityScene from './scenes/CityScene';
import NPCSystem from './NPCSystem';
import HUD from '../HUD/HUD';
import ExOS from '../ExOS/ExOS';
import DialogueSystem from '../Dialogue/DialogueSystem';
import InteractionPrompt from '../UI/InteractionPrompt';
import MiniMap from '../HUD/MiniMap';
import MobileControls from '../UI/MobileControls';

export default function GameWorld() {
  const isUsingComputer = useGameStore((s) => s.isUsingComputer);
  const activeDialogueNPC = useGameStore((s) => s.activeDialogueNPC);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const settings = useGameStore((s) => s.settings);

  const isInApartment = currentLocation === 'apartment';

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 3D Canvas */}
      {!isUsingComputer && (
        <Canvas
          className="w-full h-full"
          camera={{ fov: settings.fov, near: 0.1, far: 1000 }}
          shadows
          gl={{ antialias: settings.graphicsQuality !== 'low', powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.6} color="#fff8f0" />
            <directionalLight
              position={[50, 80, 30]}
              intensity={1.2}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-far={200}
              shadow-camera-left={-50}
              shadow-camera-right={50}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
              color="#fffaf0"
            />
            <hemisphereLight args={['#87ceeb', '#7ec850', 0.4]} />

            {/* Sky */}
            <Sky
              distance={450000}
              sunPosition={[100, 20, 100]}
              inclination={0.49}
              azimuth={0.25}
              turbidity={8}
              rayleigh={0.5}
            />

            {/* Stars (visible at night) */}
            <Stars radius={300} depth={60} count={1000} factor={4} fade />

            {/* Scenes */}
            {isInApartment ? <ApartmentScene /> : <CityScene />}

            {/* NPCs (only in city) */}
            {!isInApartment && <NPCSystem />}

            {/* Player controller (FPP) */}
            <PlayerController />

            <Preload all />
          </Suspense>
        </Canvas>
      )}

      {/* ExOS overlay */}
      {isUsingComputer && <ExOS />}

      {/* HUD (only in world, not in ExOS) */}
      {!isUsingComputer && !activeDialogueNPC && <HUD />}

      {/* Crosshair */}
      {!isUsingComputer && !activeDialogueNPC && (
        <div className="crosshair" />
      )}

      {/* Interaction prompt */}
      {!isUsingComputer && !activeDialogueNPC && <InteractionPrompt />}

      {/* Mini map */}
      {!isUsingComputer && !activeDialogueNPC && <MiniMap />}

      {/* Dialogue system */}
      {activeDialogueNPC && <DialogueSystem />}

      {/* Mobile controls */}
      <MobileControls />
    </motion.div>
  );
}
