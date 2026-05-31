import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';

const WALK_SPEED = 5;
const SPRINT_SPEED = 10;
const PLAYER_HEIGHT = 1.7;

export default function PlayerController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());

  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);
  const setUsingComputer = useGameStore((s) => s.setUsingComputer);
  const sensitivity = useGameStore((s) => s.settings.mouseSensitivity);

  // Set initial position (apartment)
  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 2);
  }, [camera]);

  // Key handlers
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.code);

    // Interact
    if (e.code === 'KeyE') {
      const nearby = useGameStore.getState().nearbyInteractable;
      if (nearby === 'home-computer') {
        useGameStore.getState().setUsingComputer(true);
        controlsRef.current?.unlock();
      }
    }

    // Escape — exit computer or show pause
    if (e.code === 'Escape') {
      if (useGameStore.getState().isUsingComputer) {
        useGameStore.getState().setUsingComputer(false);
      }
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return;

    const keys = keysRef.current;
    const isSprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

    // Movement direction
    const dir = directionRef.current;
    dir.set(0, 0, 0);

    if (keys.has('KeyW') || keys.has('ArrowUp'))    dir.z -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown'))  dir.z += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  dir.x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();
      // Move relative to camera direction
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

      const move = new THREE.Vector3();
      move.addScaledVector(forward, -dir.z);
      move.addScaledVector(right, dir.x);
      move.normalize().multiplyScalar(speed * delta);

      camera.position.add(move);
    }

    // Keep player at ground level
    camera.position.y = PLAYER_HEIGHT;

    // Clamp to apartment bounds (simple box)
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -6, 6);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6, 8);

    // Check proximity to computer desk
    const distToDesk = camera.position.distanceTo(new THREE.Vector3(0, PLAYER_HEIGHT, -3));
    setNearbyInteractable(distToDesk < 2.5 ? 'home-computer' : null);
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      pointerSpeed={sensitivity}
    />
  );
}
