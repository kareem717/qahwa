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
