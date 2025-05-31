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

// Import package.json to get version
import packageJson from './package.json';

const config: ForgeConfig = {
  packagerConfig: {
    icon: "./assets/icon.icns",
    asar: true,
    extraResource: [
      "../../packages/osx-audio/build/Release/nativeAudioManager.node",
    ],
    appBundleId: "com.fundlevel.qahwa",
    osxSign: {
      identity: process.env.APPLE_DEVELOPER_IDENTITY,
      optionsForFile: (filePath) => {
        return {
          "hardened-runtime": true,
          "gatekeeper-assess": false,
          entitlements: "entitlements.plist",
          "entitlements-inherit": "entitlements.plist",
        };
      },
    },
    osxNotarize:
      process.env.NODE_ENV === "development"
        ? undefined // Skip due to notarization taking 15-60+ min
        : {
          appleId: process.env.APPLE_ID || "",
          appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD || "",
          teamId: process.env.APPLE_TEAM_ID || "",
        },
    extendInfo: {
      NSMicrophoneUsageDescription:
        "Qahwa needs access to your microphone to record audio notes and meetings.",
      NSScreenCaptureDescription:
        "Qahwa needs screen recording permission to capture system audio for comprehensive meeting recordings.",
      NSSystemAudioRecordingUsageDescription:
        "Qahwa needs to record system audio to capture audio output from your Mac.",
      NSAppleEventsUsageDescription:
        "Note needs to control other applications to enhance your note-taking experience.",
      LSApplicationCategoryType: "public.app-category.productivity",
      LSMinimumSystemVersion: "10.15.0"
    },
  },
  publishers: [
    new PublisherS3({
      bucket: process.env.VITE_R2_BUCKET_NAME,
      region: "auto",
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      endpoint: process.env.R2_S3_API_ENDPOINT,
      public: true,
      folder: "releases",
      s3ForcePathStyle: true,
      // Custom key generator for versioned releases
      keyResolver: (fileName, platform, arch) => {
        const version = packageJson.version;
        const fileExtension = fileName.split('.').pop();

        // Create platform-arch identifier
        const platformArch = `${platform}-${arch}`;

        // For versioned release, include version number
        const versionedKey = `releases/v${version}-${platformArch}.${fileExtension}`;

        // Return the versioned key (S3Publisher will use this)
        // We'll handle the latest copy separately in the workflow
        return versionedKey;
      },
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