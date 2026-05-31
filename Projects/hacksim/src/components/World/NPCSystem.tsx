import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { NPCS_DATA } from '../../data/npcs';

// NPC waypoints in the city (simplified patrol routes)
const NPC_ROUTES: Record<string, THREE.Vector3[]> = {
  'npc-zara': [
    new THREE.Vector3(5, 0, -5),
    new THREE.Vector3(8, 0, -8),
    new THREE.Vector3(5, 0, -10),
    new THREE.Vector3(2, 0, -8),
  ],
  'npc-riko': [
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(15, 0, 5),
    new THREE.Vector3(20, 0, 0),
    new THREE.Vector3(15, 0, -5),
  ],
  'npc-leo': [
    new THREE.Vector3(-5, 0, -20),
    new THREE.Vector3(0, 0, -25),
    new THREE.Vector3(5, 0, -20),
    new THREE.Vector3(0, 0, -15),
  ],
};

interface NPCMeshState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  waypointIdx: number;
  speed: number;
  bobOffset: number;
}

const NPC_COLORS: Record<string, string> = {
  'npc-zara':   '#4a90d9',
  'npc-riko':   '#e67e22',
  'npc-leo':    '#27ae60',
  'npc-hana':   '#8e44ad',
  'npc-marcus': '#c0392b',
};

export default function NPCSystem() {
  const setActiveDialogueNPC = useGameStore((s) => s.setActiveDialogueNPC);
  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);
  const statesRef = useRef<Record<string, NPCMeshState>>({});
  const meshRefs = useRef<Record<string, THREE.Group>>({});

  // Initialize NPC states
  useEffect(() => {
    NPCS_DATA.forEach((npc) => {
      const routes = NPC_ROUTES[npc.id];
      if (!routes) return;
      statesRef.current[npc.id] = {
        position: routes[0].clone(),
        target: routes[1].clone(),
        waypointIdx: 0,
        speed: 1.5 + Math.random() * 0.5,
        bobOffset: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;

    NPCS_DATA.forEach((npc) => {
      const npcState = statesRef.current[npc.id];
      const mesh = meshRefs.current[npc.id];
      if (!npcState || !mesh) return;

      const routes = NPC_ROUTES[npc.id];
      if (!routes) return;

      // Move toward target
      const dir = npcState.target.clone().sub(npcState.position);
      const dist = dir.length();

      if (dist < 0.3) {
        // Reached waypoint — go to next
        npcState.waypointIdx = (npcState.waypointIdx + 1) % routes.length;
        npcState.target = routes[npcState.waypointIdx].clone();
      } else {
        dir.normalize();
        npcState.position.addScaledVector(dir, npcState.speed * delta);

        // Face direction of movement
        const angle = Math.atan2(dir.x, dir.z);
        mesh.rotation.y = angle;
      }

      // Bob animation (walking)
      const bob = Math.sin(state.clock.elapsedTime * 4 + npcState.bobOffset) * 0.04;
      mesh.position.set(npcState.position.x, bob, npcState.position.z);

      // Check proximity to player
      const playerPos = camera.position.clone();
      playerPos.y = 0;
      const npcPos = npcState.position.clone();
      const distToPlayer = playerPos.distanceTo(npcPos);

      if (distToPlayer < 3) {
        setNearbyInteractable(npc.id);
      }
    });
  });

  return (
    <group>
      {NPCS_DATA.filter((npc) => NPC_ROUTES[npc.id]).map((npc) => {
        const color = NPC_COLORS[npc.id] ?? '#888888';
        const routes = NPC_ROUTES[npc.id];
        if (!routes) return null;

        return (
          <group
            key={npc.id}
            ref={(ref) => { if (ref) meshRefs.current[npc.id] = ref; }}
            position={routes[0]}
          >
            {/* Body */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <capsuleGeometry args={[0.25, 0.8, 4, 8]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.35, 0]} castShadow>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial color="#f5d5b0" roughness={0.8} />
            </mesh>
            {/* Name tag */}
            <Text
              position={[0, 1.8, 0]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              {npc.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
