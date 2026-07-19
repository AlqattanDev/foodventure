import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { cookViz, SCORCH_N } from "../game/cookViz";
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

/** Pot-space [-1,1] → world horizontal distance inside the pot. */
const POT_R = 0.4;
/** Height of the halwa dome surface at horizontal distance d from center. */
function domeY(d: number): number {
  const rr = 0.47 * 0.47 - Math.min(d * d, 0.46 * 0.46);
  return 0.14 + 0.4 * Math.sqrt(Math.max(0.0001, rr));
}

/**
 * The hero: copper pot + glossy halwa that cooks live. Reads the cookViz
 * singleton every frame (no React churn). V3: the pot IS the interface —
 * neglected patches visibly darken and smoke, the paddle follows the finger,
 * pours fall as real streams, ghee pools and melts in, the rim bubbles tell
 * the heat.
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
      // translucency read: the cooked mass lets light through
      matRef.current.opacity = 0.94;
      matRef.current.transparent = true;
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

        {/* the halwa itself — a glossy domed mound filling the pot */}
        <mesh ref={surfRef} position={[0, 0.16, 0]} scale={[1, 0.46, 1]} castShadow>
          <sphereGeometry args={[0.47, 40, 28]} />
          <meshStandardMaterial ref={matRef} color="#e7d3a8" roughness={0.5} metalness={0.15} />
        </mesh>

        <ScorchPatches />
        <Paddle />
        <PourStream />
        <GheePool />
        <RimBubbles />
        <ScorchSmoke />

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

/* ------------------------------------------------------------------ */
/* V3: the pot as interface                                            */
/* ------------------------------------------------------------------ */

/**
 * Dark patches exactly where the stir sim says the halwa is sticking or
 * scorched — one instanced blob per grid cell, scaled by how bad it is.
 */
function ScorchPatches() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const cells = useMemo(() => {
    const out: { x: number; z: number; idx: number }[] = [];
    for (let j = 0; j < SCORCH_N; j++) {
      for (let i = 0; i < SCORCH_N; i++) {
        const x = ((i + 0.5) / SCORCH_N) * 2 - 1;
        const y = ((j + 0.5) / SCORCH_N) * 2 - 1;
        if (x * x + y * y <= 1.02) out.push({ x, z: y, idx: j * SCORCH_N + i });
      }
    }
    return out;
  }, []);

  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const v = cookViz;
    cells.forEach((cell, k) => {
      const stick = v.stick[cell.idx];
      const scorch = v.scorch[cell.idx];
      // darkening starts as the stick passes ~0.35; scorch is always visible
      const dark = Math.max(0, stick - 0.35) / 0.65;
      const amount = v.active ? Math.min(1, dark * 0.6 + scorch * 1.4) : 0;
      const wx = cell.x * POT_R;
      const wz = cell.z * POT_R;
      const d = Math.hypot(wx, wz);
      dummy.position.set(wx, domeY(d) + 0.008, wz);
      dummy.scale.set(amount * 0.11, amount * 0.02 + 0.001, amount * 0.11);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
      // brown darkening → charred black as scorch takes over
      color.setRGB(0.23, 0.11, 0.04).lerp(BLACK, Math.min(1, scorch * 1.5));
      m.setColorAt(k, color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial roughness={0.85} metalness={0.05} />
    </instancedMesh>
  );
}
const BLACK = new THREE.Color("#120701");

/** The wooden paddle — rests on the rim, follows the finger while stirring. */
function Paddle() {
  const ref = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(0.3, 0.42, -0.22), []);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const v = cookViz;
    const k = 1 - Math.pow(0.0001, dt);
    if (v.paddleActive) {
      target.set(v.paddleX * POT_R * 0.85, 0.4, v.paddleY * POT_R * 0.85);
      g.position.lerp(target, k);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.18, k);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -0.15, k);
    } else {
      target.set(0.3, 0.42, -0.22);
      g.position.lerp(target, k * 0.4);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.5, k * 0.4);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -0.9, k * 0.4);
    }
  });

  return (
    <group ref={ref} position={[0.3, 0.42, -0.22]} rotation={[0.5, 0.5, -0.9]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.85, 10]} />
        <meshStandardMaterial color="#8a5a30" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.46, 0]} scale={[1, 1.6, 0.45]} castShadow>
        <sphereGeometry args={[0.07, 14, 12]} />
        <meshStandardMaterial color="#7a4a26" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** A real falling stream when something is poured into the pot. */
