import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { useState } from "react";
import { Diorama } from "./scene/Diorama";
import { CameraRig } from "./scene/CameraRig";
import { GameUI } from "./ui/GameUI";
import { useGame } from "./state/game";

export default function App() {
  const [dpr, setDpr] = useState(1.5);
  const phase = useGame((s) => s.phase);
  // during the close-up mini-games, back off the "tiny world" DoF so the
  // pot / plate stay crisp under the finger.
  const closeUp = phase === "cook";

  return (
    <>
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 4.4, 6.6], fov: 34, near: 0.1, far: 100 }}
      >
        {/* warm cozy backdrop */}
        <color attach="background" args={["#20110b"]} />
        <fog attach="fog" args={["#20110b", 9, 20]} />

        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(2)}
        />
        <AdaptiveDpr pixelated />

        <CameraRig />
        <Diorama />

        <EffectComposer multisampling={0}>
          <DepthOfField
            focusDistance={closeUp ? 0.06 : 0.023}
            focalLength={closeUp ? 0.06 : 0.025}
            bokehScale={closeUp ? 1 : 3}
          />
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.28} darkness={0.85} />
          <SMAA />
        </EffectComposer>
      </Canvas>

      <GameUI />
    </>
  );
}
