import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Building data: [x, z, width, depth, height, color]
const BUILDINGS: [number, number, number, number, number, string][] = [
  // Residential District (left)
  [-30, -20, 8, 8, 12, '#d4c5a9'], [-20, -25, 6, 6, 8, '#c8b89a'],
  [-35, -10, 10, 8, 15, '#e0d4c0'], [-25, -5, 7, 7, 10, '#d8cbb5'],
  [-30, 10, 8, 8, 9, '#cfc0a8'], [-20, 15, 6, 6, 7, '#c4b49a'],

  // Shopping District (center-right)
  [10, -20, 12, 10, 6, '#e8e0d0'], [25, -18, 8, 8, 5, '#f0e8d8'],
  [15, -5, 10, 8, 8, '#e4dcc8'], [28, -5, 6, 6, 4, '#ece4d4'],

  // Business District (right)
  [40, -20, 12, 12, 35, '#b8c8d8'], [55, -15, 10, 10, 28, '#c0ccd8'],
  [45, 5, 8, 8, 22, '#b0c0d0'], [58, 5, 12, 10, 40, '#a8b8c8'],

  // University (back-left)
  [-15, -45, 20, 15, 10, '#d8c8a8'], [-5, -50, 12, 10, 8, '#e0d0b0'],
  [5, -45, 10, 10, 12, '#d4c4a4'],

  // Industrial (far right)
  [70, -10, 20, 15, 8, '#9a9a9a'], [75, 10, 15, 12, 6, '#888888'],
  [65, 20, 18, 14, 10, '#a0a0a0'],

  // Tech Park (back-right)
  [40, -45, 15, 12, 18, '#c8d8e8'], [55, -50, 12, 10, 22, '#b8ccd8'],
  [45, -60, 10, 10, 16, '#c0d0e0'],
];

// Street lights: [x, z]
const STREET_LIGHTS: [number, number][] = [
  [-5, -10], [5, -10], [-5, 10], [5, 10],
  [15, -10], [25, -10], [15, 10], [25, 10],
  [-15, -10], [-25, -10],
];

// Trees: [x, z]
const TREES: [number, number][] = [
  [-8, -8], [8, -8], [-8, 8], [8, 8],
  [-12, 0], [12, 0], [0, -15], [0, 15],
  [-5, -20], [5, -20], [-5, 20], [5, 20],
  [20, -15], [20, 15], [-20, -15], [-20, 15],
];

function Building({ x, z, w, d, h, color }: { x: number; z: number; w: number; d: number; h: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Roof detail */}
      <mesh position={[0, h + 0.1, 0]}>
        <boxGeometry args={[w + 0.2, 0.2, d + 0.2]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8).getStyle()} roughness={0.8} />
      </mesh>
      {/* Windows (simple emissive planes) */}
      {Array.from({ length: Math.floor(h / 3) }).map((_, row) =>
        Array.from({ length: Math.floor(w / 2.5) }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[
              -w / 2 + 1.2 + col * 2.5,
              1.5 + row * 3,
              d / 2 + 0.01,
            ]}
          >
            <planeGeometry args={[0.8, 1.0]} />
            <meshStandardMaterial
              color="#1a2a3a"
              emissive={Math.random() > 0.3 ? '#ffcc44' : '#000000'}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

function StreetLight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 5, 6]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.4, 4.8, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Light head */}
      <mesh position={[0.7, 4.7, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.2]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Light */}
      <pointLight position={[0.7, 4.5, 0]} intensity={1.5} color="#ffe8a0" distance={12} castShadow />
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  const h = 2 + Math.random() * 1.5;
  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, h / 4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, h / 2, 6]} />
        <meshStandardMaterial color="#6b4226" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, h * 0.75, 0]} castShadow>
        <sphereGeometry args={[0.8 + Math.random() * 0.4, 8, 6]} />
        <meshStandardMaterial color="#3a8a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, h * 0.6, 0]} castShadow>
        <sphereGeometry args={[0.6 + Math.random() * 0.3, 8, 6]} />
        <meshStandardMaterial color="#2d7a2d" roughness={0.9} />
      </mesh>
    </group>
  );
}

function AmbientVehicles() {
  // Parked cars along roads
  const CARS: [number, number, number, string][] = [
    [6, 0, -5, '#c0392b'],
    [-6, 0, -5, '#2980b9'],
    [6, 0, 5, '#27ae60'],
    [-6, 0, 5, '#8e44ad'],
    [6, 0, 15, '#e67e22'],
    [-6, 0, 15, '#1abc9c'],
    [6, 0, -15, '#f39c12'],
    [-6, 0, -15, '#95a5a6'],
  ];

  return (
    <group>
      {CARS.map(([x, y, z, color], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Car body */}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.6, 3.8]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Car roof */}
          <mesh position={[0, 0.85, -0.2]} castShadow>
            <boxGeometry args={[1.6, 0.5, 2.2]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Windshield */}
          <mesh position={[0, 0.85, 0.9]}>
            <boxGeometry args={[1.5, 0.45, 0.05]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} roughness={0} metalness={0.2} />
          </mesh>
          {/* Wheels */}
          {[[-0.9, 0.2, 1.2], [0.9, 0.2, 1.2], [-0.9, 0.2, -1.2], [0.9, 0.2, -1.2]].map(([wx, wy, wz], wi) => (
            <mesh key={wi} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.2, 12]} />
              <meshStandardMaterial color="#222222" roughness={0.9} />
            </mesh>
          ))}
          {/* Headlights */}
          <mesh position={[0.5, 0.4, 1.9]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshStandardMaterial color="#fffaf0" emissive="#fffaf0" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-0.5, 0.4, 1.9]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshStandardMaterial color="#fffaf0" emissive="#fffaf0" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Road() {
  return (
    <group>
      {/* Main road (N-S) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 200]} />
        <meshStandardMaterial color="#444444" roughness={0.9} />
      </mesh>
      {/* Main road (E-W) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.9} />
      </mesh>
      {/* Road markings */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -90 + i * 10]} receiveShadow>
          <planeGeometry args={[0.3, 3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default function CityScene() {
  const cloudRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (cloudRef.current) {
      cloudRef.current.position.x += delta * 0.5;
      if (cloudRef.current.position.x > 100) cloudRef.current.position.x = -100;
    }
  });

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#7ec850" roughness={0.9} />
      </mesh>

      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[12, 200]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[200, 12]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.8} />
      </mesh>

      {/* Roads */}
      <Road />

      {/* Buildings */}
      {BUILDINGS.map(([x, z, w, d, h, color], i) => (
        <Building key={i} x={x} z={z} w={w} d={d} h={h} color={color} />
      ))}

      {/* Street lights */}
      {STREET_LIGHTS.map(([x, z], i) => (
        <StreetLight key={i} x={x} z={z} />
      ))}

      {/* Trees */}
      {TREES.map(([x, z], i) => (
        <Tree key={i} x={x} z={z} />
      ))}

      {/* Ambient vehicles (parked) */}
      <AmbientVehicles />

      {/* Clouds */}
      <group ref={cloudRef} position={[0, 40, -50]}>
        {[0, 15, 30, -15, -30].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[4 + i * 0.5, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={1} />
          </mesh>
        ))}
      </group>

      {/* Ambient city sounds placeholder */}
    </group>
  );
}