function PourStream() {
  const stream = useRef<THREE.Mesh>(null);
  const splash = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const splashMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const v = cookViz;
    const t = state.clock.elapsedTime;
    const on = v.active && v.streamRate > 0.02;
    if (stream.current) {
      stream.current.visible = on;
      if (on) {
        const r = 0.012 + v.streamRate * 0.045;
        stream.current.scale.set(r * (1 + Math.sin(t * 30) * 0.12), 1, r);
      }
    }
    if (mat.current) mat.current.color.set(v.streamColor);
    if (splash.current && splashMat.current) {
      splash.current.visible = on;
      if (on) {
        const s = 0.08 + v.streamRate * 0.12 + Math.sin(t * 18) * 0.015;
        splash.current.scale.set(s, 0.012, s);
        splashMat.current.color.set(v.streamColor);
        splashMat.current.opacity = 0.75;
      }
    }
  });

  return (
    <>
      {/* unit cylinder centered at its position; scaled per frame */}
      <mesh ref={stream} position={[0.06, 0.72, 0.05]} visible={false}>
        <cylinderGeometry args={[1, 0.8, 0.8, 10]} />
        <meshStandardMaterial ref={mat} roughness={0.25} metalness={0} toneMapped />
      </mesh>
      <mesh ref={splash} position={[0.06, domeY(0.08) + 0.012, 0.05]} visible={false}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial ref={splashMat} transparent opacity={0.75} roughness={0.2} />
      </mesh>
    </>
  );
}

/** Fresh ghee: a glossy pool that spreads and melts into the mass. */
function GheePool() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const g = cookViz.active ? cookViz.gheePool : 0;
    m.visible = g > 0.02;
    if (m.visible) {
      // spreads wider as it melts down
      const spread = 0.1 + (1 - g) * 0.16;
      m.scale.set(spread, 0.02 + g * 0.03, spread);
      (m.material as THREE.MeshPhysicalMaterial).opacity = 0.55 + g * 0.35;
    }
  });
  return (
    <mesh ref={ref} position={[0, domeY(0.02) + 0.012, 0]} visible={false}>
      <sphereGeometry args={[1, 18, 10]} />
      <meshPhysicalMaterial
        color="#ffd96a"
        transparent
        opacity={0.85}
        roughness={0.05}
        clearcoat={1}
        emissive="#c98f1e"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

/** Bubbles beading at the rim — the thermometer you read instead of a gauge. */
function RimBubbles() {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        a: (i / 16) * Math.PI * 2 + (i % 3) * 0.1,
        phase: i * 1.7,
        // low heat = only rim bubbles; high heat = bubbles wander inward
        rimBias: 0.7 + (i % 4) * 0.1,
      })),
    []
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const v = cookViz;
    const t = state.clock.elapsedTime;
    const b = v.active ? v.bubble : 0;
    g.visible = b > 0.06;
    if (!g.visible) return;
    g.children.forEach((ch, i) => {
      const s = seeds[i];
      // more bubbles participate as it gets hotter
      const on = i / seeds.length < b * 1.15;
      const life = (t * (0.8 + b * 1.6) + s.phase) % 1;
      // rolling boil pulls bubbles toward the middle
      const rr = (s.rimBias - Math.max(0, b - 0.55) * 0.55 * ((i % 5) / 5)) * 0.42;
      const d = Math.min(rr, 0.4);
      ch.visible = on;
      if (on) {
        ch.position.set(Math.cos(s.a) * d, domeY(d) + 0.01 + life * 0.02, Math.sin(s.a) * d);
        const sc = (0.008 + b * 0.02) * Math.sin(life * Math.PI);
        ch.scale.setScalar(Math.max(0.001, sc));
      }
    });
  });

  return (
    <group ref={group} visible={false}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#fff2d8" transparent opacity={0.8} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** Thin dark smoke rising from the exact spot you're burning. */
function ScorchSmoke() {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({ offset: i / 5, drift: (i % 3) - 1 })),
    []
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const v = cookViz;
    const amt = v.active ? v.smokeAmount : 0;
    g.visible = amt > 0.08;
    if (!g.visible) return;
    const t = state.clock.elapsedTime;
    const bx = v.smokeX * POT_R;
    const bz = v.smokeY * POT_R;
    g.children.forEach((ch, i) => {
      const p = puffs[i];
      const life = (t * 0.5 + p.offset) % 1;
      ch.position.set(
        bx + Math.sin(life * 5 + i) * 0.05 + p.drift * 0.02 * life,
        domeY(Math.hypot(bx, bz)) + life * 0.85,
        bz
      );
      const s = (0.02 + life * 0.09) * (0.4 + amt);
      ch.scale.setScalar(s);
      ((ch as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
        Math.sin(life * Math.PI) * 0.3 * amt;
    });
  });

  return (
    <group ref={group} visible={false}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color="#241812" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
