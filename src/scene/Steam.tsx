import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Cheap curling steam puffs rising off the pot. */
export function Steam({ position = [0, 0, 0] as [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: (Math.sin(i * 2.3) * 0.1),
        z: (Math.cos(i * 1.7) * 0.1),
        offset: i / 6,
        scale: 0.05 + (i % 3) * 0.02,
      })),
    []
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const p = puffs[i];
      const life = (t * 0.35 + p.offset) % 1;
      child.position.y = life * 1.1;
      child.position.x = p.x + Math.sin(life * 6 + i) * 0.08;
      child.position.z = p.z;
      const s = p.scale * (0.5 + life * 1.6);
      child.scale.setScalar(s);
      (child as THREE.Mesh).material &&
        ((((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
          Math.sin(life * Math.PI) * 0.16));
    });
  });

  return (
    <group ref={group} position={position}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#f3ece0" transparent opacity={0.14} depthWrite={false} toneMapped />
        </mesh>
      ))}
    </group>
  );
}
