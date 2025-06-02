import React from "react";
import type { AECConfig } from "@qahwa/osx-audio";

interface AECConfigPanelProps {
  useAEC: boolean;
  setUseAEC: (enabled: boolean) => void;
  aecConfig: AECConfig | null;
  updateAECConfig: (config: AECConfig) => Promise<void>;
  isRecording: boolean;
}

export function AECConfigPanel({
  useAEC,
  setUseAEC,
  aecConfig,
  updateAECConfig,
  isRecording,
}: AECConfigPanelProps) {
  const handleConfigChange = async (key: keyof AECConfig, value: boolean | number) => {
    if (!aecConfig || isRecording) return;

    const newConfig = { ...aecConfig, [key]: value };
    await updateAECConfig(newConfig);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Echo Cancellation Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useAEC"
            checked={useAEC}
            onChange={(e) => setUseAEC(e.target.checked)}
            disabled={isRecording}
            className="rounded"
          />
          <label htmlFor="useAEC" className="text-sm font-medium">
            Enable Echo Cancellation (AEC)
          </label>
        </div>

        {useAEC && aecConfig && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-200">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableAEC"
                checked={aecConfig.enableAEC}
                onChange={(e) => handleConfigChange("enableAEC", e.target.checked)}
                disabled={isRecording}
                className="rounded"
              />
              <label htmlFor="enableAEC" className="text-sm">
                Acoustic Echo Cancellation
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableAGC"
                checked={aecConfig.enableAGC}
                onChange={(e) => handleConfigChange("enableAGC", e.target.checked)}
                disabled={isRecording}
                className="rounded"
              />
              <label htmlFor="enableAGC" className="text-sm">
                Automatic Gain Control (AGC)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableNoiseSupression"
                checked={aecConfig.enableNoiseSupression}
                onChange={(e) => handleConfigChange("enableNoiseSupression", e.target.checked)}
                disabled={isRecording}
                className="rounded"
              />
              <label htmlFor="enableNoiseSupression" className="text-sm">
                Noise Suppression
              </label>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Sample Rate: {aecConfig.sampleRate} Hz</div>
              <div>Channels: {aecConfig.channelsPerFrame}</div>
              <div>Buffer Size: {aecConfig.framesPerBuffer} frames</div>
            </div>
          </div>
        )}

        {!useAEC && (
          <div className="text-sm text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            ⚠️ Without AEC, you may experience echo between system audio and microphone.
          </div>
        )}
      </div>
    </div>
  );
} 