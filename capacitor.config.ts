import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.exidex.foodventure",
  appName: "Foodventure",
  webDir: "dist",
  backgroundColor: "#20110b",
  ios: {
    contentInset: "always",
    backgroundColor: "#20110b",
  },
  android: {
    backgroundColor: "#20110b",
  },
};

export default config;
