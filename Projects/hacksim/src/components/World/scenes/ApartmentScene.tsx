import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../stores/gameStore';

export default function ApartmentScene() {
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const monitorGlowRef = useRef<THREE.PointLight>(null);

  // Subtle monitor flicker
  useFrame((state) => {
    if (monitorGlowRef.current) {
      monitorGlowRef.current.intensity = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group>
      {/* ── Floor ─────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 16]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Floor rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]} receiveShadow>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>

      {/* ── Walls ─────────────────────────────────────────── */}
      {/* Back wall */}
      <mesh position={[0, 2.5, -7]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#e0d8c8" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[7, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#e0d8c8" roughness={0.9} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[14, 16]} />
        <meshStandardMaterial color="#f0ece4" roughness={1} />
      </mesh>

      {/* ── Ceiling light ─────────────────────────────────── */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#fffaf0" emissive="#fffaf0" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 4.5, 0]} intensity={1.5} color="#fffaf0" distance={12} castShadow />

      {/* ── Computer Desk ─────────────────────────────────── */}
      {/* Desk surface */}
      <mesh position={[0, 0.75, -4.5]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 1.0]} />
        <meshStandardMaterial color="#5c4a32" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Desk legs */}
      {[[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, -4.5 + z]} castShadow>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color="#4a3828" roughness={0.7} />
        </mesh>
      ))}

      {/* ── Monitor ───────────────────────────────────────── */}
      {/* Monitor stand */}
      <mesh position={[0, 0.85, -4.8]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Monitor screen */}
      <mesh position={[0, 1.25, -4.85]} castShadow>
        <boxGeometry args={[1.2, 0.7, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Screen glow (ExOS green) */}
      <mesh position={[0, 1.25, -4.82]}>
        <planeGeometry args={[1.1, 0.6]} />
        <meshStandardMaterial
          color="#001a00"
          emissive="#00ff41"
          emissiveIntensity={nearbyInteractable === 'home-computer' ? 0.4 : 0.2}
        />
      </mesh>
      {/* Monitor glow light */}
      <pointLight
        ref={monitorGlowRef}
        position={[0, 1.25, -4.5]}
        intensity={0.8}
        color="#00ff41"
        distance={3}
      />

      {/* Interact label */}
      {nearbyInteractable === 'home-computer' && (
        <Text
          position={[0, 1.8, -4.5]}
          fontSize={0.12}
          color="#00ff41"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000"
        >
          [E] Use Computer
        </Text>
      )}

      {/* ── Keyboard & Mouse ──────────────────────────────── */}
      <mesh position={[0, 0.8, -4.2]} castShadow>
        <boxGeometry args={[0.8, 0.03, 0.25]} />
        <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0.55, 0.8, -4.2]} castShadow>
        <boxGeometry args={[0.1, 0.03, 0.07]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* ── Bed ───────────────────────────────────────────── */}
      {/* Bed frame */}
      <mesh position={[-4, 0.3, 2]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.3, 3.5]} />
        <meshStandardMaterial color="#6b4c2a" roughness={0.7} />
      </mesh>
      {/* Mattress */}
      <mesh position={[-4, 0.55, 2]} castShadow>
        <boxGeometry args={[2.0, 0.2, 3.2]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.9} />
      </mesh>
      {/* Pillow */}
      <mesh position={[-4, 0.7, 0.6]} castShadow>
        <boxGeometry args={[1.4, 0.12, 0.5]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.9} />
      </mesh>
      {/* Blanket */}
      <mesh position={[-4, 0.68, 2.5]} castShadow>
        <boxGeometry args={[1.9, 0.08, 2.0]} />
        <meshStandardMaterial color="#4a6a8a" roughness={0.9} />
      </mesh>
      {/* Headboard */}
      <mesh position={[-4, 0.8, -0.3]} castShadow>
        <boxGeometry args={[2.2, 0.9, 0.1]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.7} />
      </mesh>

      {/* ── Bookshelf ─────────────────────────────────────── */}
      <mesh position={[5.5, 1.5, -4]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3.0, 1.5]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.7} />
      </mesh>
      {/* Books */}
      {[0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4].map((y, i) => (
        <mesh key={i} position={[5.3, y, -4 + (i % 3) * 0.2 - 0.2]} castShadow>
          <boxGeometry args={[0.15, 0.25, 0.18]} />
          <meshStandardMaterial
            color={['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#2c3e50'][i]}
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* ── Router ────────────────────────────────────────── */}
      <mesh position={[0.8, 0.82, -4.5]} castShadow>
        <boxGeometry args={[0.25, 0.06, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Router LED */}
      <mesh position={[0.72, 0.86, -4.5]}>
        <sphereGeometry args={[0.015]} />
        <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={2} />
      </mesh>

      {/* ── Whiteboard ────────────────────────────────────── */}
      <mesh position={[3, 2.2, -6.9]} castShadow>
        <boxGeometry args={[2.0, 1.2, 0.05]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
      </mesh>
      {/* Whiteboard frame */}
      <mesh position={[3, 2.2, -6.88]}>
        <boxGeometry args={[2.1, 1.3, 0.02]} />
        <meshStandardMaterial color="#888888" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* ── Storage Cabinet ───────────────────────────────── */}
      <mesh position={[-5.5, 0.8, -4]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.6, 0.8]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.7} />
      </mesh>

      {/* ── Window ────────────────────────────────────────── */}
      <mesh position={[0, 2.5, -6.9]}>
        <boxGeometry args={[1.8, 1.4, 0.05]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.4} roughness={0} metalness={0.1} />
      </mesh>
      {/* Window frame */}
      <mesh position={[0, 2.5, -6.88]}>
        <boxGeometry args={[1.9, 1.5, 0.04]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} />
      </mesh>
      {/* Window light */}
      <pointLight position={[0, 2.5, -5.5]} intensity={0.5} color="#87ceeb" distance={6} />

      {/* ── Door ──────────────────────────────────────────── */}
      <mesh position={[5, 1.1, 7.5]} castShadow>
        <boxGeometry args={[1.0, 2.2, 0.08]} />
        <meshStandardMaterial color="#8b6914" roughness={0.7} />
      </mesh>
      {/* Door knob */}
      <mesh position={[5.4, 1.1, 7.46]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="#c0a020" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}
