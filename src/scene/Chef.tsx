import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/game";
import { cookViz } from "../game/cookViz";

const SKIN = "#c98a5f";
const THOBE = "#d94f2a";
const APRON = "#f2ead6";
const HAIR = "#3a2418";

/**
 * Cartoon chef behind the counter. Sways idly, leans in and stirs with his
 * right arm while cooking, and does a little celebratory jump on a 4–5 star
 * result.
 */
export function Chef() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
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

    // arms: right arm stirs in a circle while cooking, both raised in a cheer
    const stir = cooking ? 6 + cookViz.bubble * 3 : 0;
    if (rightArm.current) {
      const target = cooking
        ? { x: -1.15 + Math.sin(t * stir) * 0.25, z: -0.35 + Math.cos(t * stir) * 0.2 }
        : { x: -0.15 + Math.sin(t * 0.8) * 0.05, z: -0.5 };
      const k = 1 - Math.pow(0.001, dt);
      rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, target.x, k);
      rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, target.z, k);
    }
    if (leftArm.current) {
      leftArm.current.rotation.z = 0.5 + Math.sin(t * 0.7) * 0.04;
    }

    // celebratory hop — arms up
    if (cheerT.current < 1.4) {
      cheerT.current += dt;
      const hops = Math.max(0, Math.sin(cheerT.current * 10));
      y += hops * 0.28;
      lean = -0.12 + Math.sin(cheerT.current * 14) * 0.08;
      if (rightArm.current) rightArm.current.rotation.x = -2.6;
      if (leftArm.current) leftArm.current.rotation.z = 2.4;
    }

    root.current.position.y = 0.35 + y;
    body.current.rotation.x = lean;
  });

  return (
    <group ref={root} position={[1.15, 0.35, -0.55]} scale={0.82}>
      <group ref={body}>
        {/* thobe body */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.32, 0.66, 8, 16]} />
          <meshStandardMaterial color={THOBE} roughness={0.85} />
        </mesh>
        {/* apron front + neck strap */}
        <mesh position={[0, 0.5, 0.17]} rotation={[0.06, 0, 0]} scale={[1, 1, 0.45]} castShadow>
          <capsuleGeometry args={[0.24, 0.42, 6, 14]} />
          <meshStandardMaterial color={APRON} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.88, 0.13]} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.19, 0.022, 8, 20]} />
          <meshStandardMaterial color={APRON} roughness={0.9} />
        </mesh>

        {/* arms — pivot at the shoulders */}
        <group ref={rightArm} position={[-0.3, 0.86, 0.05]}>
          <mesh position={[0, -0.2, 0.06]} rotation={[0.25, 0, 0.35]} castShadow>
            <capsuleGeometry args={[0.09, 0.36, 6, 12]} />
            <meshStandardMaterial color={THOBE} roughness={0.85} />
          </mesh>
          <mesh position={[-0.09, -0.4, 0.14]} castShadow>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.75} />
          </mesh>
        </group>
        <group ref={leftArm} position={[0.3, 0.86, 0.05]} rotation={[0, 0, 0.5]}>
          <mesh position={[0, -0.2, 0.02]} rotation={[0, 0, -0.15]} castShadow>
            <capsuleGeometry args={[0.09, 0.36, 6, 12]} />
            <meshStandardMaterial color={THOBE} roughness={0.85} />
          </mesh>
          <mesh position={[0.05, -0.42, 0.05]} castShadow>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.75} />
          </mesh>
        </group>

        {/* head */}
        <mesh position={[0, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.27, 24, 24]} />
          <meshStandardMaterial color={SKIN} roughness={0.75} />
        </mesh>
        {/* ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.26, 1.1, 0]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.75} />
          </mesh>
        ))}
        {/* eyes + brows */}
        {[-0.1, 0.1].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 1.16, 0.24]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color="#2a1a12" roughness={0.4} />
            </mesh>
            <mesh position={[x, 1.23, 0.235]} rotation={[0.1, 0, x < 0 ? -0.18 : 0.18]}>
              <boxGeometry args={[0.09, 0.024, 0.02]} />
              <meshStandardMaterial color={HAIR} roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* blush */}
        {[-0.17, 0.17].map((x, i) => (
          <mesh key={i} position={[x, 1.08, 0.21]} rotation={[0, x < 0 ? -0.5 : 0.5, 0]}>
            <circleGeometry args={[0.045, 12]} />
            <meshStandardMaterial color="#e0784f" roughness={1} transparent opacity={0.7} />
          </mesh>
        ))}
        {/* big warm mustache */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.07, 1.05, 0.245]}
            rotation={[0.15, 0, s * -0.35]}
            scale={[1.4, 0.65, 0.5]}
            castShadow
          >
            <sphereGeometry args={[0.075, 14, 12]} />
            <meshStandardMaterial color={HAIR} roughness={0.85} />
          </mesh>
        ))}
        {/* smile under the mustache */}
        <mesh position={[0, 1.0, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.014, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#5a2a1a" roughness={0.5} />
        </mesh>

        {/* puffy chef hat */}
        <mesh position={[0, 1.42, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.21, 0.26, 20]} />
          <meshStandardMaterial color={APRON} roughness={0.9} />
        </mesh>
        {[[0, 1.6, 0, 0.22], [-0.13, 1.55, 0.05, 0.14], [0.14, 1.56, -0.03, 0.15]].map(
          ([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[r, 18, 14]} />
              <meshStandardMaterial color="#f6f1e7" roughness={0.9} />
            </mesh>
          )
        )}
      </group>
    </group>
  );
}
