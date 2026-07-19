import { useRef } from "react";
import { grab } from "./shared";

export interface PadPointer {
  /** pot-space position [-1,1] (unit circle = the pot) */
  x: number;
  y: number;
  down: boolean;
}

/**
 * The V3 stir surface: an invisible round pad over the pot. The finger IS the
 * paddle — any path counts; the stage's sim decides what the motion does.
 * Renders only a soft glow under the finger; all real feedback lives in the
 * 3D pot (paddle follows, halwa swirls, neglected patches darken).
 */
export function StirPad({
  ptr,
  size = "min(78vw, 380px)",
  top = "47%",
  disabled = false,
}: {
  ptr: React.MutableRefObject<PadPointer>;
  size?: string;
  top?: string;
  disabled?: boolean;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  const toPot = (clientX: number, clientY: number) => {
    const el = zone.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 2 - 1;
    const y = ((clientY - r.top) / r.height) * 2 - 1;
    return { x, y, lx: clientX - r.left, ly: clientY - r.top };
  };

  const move = (clientX: number, clientY: number) => {
    const p = toPot(clientX, clientY);
    if (!p) return;
    // clamp to just outside the rim so edge-scraping still works
    const d = Math.hypot(p.x, p.y);
    const s = d > 1.15 ? 1.15 / d : 1;
    ptr.current.x = p.x * s;
    ptr.current.y = p.y * s;
    if (glow.current) {
      glow.current.style.transform = `translate(${p.lx}px, ${p.ly}px) translate(-50%,-50%)`;
    }
  };

  return (
    <div
      ref={zone}
      data-pad="stir"
      style={{
        position: "absolute",
        left: "50%",
        top,
        transform: "translate(-50%,-50%)",
        width: size,
        height: size,
        borderRadius: "50%",
        pointerEvents: disabled ? "none" : "auto",
        touchAction: "none",
        overflow: "visible",
      }}
      onPointerDown={(e) => {
        grab(e);
        ptr.current.down = true;
        move(e.clientX, e.clientY);
        if (glow.current) glow.current.style.opacity = "1";
      }}
      onPointerMove={(e) => {
        if (!ptr.current.down) return;
        move(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        ptr.current.down = false;
        if (glow.current) glow.current.style.opacity = "0";
      }}
      onPointerCancel={() => {
        ptr.current.down = false;
        if (glow.current) glow.current.style.opacity = "0";
      }}
    >
      {/* soft finger glow — the only 2D trace of the stir */}
      <div
        ref={glow}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 74,
          height: 74,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,214,150,0.30), rgba(255,214,150,0) 70%)",
          opacity: 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
