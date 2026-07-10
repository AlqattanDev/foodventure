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
import { Hud } from "./ui/Hud";

export default function App() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <>
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 4.4, 6.6], fov: 34, near: 0.1, far: 100 }}
        onCreated={({ camera }) => camera.lookAt(0, 1.1, 0.4)}
      >
        {/* warm cozy backdrop */}
        <color attach="background" args={["#20110b"]} />
        <fog attach="fog" args={["#20110b", 9, 20]} />

        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(2)}
        />
        <AdaptiveDpr pixelated />

        <Diorama />

        <EffectComposer multisampling={0}>
          <DepthOfField
            focusDistance={0.023}
            focalLength={0.025}
            bokehScale={3}
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

      <Hud />
    </>
  );
}
