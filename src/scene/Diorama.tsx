import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RoundedBox,
  Environment,
  ContactShadows,
  Float,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import { Halwa } from "./Halwa";
import { Chef } from "./Chef";
import { useGame } from "../state/game";
import {
  makeAwningTexture,
  makeLatticeTexture,
  makeRugTexture,
  makeTileTexture,
} from "./textures";

/**
 * A cozy Khaliji street-food stall as a handheld diorama. Hand-modeled
 * stylized props — striped awning, rug, spice sacks, dallah, lanterns —
 * around the hero copper pot.
 */
export function Diorama() {
  const rig = useRef<THREE.Group>(null);
  const phase = useGame((s) => s.phase);
  const tex = useMemo(
    () => ({
      awning: makeAwningTexture(),
      tiles: makeTileTexture(),
      rug: makeRugTexture(),
      lattice: makeLatticeTexture(),
    }),
    []
  );

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

      {/* ---------- HANGING BRASS LANTERNS (bloom bait) ---------- */}
      {[-2.1, 0, 2.1].map((x, i) => (
        <group key={i} position={[x, 3.05, -1.3]}>
          {/* cord + brass crown */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
            <meshStandardMaterial color="#3a2418" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <coneGeometry args={[0.14, 0.16, 6]} />
            <meshStandardMaterial color="#b8834a" metalness={0.9} roughness={0.35} />
          </mesh>
          {/* hexagonal glass body, glowing warm */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.1, 0.3, 6]} />
            <meshStandardMaterial
              color="#ffcf87"
              emissive="#ffae3a"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          {/* brass rings binding the glass */}
          {[0.15, -0.15].map((y, r) => (
            <mesh key={r} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[y > 0 ? 0.135 : 0.105, 0.018, 8, 6]} />
              <meshStandardMaterial color="#b8834a" metalness={0.9} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, -0.18, 0]} castShadow>
            <coneGeometry args={[0.1, 0.1, 6]} />
            <meshStandardMaterial color="#b8834a" metalness={0.9} roughness={0.35} />
          </mesh>
          <pointLight
            position={[0, -0.25, 0]}
            intensity={4}
            distance={5}
            color="#ffb765"
          />
        </group>
      ))}

      {/* dust motes drifting through the lamplight */}
      <Sparkles
        count={30}
        scale={[6, 1.4, 2.5]}
        position={[0, 2.45, -1.1]}
        size={1.6}
        speed={0.18}
        opacity={0.3}
        color="#ffd9a8"
      />

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
        <meshStandardMaterial map={tex.tiles} roughness={0.85} />
      </mesh>
      {/* woven rug in front of the counter */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.3, -0.325, 2.35]}
        receiveShadow
      >
        <planeGeometry args={[3.4, 1.6]} />
        <meshStandardMaterial map={tex.rug} roughness={1} />
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
      {/* glowing arched window behind the chef */}
      <group position={[0, 2.05, -2.39]}>
        <mesh position={[0, 0, 0.031]}>
          <circleGeometry args={[0.5, 24, 0, Math.PI]} />
          <meshStandardMaterial
            color="#ffc87a"
            emissive="#ff9e3a"
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[1.0, 0.7, 0.06]} />
          <meshStandardMaterial
            color="#ffc87a"
            emissive="#ff9e3a"
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
        {/* lattice bars */}
        {[-0.25, 0, 0.25].map((x, i) => (
          <mesh key={i} position={[x, -0.22, 0.02]}>
            <boxGeometry args={[0.05, 0.95, 0.08]} />
            <meshStandardMaterial color="#5e2f18" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.2, 0.02]}>
          <boxGeometry args={[1.05, 0.05, 0.08]} />
          <meshStandardMaterial color="#5e2f18" roughness={0.8} />
        </mesh>
      </group>

      {/* ---------- STRIPED AWNING over the back wall ---------- */}
      <group position={[0, 3.0, -1.45]}>
        <mesh rotation={[0.42, 0, 0]} position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[8.2, 0.05, 2.1]} />
          <meshStandardMaterial map={tex.awning} roughness={0.9} />
        </mesh>
        {/* scalloped front edge — small half-discs hanging off the lip */}
        {Array.from({ length: 20 }, (_, i) => {
          const x = -3.9 + i * 0.41;
          return (
            <mesh
              key={i}
              position={[x, 0.02, 0.97]}
              scale={[1, 1, 0.22]}
              castShadow
            >
              <sphereGeometry args={[0.21, 12, 8]} />
              <meshStandardMaterial
                color={i % 2 ? "#f3e9d2" : "#c0392b"}
                roughness={0.9}
              />
            </mesh>
          );
        })}
      </group>

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
      {/* geometric lattice band on the counter front */}
      <mesh position={[0, 0.08, 1.86]}>
        <planeGeometry args={[4.9, 0.62]} />
        <meshStandardMaterial map={tex.lattice} roughness={0.8} />
      </mesh>

      {/* ---------- DISPLAY: little brass bowls of finished halwa ---------- */}
      {[[0.75, 1.25], [-1.5, 1.3]].map(([x, z], i) => (
        <group key={i} position={[x, 0.78, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.15, 0.14, 20]} />
            <meshStandardMaterial color="#e0a05a" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]} scale={[1, 0.5, 1]} castShadow>
            <sphereGeometry args={[0.19, 20, 14]} />
            <meshPhysicalMaterial
              color="#b5561f"
              roughness={0.15}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
            />
          </mesh>
          {/* pistachio sprinkle */}
          {[-0.06, 0.05, 0].map((px, j) => (
            <mesh key={j} position={[px, 0.16, j * 0.07 - 0.02]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#7fae5a" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---------- DALLAH (brass coffee pot) on the counter ---------- */}
      <group position={[-2.05, 0.74, 1.35]} scale={0.9}>
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.2, 0.3, 20]} />
          <meshStandardMaterial color="#d9a05a" metalness={0.95} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.16, 0.2, 20]} />
          <meshStandardMaterial color="#d9a05a" metalness={0.95} roughness={0.25} />
        </mesh>
        {/* lid + crescent finial */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <coneGeometry args={[0.1, 0.18, 16]} />
          <meshStandardMaterial color="#d9a05a" metalness={0.95} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color="#e8c07a" metalness={1} roughness={0.2} />
        </mesh>
        {/* long curved spout */}
        <mesh position={[0.17, 0.16, 0]} rotation={[0, 0, -0.5]} castShadow>
          <torusGeometry args={[0.16, 0.028, 8, 16, Math.PI * 0.75]} />
          <meshStandardMaterial color="#d9a05a" metalness={0.95} roughness={0.25} />
        </mesh>
        {/* handle */}
        <mesh position={[-0.17, 0.18, 0]} rotation={[0, 0, Math.PI * 0.9]} castShadow>
          <torusGeometry args={[0.13, 0.022, 8, 16, Math.PI * 0.8]} />
          <meshStandardMaterial color="#d9a05a" metalness={0.95} roughness={0.25} />
        </mesh>
      </group>

      {/* ---------- SPICE SACKS on the floor ---------- */}
      {[
        { x: -2.7, z: 1.9, spice: "#e6b422" },
        { x: -2.1, z: 2.5, spice: "#b23a2e" },
        { x: -3.1, z: 2.7, spice: "#3f7d6e" },
      ].map((s, i) => (
        <group key={i} position={[s.x, -0.34, s.z]} rotation={[0, i * 1.1, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.34, 0.36, 14]} />
            <meshStandardMaterial color="#b99b6b" roughness={1} />
          </mesh>
          {/* rolled rim */}
          <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.29, 0.055, 10, 16]} />
            <meshStandardMaterial color="#a5875a" roughness={1} />
          </mesh>
          {/* spice mound */}
          <mesh position={[0, 0.42, 0]} castShadow>
            <coneGeometry args={[0.26, 0.18, 14]} />
            <meshStandardMaterial color={s.spice} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ---------- POTTED PALM in the corner ---------- */}
      <group position={[3.3, -0.34, -1.7]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.22, 0.5, 14]} />
          <meshStandardMaterial color="#a5502e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.09, 0.5, 8]} />
          <meshStandardMaterial color="#6a4526" roughness={0.95} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3]}
              rotation={[
                Math.sin(a) * 1.0,
                0,
                -Math.cos(a) * 1.0,
              ]}
              scale={[0.16, 0.7, 0.5]}
              castShadow
            >
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshStandardMaterial color="#4f8a4f" roughness={0.85} />
            </mesh>
          );
        })}
      </group>

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
