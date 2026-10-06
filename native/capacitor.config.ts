import type { CapacitorConfig } from "@capacitor/cli";

const url = process.env.TASKORB_URL ?? "https://taskorbit-k762.onrender.com";

const config: CapacitorConfig = {
  appId: "app.taskorb",
  appName: "TaskOrb",
  webDir: "www",
  backgroundColor: "#060a18",
  server: {
    url,
    allowNavigation: [new URL(url).host, "taskorb.app", "www.taskorb.app", "taskorbit-k762.onrender.com"],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#060a18",
  },
  android: {
    backgroundColor: "#060a18",
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: "6.1",
        packageOptions: {
          "@capacitor-firebase/authentication": { symlink: true },
          "@capacitor-firebase/messaging": { symlink: true },
        },
        packageTraits: {
          "@capacitor-firebase/authentication": ["Google"],
        },
      },
    },
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
