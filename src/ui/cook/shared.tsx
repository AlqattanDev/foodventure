import { useEffect, useRef } from "react";

/** Pointer capture that never breaks input (synthetic/pen pointers can throw). */
export function grab(e: React.PointerEvent) {
  try {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  } catch {
    /* capture is best-effort */
  }
}

/** requestAnimationFrame loop with dt; return true from cb to stop. */
export function useRaf(cb: (dt: number) => boolean | void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (cbRef.current(dt) === true) return;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}
