import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface JoystickState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// Expose mobile input globally so PlayerController can read it
export const mobileInput = {
  moveX: 0,
  moveY: 0,
  lookDX: 0,
  lookDY: 0,
};

export default function MobileControls() {
  const leftJoystickRef = useRef<JoystickState>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const rightDragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 });
  const leftKnobRef = useRef<HTMLDivElement>(null);
  const rightKnobRef = useRef<HTMLDivElement>(null);

  const JOYSTICK_RADIUS = 50;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        const x = touch.clientX;
        const y = touch.clientY;
        const isLeft = x < window.innerWidth / 2;

        if (isLeft) {
          leftJoystickRef.current = { active: true, startX: x, startY: y, currentX: x, currentY: y };
        } else {
          rightDragRef.current = { active: true, lastX: x, lastY: y };
        }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        const x = touch.clientX;
        const y = touch.clientY;
        const isLeft = x < window.innerWidth / 2;

        if (isLeft && leftJoystickRef.current.active) {
          leftJoystickRef.current.currentX = x;
          leftJoystickRef.current.currentY = y;

          const dx = x - leftJoystickRef.current.startX;
          const dy = y - leftJoystickRef.current.startY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const clamped = Math.min(dist, JOYSTICK_RADIUS);
          const angle = Math.atan2(dy, dx);

          mobileInput.moveX = (Math.cos(angle) * clamped) / JOYSTICK_RADIUS;
          mobileInput.moveY = (Math.sin(angle) * clamped) / JOYSTICK_RADIUS;

          // Update knob visual
          if (leftKnobRef.current) {
            const kx = Math.cos(angle) * Math.min(dist, JOYSTICK_RADIUS);
            const ky = Math.sin(angle) * Math.min(dist, JOYSTICK_RADIUS);
            leftKnobRef.current.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
          }
        } else if (!isLeft && rightDragRef.current.active) {
          const ddx = x - rightDragRef.current.lastX;
          const ddy = y - rightDragRef.current.lastY;
          mobileInput.lookDX = ddx * 0.3;
          mobileInput.lookDY = ddy * 0.3;
          rightDragRef.current.lastX = x;
          rightDragRef.current.lastY = y;
        }
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        const x = touch.clientX;
        const isLeft = x < window.innerWidth / 2;
        if (isLeft) {
          leftJoystickRef.current.active = false;
          mobileInput.moveX = 0;
          mobileInput.moveY = 0;
          if (leftKnobRef.current) {
            leftKnobRef.current.style.transform = 'translate(-50%, -50%)';
          }
        } else {
          rightDragRef.current.active = false;
          mobileInput.lookDX = 0;
          mobileInput.lookDY = 0;
        }
      });
    };

    // Reset look delta each frame
    const resetLook = setInterval(() => {
      mobileInput.lookDX = 0;
      mobileInput.lookDY = 0;
    }, 16);

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      clearInterval(resetLook);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 md:hidden">
      {/* Left joystick */}
      <div className="absolute bottom-16 left-12 pointer-events-auto">
        <div
          className="relative rounded-full border-2 border-white/20 bg-white/5"
          style={{ width: JOYSTICK_RADIUS * 2, height: JOYSTICK_RADIUS * 2 }}
        >
          <div
            ref={leftKnobRef}
            className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full bg-white/30 border border-white/40"
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <span className="text-white/20 text-xs font-mono text-center block mt-1">MOVE</span>
      </div>

      {/* Right area label */}
      <div className="absolute bottom-16 right-12 pointer-events-none">
        <div
          className="rounded-full border-2 border-white/10 bg-white/3 flex items-center justify-center"
          style={{ width: JOYSTICK_RADIUS * 2, height: JOYSTICK_RADIUS * 2 }}
        >
          <span className="text-white/20 text-xs font-mono">LOOK</span>
        </div>
      </div>

      {/* Interact button */}
      <motion.button
        className="absolute bottom-16 right-1/2 translate-x-1/2 pointer-events-auto"
        whileTap={{ scale: 0.9 }}
        onTouchStart={() => {
          const nearby = (window as any).__nearbyInteractable;
          if (nearby) {
            // Trigger interaction
          }
        }}
      >
        <div className="w-14 h-14 rounded-full border-2 border-[#00ff41]/50 bg-[#00ff41]/10 flex items-center justify-center">
          <span className="text-[#00ff41] font-bold text-sm">E</span>
        </div>
      </motion.button>
    </div>
  );
}
