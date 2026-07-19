import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, type Phase } from "../state/game";

/**
 * Eases the camera between per-phase framings. Prep and Cook push in close so
 * the DOM mini-game overlays sit right over the plate / pot; everything else
 * relaxes back to the cozy hero shot of the whole diorama.
 */
interface Shot {
  pos: [number, number, number];
  target: [number, number, number];
}

const SHOTS: Record<Phase, Shot> = {
  // home pulls back far enough to hold the terrace tables in frame
  idle: { pos: [0, 7.2, 13.4], target: [0, 0.35, 1.9] },
  select: { pos: [0, 6.6, 12.6], target: [0, 0.5, 1.6] },
  book: { pos: [0, 4.6, 9.4], target: [0, 1.2, 0.0] },
  cook: { pos: [-0.35, 3.35, 5.0], target: [-0.35, 0.95, 0.55] },
  rating: { pos: [0, 4.2, 8.4], target: [-0.2, 1.15, 0.3] },
  shop: { pos: [0, 4.6, 9.4], target: [0, 1.2, 0.0] },
  market: { pos: [0, 4.6, 9.4], target: [0, 1.2, 0.0] },
  ledger: { pos: [0, 6.6, 12.6], target: [0, 0.5, 1.6] },
  menu: { pos: [0, 4.6, 9.4], target: [0, 1.2, 0.0] },
};

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const phase = useGame((s) => s.phase);
  const floorTier = useGame((s) => s.floorTier);
  const target = useRef(new THREE.Vector3(0, 1.1, 0.4));

  useFrame((_, dt) => {
    const shot = SHOTS[phase] ?? SHOTS.idle;
    // with the majlis wing on the left, the home shots slide over to hold it
    const wide = floorTier >= 1 && (phase === "idle" || phase === "select");
    const ox = wide ? -0.9 : 0;
    const k = 1 - Math.pow(0.0016, dt); // frame-rate independent damping
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, shot.pos[0] + ox, k);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, shot.pos[1], k);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, shot.pos[2], k);
    target.current.x = THREE.MathUtils.lerp(target.current.x, shot.target[0] + ox, k);
    target.current.y = THREE.MathUtils.lerp(target.current.y, shot.target[1], k);
    target.current.z = THREE.MathUtils.lerp(target.current.z, shot.target[2], k);
    camera.lookAt(target.current);
  });

  return null;
}
