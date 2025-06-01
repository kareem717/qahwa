import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { PublisherS3 } from "@electron-forge/publisher-s3";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDeb } from "@electron-forge/maker-deb";
import path from "node:path";

const BASE_FOLDER = "releases"

const config: ForgeConfig = {
  packagerConfig: {
    icon: path.join(__dirname, "src", "assets", "icon.icns"),
    asar: true,
    extraResource: [
      "../../packages/osx-audio/build/Release/nativeAudioManager.node",
      path.join(__dirname, "src", "assets", "icon.icns"),
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
    osxNotarize: process.env.SKIP_NOTARIZATION === "true" // Process can take 15-60+ min to notarize
      ? undefined
      : {
        appleId: process.env.APPLE_ID || "",
        appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD || "",
        teamId: process.env.APPLE_TEAM_ID || "",
      },
    extendInfo: {
      NSMicrophoneUsageDescription:
        "Qahwa needs access to your microphone to record audio notes and meetings.",
      NSSystemAudioRecordingUsageDescription:
        "Qahwa needs to record system audio to capture audio output from your Mac.",
      NSScreenRecordingUsageDescription:
        "Qahwa needs screen recording permission to capture system audio output from your Mac.",
      NSAppleEventsUsageDescription:
        "Qahwa needs to control other applications to enhance your note-taking experience.",
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
      folder: BASE_FOLDER,
      s3ForcePathStyle: true,
    }),
  ],
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      remoteReleases: `${process.env.VITE_R2_ENDPOINT}/${BASE_FOLDER}/win32/x64`,
    }),
    new MakerRpm({}),
    new MakerDeb({}),
    new MakerZIP((arch: string) => ({
      macUpdateManifestBaseUrl: `${process.env.VITE_R2_ENDPOINT}/${BASE_FOLDER}/darwin/${arch}`,
    }), ["darwin"]),
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