import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { PublisherS3 } from "@electron-forge/publisher-s3";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: [
      "../../packages/osx-audio/build/Release/nativeAudioManager.node"
    ],
    osxSign: process.env.NODE_ENV === "development"
      ? undefined // Skip due to notarization taking 15-60+ min
      : {
        identity: process.env.APPLE_DEVELOPER_IDENTITY,
        optionsForFile: (filePath) => {
          // Here, we keep it simple and return a single entitlements.plist file.
          // You can use this callback to map different sets of entitlements
          // to specific files in your packaged app.
          return {
            "hardened-runtime": true,
            "gatekeeper-assess": false,
            entitlements: "entitlements.plist",
            "entitlements-inherit": "entitlements.plist",
          };
        }
      },
    osxNotarize: {
      appleId: process.env.APPLE_ID || '',
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD || '',
      teamId: process.env.APPLE_TEAM_ID || '',
    },
    // Add privacy usage descriptions
    extendInfo: {
      NSMicrophoneUsageDescription: "Note needs access to your microphone to record audio notes and meetings.",
      NSSystemAdministrationUsageDescription: "Note needs system access to capture system audio for comprehensive meeting recordings.",
      NSAppleEventsUsageDescription: "Note needs to control other applications to enhance your note-taking experience.",
      LSApplicationCategoryType: "public.app-category.productivity"
    }
  },
  publishers: [
    new PublisherS3({
      bucket: process.env.R2_BUCKET_NAME,
      region: "auto",
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      endpoint: process.env.R2_ENDPOINT,
      public: true,
      folder: "releases",
      s3ForcePathStyle: true,
    }),
  ],
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config; 
