import { useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../state/game";
import { TABLE_SPOTS } from "../game/eatery";
import type { Customer } from "../game/eatery";
import { eatery, staffLive, subscribeEatery, eaterySnapshot } from "../game/eateryLive";

const GROUND = -0.34;

/** Thobe/abaya colors + headwear rotation so the crowd feels varied. */
const OUTFITS = [
  { body: "#f2ede2", head: "#caa27f", cap: "#ffffff" },
  { body: "#3d4c63", head: "#a9805c", cap: "#22293a" },
  { body: "#7c4a63", head: "#b98a66", cap: "#5d3049" },
  { body: "#4a6b52", head: "#8a6244", cap: "#2f4a38" },
  { body: "#b8b0a0", head: "#c49a72", cap: "#8c2f2a" },
  { body: "#2f2f38", head: "#9a7150", cap: "#c9b268" },
];

/**
 * The souq terrace: rugs and low tables in front of the counter, live
 * customers walking in from the souq gate. Renders whatever the eatery sim
 * says — tables you own, people where they stand.
 */
export function Eatery() {
  const opened = useGame((s) => s.opened);
  const tables = useGame((s) => s.tables);
  // re-mount customer groups when the floor picture changes
  useSyncExternalStore(subscribeEatery, eaterySnapshot);

  return (
    <group>
      {/* terrace slab extending the diorama forward */}
      <RoundedBox args={[8.5, 0.8, 4.2]} radius={0.35} smoothness={6} position={[0, -0.76, 4.55]} receiveShadow>
        <meshStandardMaterial color="#6f3a20" roughness={0.9} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.345, 4.45]} receiveShadow>
        <planeGeometry args={[8, 3.8]} />
        <meshStandardMaterial color="#caa06a" roughness={0.95} />
      </mesh>

      {/* the souq gate people arrive through */}
      <group position={[4.05, GROUND, 5.1]}>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x * 0.55, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 1.5, 10]} />
            <meshStandardMaterial color="#8a5a30" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.0, 10]} />
          <meshStandardMaterial color="#8a5a30" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.36, 0]}>
          <boxGeometry args={[0.9, 0.22, 0.05]} />
          <meshStandardMaterial color="#b5561f" roughness={0.7} />
        </mesh>
      </group>

      {/* tables you own */}
      {TABLE_SPOTS.slice(0, tables).map((spot, i) => (
        <Table key={i} x={spot.x + 0.6} z={spot.z} rug={i % 2 === 0} />
      ))}

      {/* the people */}
      {opened && eatery.customers.map((c) => <Person key={c.id} customer={c} />)}

      {/* the hired hands (each renders only once actually hired) */}
      {[0, 1, 2].map((i) => (
        <Server key={i} idx={i} />
      ))}
      <ChefStation idx={0} position={[-3.1, 0, 1.7]} />
      <ChefStation idx={1} position={[-3.7, 0, 2.6]} />
    </group>
  );
}

/** A hired server — teal vest, carries plates counter → table. */
function Server({ idx }: { idx: number }) {
  const hired = useGame((s) => s.staff.servers) > idx;
  const group = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Mesh>(null);
  const vest = ["#3fb0a4", "#c9803a", "#7c4a63"][idx % 3];

  useFrame((state) => {
    const g = group.current;
    const s = staffLive.servers[idx];
    if (!g || !hired || !s) return;
    const t = state.clock.elapsedTime;
    g.position.set(s.x, GROUND, s.z);
    g.rotation.z = s.phase !== "idle" ? Math.sin(t * 11 + idx * 2) * 0.06 : 0;
    if (plate.current) plate.current.visible = s.carrying !== null;
  });

  if (!hired) return null;
  return (
    <group ref={group}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.22, 0.84, 12]} />
        <meshStandardMaterial color={vest} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 14]} />
        <meshStandardMaterial color="#b98a66" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshStandardMaterial color="#fff3e2" roughness={0.8} />
      </mesh>
      {/* the plate they carry */}
      <mesh ref={plate} position={[0.22, 0.72, 0.1]} visible={false} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.045, 14]} />
        <meshStandardMaterial color="#f2ede2" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** A chef's back pot — steams while a batch is on. */
