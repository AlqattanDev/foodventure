import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/game";
import { cookViz } from "../game/cookViz";

/**
 * Cartoon chef behind the counter. Sways idly, leans in and bobs faster while
 * cooking, and does a little celebratory jump on a 4–5 star result.
 */
export function Chef() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const phase = useGame((s) => s.phase);
  const stars = useGame((s) => s.result?.stars ?? 0);
  const cheerT = useRef(99);
  const prevRating = useRef(false);

  useFrame((state, dt) => {
    if (!root.current || !body.current) return;
    const t = state.clock.elapsedTime;

    // trigger a cheer the moment a good rating appears
    const rating = phase === "rating" && stars >= 4;
    if (rating && !prevRating.current) cheerT.current = 0;
    prevRating.current = rating;

    const cooking = phase === "cook" && cookViz.active;
    const bobSpeed = cooking ? 8 + cookViz.bubble * 6 : 2;
    const bobAmt = cooking ? 0.05 : 0.02;

    // base idle / cook bob
    let y = Math.abs(Math.sin(t * bobSpeed)) * bobAmt;
    let lean = cooking ? 0.18 + Math.sin(t * bobSpeed) * 0.04 : Math.sin(t * 0.8) * 0.03;

    // celebratory hop
    if (cheerT.current < 1.4) {
      cheerT.current += dt;
      const hops = Math.max(0, Math.sin(cheerT.current * 10));
      y += hops * 0.28;
      lean = -0.12 + Math.sin(cheerT.current * 14) * 0.08;
    }

    root.current.position.y = 0.35 + y;
    body.current.rotation.x = lean;
  });

  return (
    <group ref={root} position={[1.15, 0.35, -0.55]} scale={0.82}>
      <group ref={body}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.32, 0.66, 8, 16]} />
          <meshStandardMaterial color="#d94f2a" roughness={0.85} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.27, 24, 24]} />
          <meshStandardMaterial color="#b87a52" roughness={0.75} />
        </mesh>
        {/* eyes */}
        {[-0.1, 0.1].map((x, i) => (
          <mesh key={i} position={[x, 1.16, 0.24]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#2a1a12" roughness={0.4} />
          </mesh>
        ))}
        {/* smile */}
        <mesh position={[0, 1.04, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.016, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#5a2a1a" roughness={0.5} />
        </mesh>
        {/* chef hat */}
        <mesh position={[0, 1.42, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.21, 0.28, 20]} />
          <meshStandardMaterial color="#f2ede2" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.58, 0]} castShadow>
          <sphereGeometry args={[0.24, 20, 16]} />
          <meshStandardMaterial color="#f6f1e7" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
