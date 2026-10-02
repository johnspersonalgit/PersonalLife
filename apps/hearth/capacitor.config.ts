import type { CapacitorConfig } from "@capacitor/cli";

// The native shell loads the hosted app. Set HEARTH_PUBLIC_URL to the
// production URL before `npx cap sync` when building for devices.
// The bundled native-shell/ page is only the offline fallback.
const config: CapacitorConfig = {
  appId: "com.willette.hearth",
  appName: "Hearth",
  webDir: "native-shell",
  server: {
    url: process.env.HEARTH_PUBLIC_URL ?? "https://hearth-gc8u.onrender.com",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
