import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cookViz } from "../game/cookViz";
import { Steam } from "./Steam";

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
      {/* stove body */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.28, 1.3]} />
        <meshStandardMaterial color="#2f2320" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* flame ring + glow */}
      <pointLight ref={flameRef} position={[0, 0.25, 0]} intensity={2.2} distance={2.4} color="#ff7a2a" />
      <mesh ref={flameMesh} position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 20]} />
        <meshStandardMaterial color="#ff8a3a" emissive="#ff6a1a" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* pot + halwa */}
      <group position={[0, 0.42, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.42, 0.4, 40]} />
          <meshStandardMaterial color="#c9743a" metalness={0.95} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.19, 0]} castShadow>
          <torusGeometry args={[0.49, 0.045, 14, 40]} />
          <meshStandardMaterial color="#e0a05a" metalness={1} roughness={0.2} />
        </mesh>

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