function ChefStation({ idx, position }: { idx: number; position: [number, number, number] }) {
  const hired = useGame((s) => s.staff.chefs) > idx;
  const potGlow = useRef<THREE.PointLight>(null);
  const body = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!hired) return;
    const cooking = staffLive.chefs[idx]?.cooking != null;
    const t = state.clock.elapsedTime;
    if (potGlow.current) {
      potGlow.current.intensity = cooking ? 1.4 + Math.sin(t * 18) * 0.3 : 0.2;
    }
    if (body.current) {
      // stir bob while a pot is on
      body.current.position.y = GROUND + (cooking ? Math.abs(Math.sin(t * 6 + idx)) * 0.05 : 0);
      body.current.rotation.y = cooking ? Math.sin(t * 3 + idx) * 0.15 : 0.4;
    }
  });

  if (!hired) return null;
  return (
    <group position={position}>
      {/* mini stove + pot */}
      <mesh position={[0, GROUND + 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.28, 14]} />
        <meshStandardMaterial color="#2f2320" roughness={0.5} metalness={0.5} />
      </mesh>
      <pointLight ref={potGlow} position={[0, GROUND + 0.3, 0]} intensity={0.2} distance={1.4} color="#ff7a2a" />
      <mesh position={[0, GROUND + 0.4, 0]} castShadow>
        <sphereGeometry args={[0.26, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshPhysicalMaterial color="#c9743a" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* the chef */}
      <group ref={body} position={[0.5, GROUND, 0.25]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.24, 0.84, 12]} />
          <meshStandardMaterial color="#e8e2d4" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.98, 0]} castShadow>
          <sphereGeometry args={[0.15, 16, 14]} />
          <meshStandardMaterial color="#a9805c" roughness={0.7} />
        </mesh>
        {/* chef hat */}
        <mesh position={[0, 1.14, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 0.16, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.23, 0]} castShadow>
          <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Table({ x, z, rug }: { x: number; z: number; rug: boolean }) {
  return (
    <group position={[x, GROUND, z]}>
      {rug && (
        <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[-0.3, 0.006, 0]} receiveShadow>
          <planeGeometry args={[1.9, 1.5]} />
          <meshStandardMaterial color="#8c2f2a" roughness={1} />
        </mesh>
      )}
      {/* low round souq table */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.36, 0.09, 18]} />
        <meshStandardMaterial color="#9a6234" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 10]} />
        <meshStandardMaterial color="#7a4a26" roughness={0.8} />
      </mesh>
      {/* floor cushions */}
      {[[-0.62, 0.1], [0.5, 0.5], [0.45, -0.55]].map(([cx, cz], i) => (
        <RoundedBox key={i} args={[0.34, 0.12, 0.34]} radius={0.05} position={[cx, 0.06, cz]} castShadow>
          <meshStandardMaterial color={["#c9803a", "#3fb0a4", "#e79ab0"][i]} roughness={0.9} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Person({ customer }: { customer: Customer }) {
  const group = useRef<THREE.Group>(null);
  const orbMat = useRef<THREE.MeshStandardMaterial>(null);
  const orb = useRef<THREE.Mesh>(null);
  const outfit = OUTFITS[customer.id % OUTFITS.length];
  const cGreen = useMemo(() => new THREE.Color("#8fd06a"), []);
  const cRed = useMemo(() => new THREE.Color("#e8624a"), []);
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const c = customer;
    const t = state.clock.elapsedTime;
    const walking = c.phase === "arriving" || c.phase === "toTable" || c.phase === "leaving";
    g.position.set(c.x, GROUND, c.z);
    // waddle while walking, gentle bob while eating
    g.rotation.z = walking ? Math.sin(t * 9 + c.id) * 0.07 : 0;
    const eatBob = c.phase === "eating" ? Math.abs(Math.sin(t * 5 + c.id)) * 0.04 : 0;
    g.position.y = GROUND + eatBob;

    // patience orb: green → red while they wait; hidden otherwise
    const waitingish = c.phase === "waiting" || c.phase === "queueing";
    if (orb.current) orb.current.visible = waitingish;
    if (orbMat.current && waitingish) {
      scratch.copy(cRed).lerp(cGreen, Math.max(0, c.patience));
      orbMat.current.color.copy(scratch);
      orbMat.current.emissive.copy(scratch);
    }
  });

  return (
    <group ref={group} position={[customer.x, GROUND, customer.z]}>
      {/* body — a soft thobe cone */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.24, 0.84, 12]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 14]} />
        <meshStandardMaterial color={outfit.head} roughness={0.7} />
      </mesh>
      {/* cap / ghutra */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshStandardMaterial color={outfit.cap} roughness={0.8} />
      </mesh>
      {/* patience orb */}
      <mesh ref={orb} position={[0, 1.42, 0]} visible={false}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial ref={orbMat} color="#8fd06a" emissive="#8fd06a" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      {/* their order floats subtly while they wait at the table */}
      {customer.phase === "eating" && (
        <mesh position={[0, 0.28, 0.26]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.05, 12]} />
          <meshStandardMaterial color="#e9d4b6" roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}
