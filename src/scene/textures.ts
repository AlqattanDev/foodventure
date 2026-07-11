import * as THREE from "three";

/**
 * Tiny procedural canvas textures — the stylized-pattern layer of the art
 * pass. Everything stays flat-shaded and chunky (no photo noise) so it reads
 * as hand-painted, and small (≤512px) so mobile GPUs don't blink.
 */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function toTexture(c: HTMLCanvasElement, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Awning canvas: bold vertical market-stall stripes. */
export function makeAwningTexture(a = "#c0392b", b = "#f3e9d2") {
  const [c, g] = canvas(256, 64);
  const n = 8;
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? a : b;
    g.fillRect((i * 256) / n, 0, 256 / n + 1, 64);
  }
  return toTexture(c, 2, 1);
}

/** Floor: warm zellige-ish tiles with grout lines and slight per-tile tint. */
export function makeTileTexture() {
  const [c, g] = canvas(512, 512);
  const n = 8;
  const s = 512 / n;
  const base = new THREE.Color("#b5763f");
  const tint = new THREE.Color();
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // deterministic per-tile variation (no Math.random — stable across loads)
      const v = (Math.sin(x * 12.7 + y * 7.3) * 0.5 + 0.5) * 0.14 - 0.07;
      tint.copy(base).offsetHSL(0, 0.02 * v * 10, v);
      g.fillStyle = `#${tint.getHexString()}`;
      g.fillRect(x * s, y * s, s, s);
      // bevel highlight
      g.fillStyle = "rgba(255,235,200,0.10)";
      g.fillRect(x * s, y * s, s, 3);
      g.fillRect(x * s, y * s, 3, s);
    }
  }
  // grout
  g.strokeStyle = "#7a4a26";
  g.lineWidth = 4;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke();
  }
  return toTexture(c, 2, 1.5);
}

/** Rug: deep red field, cream border, simple diamond motifs. */
export function makeRugTexture() {
  const [c, g] = canvas(512, 320);
  g.fillStyle = "#8e2f23";
  g.fillRect(0, 0, 512, 320);
  // border
  g.strokeStyle = "#e8d5ae";
  g.lineWidth = 14;
  g.strokeRect(18, 18, 512 - 36, 320 - 36);
  g.strokeStyle = "#c9743a";
  g.lineWidth = 6;
  g.strokeRect(40, 40, 512 - 80, 320 - 80);
  // diamond motifs
  const diamond = (cx: number, cy: number, r: number, fill: string) => {
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy);
    g.closePath(); g.fill();
  };
  for (let i = 0; i < 3; i++) {
    const cx = 128 + i * 128;
    diamond(cx, 160, 52, "#e8d5ae");
    diamond(cx, 160, 34, "#3f7d6e");
    diamond(cx, 160, 16, "#e6b422");
  }
  return toTexture(c);
}

/** Counter front: geometric Khaliji lattice band (cream on dark wood). */
export function makeLatticeTexture() {
  const [c, g] = canvas(512, 128);
  g.fillStyle = "#5e2f18";
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#e8c07a";
  g.lineWidth = 7;
  const s = 64;
  for (let x = -s; x < 512 + s; x += s) {
    g.beginPath();
    g.moveTo(x, 64 - s / 2);
    g.lineTo(x + s / 2, 64 + s / 2 - s);
    g.lineTo(x + s, 64 - s / 2);
    g.stroke();
    g.beginPath();
    g.moveTo(x, 64 + s / 2);
    g.lineTo(x + s / 2, 64);
    g.lineTo(x + s, 64 + s / 2);
    g.stroke();
  }
  return toTexture(c, 3, 1);
}
