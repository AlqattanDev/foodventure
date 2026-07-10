/**
 * Tiny haptics wrapper. Uses the Web Vibration API today; swaps to the
 * Capacitor Haptics plugin automatically once running inside the native shell.
 */
type Kind = "tick" | "light" | "medium" | "heavy" | "success" | "error";

let capHaptics: any = null;
// On a real device, use the native Capacitor Haptics plugin. On the web build
// we deliberately stay on navigator.vibrate (below) to avoid the Capacitor
// web-proxy no-op warnings.
(async () => {
  try {
    const corePkg = "@capacitor/core";
    const { Capacitor } = await import(/* @vite-ignore */ corePkg);
    if (!Capacitor?.isNativePlatform?.()) return;
    const pkg = "@capacitor/haptics";
    const mod = await import(/* @vite-ignore */ pkg);
    capHaptics = mod.Haptics;
  } catch {
    /* web build — fall back to navigator.vibrate */
  }
})();

const WEB_PATTERNS: Record<Kind, number | number[]> = {
  tick: 8,
  light: 12,
  medium: 22,
  heavy: 40,
  success: [14, 40, 22],
  error: [40, 30, 40],
};

export function haptic(kind: Kind = "light") {
  if (capHaptics) {
    try {
      if (kind === "success" || kind === "error") {
        capHaptics.notification({ type: kind === "success" ? "SUCCESS" : "ERROR" });
      } else if (kind === "tick") {
        capHaptics.selectionChanged?.();
      } else {
        capHaptics.impact({ style: kind === "heavy" ? "HEAVY" : kind === "medium" ? "MEDIUM" : "LIGHT" });
      }
      return;
    } catch {
      /* fall through to web */
    }
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(WEB_PATTERNS[kind]);
  }
}
