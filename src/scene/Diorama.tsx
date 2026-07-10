import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RoundedBox,
  Environment,
  ContactShadows,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import { Steam } from "./Steam";

/**
 * V1 milestone 1: a cozy Khaliji street-food stall as a handheld diorama.
 * Placeholder shapes — the goal here is MOOD (lighting, palette, post) not
 * final art. Hero object is the copper pot with glossy halwa.
 */
export function Diorama() {
  const rig = useRef<THREE.Group>(null);

  // subtle idle camera drift so the little world feels alive
  useFrame((state) => {
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
    rig.current.rotation.y = Math.sin(t * 0.18) * 0.08;
    rig.current.position.y = Math.sin(t * 0.5) * 0.03;
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
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial
              color="#ffb64d"
              emissive="#ffae3a"
              emissiveIntensity={4}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, -0.2, 0]}
            intensity={6}
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

      {/* ---------- STOVE (hero, centered) ---------- */}
      <group position={[-0.35, 0.74, 0.55]}>
        <RoundedBox args={[1.5, 0.28, 1.3]} radius={0.06} smoothness={4} castShadow>
          <meshStandardMaterial color="#2f2320" roughness={0.4} metalness={0.6} />
        </RoundedBox>
        {/* flame glow */}
        <pointLight position={[0, 0.25, 0]} intensity={2.2} distance={2} color="#ff7a2a" />
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.05, 20]} />
          <meshStandardMaterial
            color="#ff8a3a"
            emissive="#ff6a1a"
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>

        {/* ---------- HERO: COPPER POT + GLOSSY HALWA ---------- */}
        <group position={[0, 0.42, 0]}>
          {/* pot body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.42, 0.5, 32]} />
            <meshStandardMaterial
              color="#c9743a"
              metalness={0.95}
              roughness={0.28}
            />
          </mesh>
          {/* pot rim */}
          <mesh position={[0, 0.26, 0]} castShadow>
            <torusGeometry args={[0.5, 0.05, 12, 32]} />
            <meshStandardMaterial color="#e0a05a" metalness={1} roughness={0.2} />
          </mesh>
          {/* the halwa — gooey, glossy, glowing warm */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.14, 32]} />
            <meshStandardMaterial
              color="#c1421f"
              emissive="#5a1400"
              emissiveIntensity={0.5}
              roughness={0.12}
              metalness={0.1}
            />
          </mesh>
          <Steam position={[0, 0.4, 0]} />
        </group>
      </group>

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

      {/* ---------- CHEF (placeholder, behind counter) ---------- */}
      <group position={[1.15, 0.35, -0.55]} scale={0.82}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.32, 0.66, 8, 16]} />
          <meshStandardMaterial color="#d94f2a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.27, 24, 24]} />
          <meshStandardMaterial color="#b87a52" roughness={0.75} />
        </mesh>
        {/* chef hat */}
        <mesh position={[0, 1.42, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.21, 0.28, 20]} />
          <meshStandardMaterial color="#f2ede2" roughness={0.9} />
        </mesh>
      </group>

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
