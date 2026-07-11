import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { cookViz } from "../game/cookViz";
import { Steam } from "./Steam";

/** Rounded-belly copper pot profile, y 0 (base) → 0.46 (flared lip). */
const POT_PROFILE = [
  [0.0, 0.0],
  [0.3, 0.0],
  [0.44, 0.03],
  [0.52, 0.16],
  [0.51, 0.28],
  [0.46, 0.38],
  [0.47, 0.43],
  [0.53, 0.46],
].map(([x, y]) => new THREE.Vector2(x, y));

/**
 * The hero: copper pot + glossy halwa that cooks live. Reads the cookViz
 * singleton every frame (no React churn) so the dough visibly turns from pale
 * starch to a gooey, glossy amber, bubbles with the stir, scorches if burnt,
 * and sparkles when a timed ingredient lands.
 */
export function Halwa() {
  const surfRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const flameRef = useRef<THREE.PointLight>(null);
  const flameMesh = useRef<THREE.Mesh>(null);
  const sparkGroup = useRef<THREE.Group>(null);

  // scratch colors reused each frame
  const c = useMemo(
    () => ({
      raw: new THREE.Color("#e7d3a8"),
      cooked: new THREE.Color("#b5561f"),
      char: new THREE.Color("#2a1206"),
      out: new THREE.Color(),
    }),
    []
  );

  // a small pool of sparkles for the "perfect timing" burst
  const sparks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        a: (i / 10) * Math.PI * 2,
        r: 0.12 + (i % 3) * 0.06,
        speed: 0.9 + (i % 4) * 0.25,
      })),
    []
  );
  const lastSpark = useRef(0);
  const sparkT = useRef(1); // 1 = idle/finished

  useFrame((state, dt) => {
    const v = cookViz;
    const t = state.clock.elapsedTime;

    // ---- halwa surface material ----
    if (matRef.current) {
      c.raw.set(v.rawColor);
      c.cooked.set(v.cookedColor);
      c.out.copy(c.raw).lerp(c.cooked, THREE.MathUtils.clamp(v.progress, 0, 1));
      // scorch toward char as it burns
      c.out.lerp(c.char, v.burn * 0.8);
      matRef.current.color.copy(c.out);
      // sheen: glossier and more emissive as it cooks & stays wet
      const gloss = v.sheen * (1 - v.burn * 0.7);
      matRef.current.roughness = THREE.MathUtils.lerp(0.55, 0.08, gloss);
      matRef.current.emissive.copy(c.cooked);
      matRef.current.emissiveIntensity = 0.15 + v.progress * 0.35 * (1 - v.burn);
    }

    // ---- bubbling: gentle vertical wobble + surface breathing ----
    if (surfRef.current) {
      const b = v.active ? v.bubble : 0;
      const wob = 1 + Math.sin(t * (6 + b * 8)) * 0.03 * (0.3 + b);
      surfRef.current.scale.set(1, 0.4 * wob, 1); // squashed sphere → glossy dome
      surfRef.current.position.y = 0.14 + b * 0.012 * Math.sin(t * 9);
    }

    // ---- flame reacts to heat ----
    const heat = v.active ? v.heat : 0.45;
    if (flameRef.current) {
      flameRef.current.intensity = 1.6 + heat * 2.4 + Math.sin(t * 20) * 0.25;
    }
    if (flameMesh.current) {
      const s = 0.85 + heat * 0.5 + Math.sin(t * 16) * 0.06;
      flameMesh.current.scale.set(s, 1, s);
    }

    // ---- sparkle burst on perfect timed-add ----
    if (v.sparkAt !== lastSpark.current) {
      lastSpark.current = v.sparkAt;
      sparkT.current = 0;
    }
    if (sparkGroup.current) {
      if (sparkT.current < 1) {
        sparkT.current = Math.min(1, sparkT.current + dt * 1.6);
        const p = sparkT.current;
        sparkGroup.current.visible = true;
        sparkGroup.current.children.forEach((ch, i) => {
          const sp = sparks[i];
          const rise = p * sp.speed;
          ch.position.set(
            Math.cos(sp.a) * sp.r * (1 + p),
            0.28 + rise * 0.6,
            Math.sin(sp.a) * sp.r * (1 + p)
          );
          const sc = (1 - p) * 0.06;
          ch.scale.setScalar(Math.max(0.001, sc));
        });
      } else {
        sparkGroup.current.visible = false;
      }
    }
  });

  return (
    <group position={[-0.35, 0.74, 0.55]}>
      {/* stove body — dark iron with brass feet and trim */}
      <RoundedBox args={[1.5, 0.28, 1.3]} radius={0.06} smoothness={4} castShadow>
        <meshStandardMaterial color="#2f2320" roughness={0.45} metalness={0.6} />
      </RoundedBox>
      {[[-0.62, -0.5], [0.62, -0.5], [-0.62, 0.5], [0.62, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.16, z]} castShadow>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#e0a05a" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.022, 10, 36]} />
        <meshStandardMaterial color="#e0a05a" metalness={1} roughness={0.3} />
      </mesh>
      {/* flame ring + glow */}
      <pointLight ref={flameRef} position={[0, 0.25, 0]} intensity={2.2} distance={2.4} color="#ff7a2a" />
      <mesh ref={flameMesh} position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 20]} />
        <meshStandardMaterial color="#ff8a3a" emissive="#ff6a1a" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* pot + halwa */}
      <group position={[0, 0.42, 0]}>
        {/* rounded-belly copper body with a flared lip */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <latheGeometry args={[POT_PROFILE, 48]} />
          <meshPhysicalMaterial
            color="#c9743a"
            metalness={0.9}
            roughness={0.32}
            clearcoat={0.6}
            clearcoatRoughness={0.4}
          />
        </mesh>
        {/* brass side handles */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.53, 0.02, 0]}
            rotation={[0, 0, (s * Math.PI) / 2]}
            castShadow
          >
            <torusGeometry args={[0.11, 0.028, 10, 20, Math.PI]} />
            <meshStandardMaterial color="#e0a05a" metalness={1} roughness={0.25} />
          </mesh>
        ))}
        {/* long wooden stirring paddle resting against the rim */}
        <group position={[0.3, 0.42, -0.22]} rotation={[0.5, 0.5, -0.9]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.03, 0.85, 10]} />
            <meshStandardMaterial color="#8a5a30" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.46, 0]} scale={[1, 1.6, 0.45]} castShadow>
            <sphereGeometry args={[0.07, 14, 12]} />
            <meshStandardMaterial color="#7a4a26" roughness={0.85} />
          </mesh>
        </group>

        {/* the halwa itself — a glossy domed mound filling the pot */}
        <mesh ref={surfRef} position={[0, 0.16, 0]} scale={[1, 0.46, 1]} castShadow>
          <sphereGeometry args={[0.47, 40, 28]} />
          <meshStandardMaterial ref={matRef} color="#e7d3a8" roughness={0.5} metalness={0.15} />
        </mesh>

        {/* sparkle burst pool */}
        <group ref={sparkGroup} position={[0, 0.0, 0]} visible={false}>
          {sparks.map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[1, 6, 6]} />
              <meshStandardMaterial color="#ffe6a0" emissive="#ffcf5a" emissiveIntensity={3} toneMapped={false} />
            </mesh>
          ))}
        </group>

        <Steam position={[0, 0.4, 0]} />
      </group>
    </group>
  );
}
