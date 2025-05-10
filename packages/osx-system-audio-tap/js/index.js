// usually do this inside the main.ts file
const bindings = require("bindings");
const native = bindings("nativeAudioManager");
const fs = require("fs");
const path = require("path");
const { Writable } = require("stream");

// Create audio wrapper instance
const audio = new native.AudioWrapper();

async function setupAudioCapture() {
  try {
    console.log("Starting audio capture setup...");

    // Request permissions
    const all = await audio.getPermissions();
    console.log("Current permissions:", all);

    // Create a buffer to store all audio data
    const audioChunks = [];
    let totalBytes = 0;

    // Start capture with callback
    console.log("Setting up audio capture callback...");

    
    audio.startCapture((data) => {
      try {
        console.log(`Received audio data: ${data.byteLength} bytes`);
        // Log the first few bytes for debugging
        const view = new Float32Array(data);
        console.log("First 5 samples:", Array.from(view.slice(0, 5)));
        
        // Store the audio data
        audioChunks.push(Buffer.from(data));
        totalBytes += data.byteLength;
      } catch (error) {
        console.error("Error in audio callback:", error);
        console.error("Error stack:", error.stack);
      }
    });



    console.log("Audio capture started successfully");

    // Keep the process running
    process.on("SIGINT", () => {
      console.log("Stopping audio capture...");
      audio.stopCapture();
      
      // Save the captured audio to a file
      try {
        const outputDir = path.join(__dirname, "recordings");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filePath = path.join(outputDir, `audio-${timestamp}.raw`);
        
        console.log(`Saving ${totalBytes} bytes of audio data to ${filePath}`);
        
        // Combine all chunks into a single buffer
        const combinedBuffer = Buffer.concat(audioChunks, totalBytes);
        
        // Write to file
        fs.writeFileSync(filePath, combinedBuffer);
        console.log(`Audio data saved successfully to ${filePath}`);
        
        // Also save a WAV file with proper headers
        const wavFilePath = path.join(outputDir, `audio-${timestamp}.wav`);
        const wavBuffer = createWavFile(combinedBuffer, 22050, 1, 32);
        fs.writeFileSync(wavFilePath, wavBuffer);
        console.log(`WAV file saved successfully to ${wavFilePath}`);
      } catch (error) {
        console.error("Error saving audio file:", error);
      }
      
      process.exit(0);
    });
  } catch (error) {
    console.error("Error in setupAudioCapture:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

// Function to create a WAV file from raw PCM data
function createWavFile(rawData, sampleRate, numChannels, bitsPerSample) {
  const dataSize = rawData.length;
  const headerSize = 44;
  const wavBuffer = Buffer.alloc(headerSize + dataSize);
  
  // RIFF header
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4); // File size - 8
  wavBuffer.write('WAVE', 8);
  
  // fmt chunk
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); // fmt chunk size
  wavBuffer.writeUInt16LE(3, 20); // Format: IEEE float (3)
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
  wavBuffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataSize, 40);
  
  // Copy the raw data
  rawData.copy(wavBuffer, headerSize);
  
  return wavBuffer;
}

console.log("Starting audio capture test...");
setupAudioCapture().catch((error) => {
  console.error("Fatal error:", error);
  console.error("Error stack:", error.stack);
  process.exit(1);
});
