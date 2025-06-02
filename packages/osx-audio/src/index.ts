import path from "node:path";

/**
 * Represents the possible states of device permission.
 */
export type PermissionStatus =
  | "not_determined" // Permission hasn't been requested yet
  | "denied" // User explicitly denied permission
  | "authorized" // Permission granted
  | "restricted"; // Permission restricted by system policy

/**
 * Types of audio devices that can be accessed.
 */
export type DeviceType = "microphone" | "audio";

/**
 * Structure containing permission status for both microphone and audio capture.
 */
export interface PermissionResult {
  microphone: PermissionStatus;
  audio: PermissionStatus;
}

/**
 * Configuration for AEC (Acoustic Echo Cancellation) processing.
 */
export interface AECConfig {
  sampleRate: number;           // Sample rate (typically 48000.0)
  channelsPerFrame: number;     // Number of channels (typically 1 for mono)
  framesPerBuffer: number;      // Buffer size in frames (typically 512)
  enableAGC: boolean;           // Enable Automatic Gain Control
  enableNoiseSupression: boolean; // Enable Noise Suppression
  enableAEC: boolean;           // Enable Acoustic Echo Cancellation
}

/**
 * Interface for the native audio manager instance.
 */
export interface AudioWrapperInstance {
  /**
   * Start capturing audio from the system.
   * @param callback Function that receives captured audio data
   * @throws If permissions not granted or setup fails
   */
  startCapture(callback: (data: ArrayBuffer) => void): void;

  /**
   * Stop the current audio capture session.
   * @throws If stopping capture fails
   */
  stopCapture(): void;

  /**
   * Get current permission status for audio devices.
   * @returns Object containing permission status for each device type
   */
  getPermissions: () => PermissionResult;

  /**
   * Request permission to access an audio device.
   * @param deviceType The type of device to request permission for
   * @returns Promise that resolves with updated permission status
   */
  requestPermissions: (deviceType: DeviceType) => Promise<PermissionResult>;
}

/**
 * Interface for the AEC-enabled audio manager instance.
 */
export interface AudioManagerAECInstance {
  /**
   * Start capturing system audio and microphone with AEC processing.
   * @param callback Function that receives processed audio data
   * @throws If permissions not granted or setup fails
   */
  startAECCapture(callback: (cleanAudio: ArrayBuffer, originalAudio: ArrayBuffer, systemAudio: ArrayBuffer) => void): void;

  /**
   * Stop the current AEC capture session.
   * @throws If stopping capture fails
   */
  stopAECCapture(): void;

  /**
   * Check if AEC processing is currently active.
   * @returns True if AEC processing is active
   */
  isAECActive(): boolean;

  /**
   * Update AEC configuration.
   * @param config New AEC configuration parameters
   * @throws If configuration update fails
   */
  updateAECConfig(config: AECConfig): void;

  /**
   * Get current AEC configuration.
   * @returns Current AEC configuration
   */
  getCurrentAECConfig(): AECConfig;

  /**
   * Get current permission status for audio devices.
   * @returns Object containing permission status for each device type
   */
  getPermissions: () => PermissionResult;

  /**
   * Request permission to access an audio device.
   * @param deviceType The type of device to request permission for
   * @returns Promise that resolves with updated permission status
   */
  requestPermissions: (deviceType: DeviceType) => Promise<PermissionResult>;
}

/**
 * Interface for the native addon module.
 */
export interface NativeAddon {
  AudioWrapper: {
    new(): AudioWrapperInstance;
  };
  AudioManagerAEC: {
    new(): AudioManagerAECInstance;
  };
}

// Type declaration for Electron's process.resourcesPath
declare global {
  namespace NodeJS {
    interface Process {
      resourcesPath?: string;
    }
  }
}

let nativeAddon: NativeAddon;

const isDev = process.env.NODE_ENV === "development";
const isElectron = !!process.versions.electron;

let binaryPath = "";

try {
  if (isDev) {
    // Development: load from build directory relative to source
    binaryPath = path.join(
      __dirname,
      "..",
      "build",
      "Release",
      "nativeAudioManager.node",
    );
  } else if (isElectron) {
    // Production Electron: load from extraResource
    binaryPath = path.join(
      process.resourcesPath ?? "",
      "nativeAudioManager.node",
    );
  } else {
    // Fallback for regular Node.js
    binaryPath = path.join(
      __dirname,
      "..",
      "build",
      "Release",
      "nativeAudioManager.node",
    );
  }

  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("isDev:", isDev);
  console.log("isElectron:", isElectron);
  console.log("process.resourcesPath:", process.resourcesPath);
  console.log("Attempting to load native addon from:", binaryPath);
  nativeAddon = require(binaryPath);
} catch (error) {
  throw new Error(
    `Failed to load native addon from path: ${binaryPath}. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
}

/**
 * Create a basic audio manager instance for system audio capture.
 * @returns AudioWrapperInstance for basic system audio functionality
 */
export const createAudioManager = () => new nativeAddon.AudioWrapper();

/**
 * Create an AEC-enabled audio manager instance.
 * @returns AudioManagerAECInstance with echo cancellation capabilities
 */
export const createAudioManagerAEC = () => new nativeAddon.AudioManagerAEC();

/**
 * Get default AEC configuration.
 * @returns Default AEC configuration optimized for most use cases
 */
export const getDefaultAECConfig = (): AECConfig => ({
  sampleRate: 48000.0,
  channelsPerFrame: 1,
  framesPerBuffer: 512,
  enableAGC: true,
  enableNoiseSupression: true,
  enableAEC: true,
});
