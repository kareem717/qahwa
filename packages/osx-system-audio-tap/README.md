# OSX System Audio Tap

A Node.js native module that allows you to tap into the system audio output on macOS. This module provides a way to capture and process audio data in real-time from any audio output device.

## Requirements

- macOS 10.14 or later
- Node.js 14.0.0 or later
- Xcode Command Line Tools

## Installation

```bash
npm install osx-system-audio-tap
# or
yarn add osx-system-audio-tap
# or
pnpm add osx-system-audio-tap
```

## Usage

```javascript
const { SystemAudioTap } = require('osx-system-audio-tap');

async function main() {
    try {
        // Create a new audio tap instance
        const tap = new SystemAudioTap();
        console.log('Created SystemAudioTap instance');

        // Activate the tap (this will get the default output device)
        tap.activate();
        console.log('Activated SystemAudioTap');

        // Set up some counters for monitoring
        let sampleCount = 0;
        let totalBytes = 0;
        const startTime = Date.now();

        // Run the audio tap
        await new Promise((resolve) => {
            tap.runWithQueue((audioData) => {
                // Process audio data
                sampleCount++;
                
                // Calculate total bytes from all buffers
                if (audioData.buffers) {
                    for (const buffer of audioData.buffers) {
                        totalBytes += buffer.dataByteSize;
                    }
                }

                // Log progress every 100 samples
                if (sampleCount % 100 === 0) {
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    console.log(`Processed ${sampleCount} audio samples (${(totalBytes / 1024 / 1024).toFixed(2)} MB) in ${elapsedTime.toFixed(2)} seconds`);
                    
                    // Log buffer details
                    console.log('Buffer details:');
                    audioData.buffers.forEach((buffer, index) => {
                        console.log(`  Buffer ${index}: ${buffer.channels} channels, ${buffer.dataByteSize} bytes`);
                    });
                }
            }, (error) => {
                // Handle any errors
                if (error) {
                    console.error('Error:', error);
                }
            });

            // Stop after some time (or you can run indefinitely)
            setTimeout(() => {
                tap.cleanup();
                console.log('Cleaned up SystemAudioTap');
                console.log(`Total samples processed: ${sampleCount}`);
                console.log(`Total data processed: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
                resolve();
            }, 5000);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

## API

### `SystemAudioTap`

The main class that provides access to system audio.

#### Methods

##### `constructor()`

Creates a new instance of the SystemAudioTap.

##### `activate()`

Activates the audio tap by getting the default output device. This must be called before `runWithQueue`.

##### `runWithQueue(ioCallback, invalidationCallback)`

Starts capturing audio data.

- `ioCallback`: Function that receives audio data. The callback receives an object with:
  - `buffers`: Array of buffer objects, each containing:
    - `channels`: Number of audio channels
    - `dataByteSize`: Size of the audio data in bytes

- `invalidationCallback`: Function called if there's an error or the tap is invalidated

##### `cleanup()`

Stops capturing audio and cleans up resources. Always call this when you're done with the tap.

## Building from Source

```bash
# Install dependencies
pnpm install

# Build the native module
pnpm run build
```

## License

MIT 