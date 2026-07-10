import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RoundedBox,
  Environment,
  ContactShadows,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import { Halwa } from "./Halwa";
import { Chef } from "./Chef";
import { useGame } from "../state/game";

/**
 * V1 milestone 1: a cozy Khaliji street-food stall as a handheld diorama.
 * Placeholder shapes — the goal here is MOOD (lighting, palette, post) not
 * final art. Hero object is the copper pot with glossy halwa.
 */
export function Diorama() {
  const rig = useRef<THREE.Group>(null);
  const phase = useGame((s) => s.phase);

  // subtle idle world-drift so it feels alive — but freeze during the
  // mini-games so the DOM overlays stay locked over the plate / pot.
  useFrame((state, dt) => {
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
    const relaxed = phase === "idle" || phase === "select" || phase === "shop";
    const targetRotY = relaxed ? Math.sin(t * 0.18) * 0.08 : 0;
    const targetPosY = relaxed ? Math.sin(t * 0.5) * 0.03 : 0;
    const k = 1 - Math.pow(0.02, dt);
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, targetRotY, k);
    rig.current.position.y = THREE.MathUtils.lerp(rig.current.position.y, targetPosY, k);
  });

  return (
    <group ref={rig}>
      {/* ---------- LIGHTING ---------- */}
      <ambientLight intensity={0.35} color="#ffd9a8" />
      {/* warm key light */}
      <directionalLight
        position={[4, 7, 4]}
        intensity={2.4}
        color="#ffcf87"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-6, 6, 6, -6, 0.1, 30]}
        />
      </directionalLight>
      {/* cool teal rim/fill for contrast */}
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#4bb6b0" />
      <Environment preset="sunset" />

      {/* ---------- HANGING WARM LIGHTS (bloom bait) ---------- */}
      {[-2.1, 0, 2.1].map((x, i) => (
        <group key={i} position={[x, 3.1, -1.3]}>
          {/* little cord + shade so it reads as a hanging lamp */}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
            <meshStandardMaterial color="#3a2418" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow>
            <coneGeometry args={[0.22, 0.24, 16, 1, true]} />
            <meshStandardMaterial color="#8a4a26" roughness={0.6} metalness={0.3} side={2} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color="#ffcf87"
              emissive="#ffae3a"
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, -0.2, 0]}
            intensity={4}
            distance={5}
            color="#ffb765"
          />
        </group>
      ))}

      {/* ---------- DIORAMA PLINTH (the "held in palm" base) ---------- */}
      <RoundedBox
        args={[8.5, 0.8, 6]}
        radius={0.35}
        smoothness={6}
        position={[0, -0.75, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#7a3b22" roughness={0.9} />
      </RoundedBox>
      {/* floor tiles */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.34, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 5.6]} />
        <meshStandardMaterial color="#b5763f" roughness={0.85} />
      </mesh>

      {/* ---------- BACK WALL + ARCH (Khaliji vibe) ---------- */}
      <RoundedBox
        args={[8, 3.6, 0.4]}
        radius={0.2}
        smoothness={4}
        position={[0, 1.3, -2.6]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#c98a4f" roughness={0.95} />
      </RoundedBox>
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={i} position={[x, 1.9, -2.35]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 3.3, 12]} />
          <meshStandardMaterial color="#e0b483" roughness={0.9} />
        </mesh>
      ))}

      {/* ---------- STALL COUNTER ---------- */}
      <RoundedBox
        args={[5.2, 1.1, 1.7]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.05, 1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#8a4a26" roughness={0.7} />
      </RoundedBox>
      {/* counter top */}
      <RoundedBox
        args={[5.4, 0.16, 1.9]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.66, 1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#5e2f18" roughness={0.5} />
      </RoundedBox>

      {/* ---------- STOVE + HERO COPPER POT + LIVE HALWA ---------- */}
      <Halwa />

      {/* ---------- PREP PLATE ---------- */}
      <group position={[1.75, 0.75, 0.9]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.62, 0.09, 32]} />
          <meshStandardMaterial color="#efe3cf" roughness={0.55} />
        </mesh>
        {/* ingredient blobs (placeholders) */}
        {[
          ["#f4d58d", -0.28, 0.18],
          ["#c98a4f", 0.24, -0.1],
          ["#e8c07a", 0.05, 0.28],
        ].map(([c, x, z], i) => (
          <mesh key={i} position={[x as number, 0.12, z as number]} castShadow>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshStandardMaterial color={c as string} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* ---------- INGREDIENT SHELF ---------- */}
      <group position={[2.3, 1.5, -2.15]}>
        <RoundedBox args={[1.8, 0.12, 0.5]} radius={0.04} smoothness={3} castShadow>
          <meshStandardMaterial color="#5e2f18" roughness={0.7} />
        </RoundedBox>
        {[-0.55, 0, 0.55].map((x, i) => (
          <Float key={i} speed={2} floatIntensity={0.15} rotationIntensity={0.1}>
            <mesh position={[x, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.16, 0.42, 16]} />
              <meshStandardMaterial
                color={["#e6b422", "#b23a2e", "#3f7d6e"][i]}
                roughness={0.5}
              />
            </mesh>
          </Float>
        ))}
      </group>

      {/* ---------- CHEF (reacts to cooking + a 5-star cheer) ---------- */}
      <Chef />

      {/* soft grounding shadow */}
      <ContactShadows
        position={[0, -0.32, 0.6]}
        opacity={0.5}
        scale={12}
        blur={2.6}
        far={4}
        color="#1a0a04"
      />
    </group>
  );
}
