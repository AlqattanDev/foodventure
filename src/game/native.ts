/**
 * Native-shell setup, run once at boot. No-ops harmlessly on the web build
 * (the dynamic imports just fail and we move on).
 */
export async function initNative() {
  try {
    const corePkg = "@capacitor/core";
    const { Capacitor } = await import(/* @vite-ignore */ corePkg);
    if (!Capacitor?.isNativePlatform?.()) return;

    // warm, edge-to-edge dark status bar over the cozy diorama
    try {
      const sbPkg = "@capacitor/status-bar";
      const { StatusBar, Style } = await import(/* @vite-ignore */ sbPkg);
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch {
      /* status-bar plugin absent — fine */
    }
  } catch {
    /* web build — nothing to init */
  }
}
