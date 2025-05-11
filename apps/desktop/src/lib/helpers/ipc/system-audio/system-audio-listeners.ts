import { createAudioManager, DeviceType, PermissionResult } from "@note/osx-audio"
import { ipcMain, IpcMainEvent, app } from 'electron';
// import * as fs from 'fs';
// import * as path from 'path';

export function addSystemAudioEventListeners() {
  const audioManager = createAudioManager();
  // let audioChunks: Buffer[] = [];

  ipcMain.handle('get-permissions', async () => {
    try {
      return await audioManager.getPermissions();
    } catch (error) {
      console.error('Error getting permissions:', error)
      throw error // Re-throw to be caught by the invoke call
    }
  })

  ipcMain.on('start-capture', async (event: IpcMainEvent) => {
    try {
      // audioChunks = []; // Clear previous chunks
      audioManager.startCapture((data: ArrayBuffer) => {
        // audioChunks.push(Buffer.from(data));
        event.sender.send('audio-data', data);
      });
    } catch (e) {
      const error = e as Error;
      console.error('Error starting capture:', error)
      // Optionally, send an error message back to the renderer
      event.sender.send('capture-error', error.message);
    }
  })

  ipcMain.on('stop-capture', () => {
    try {
      console.log("Received stop-capture request from renderer.");
      audioManager.stopCapture();

      // if (audioChunks.length > 0) {
      //   const totalAudioData = Buffer.concat(audioChunks);
      //   audioChunks = []; // Clear chunks for next recording

      //   // WAV Header Constants (based on observed logs: 48kHz, 32-bit, Mono)
      //   const wavData = createWavFile(totalAudioData, 48000, 1, 32);

      //   const recordingsDir = path.join(app.getPath('userData'), 'recordings');

      //   if (!fs.existsSync(recordingsDir)) {
      //     fs.mkdirSync(recordingsDir, { recursive: true });
      //   }

      //   const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      //   const filePath = path.join(recordingsDir, `recording_${timestamp}.wav`);

      //   try {
      //     fs.writeFileSync(filePath, wavData);
      //     console.log(`Audio saved to absolute path: ${filePath}`);
      //     // Optionally, send a message back to the renderer if needed:
      //     // event.sender.send('audio-saved', filePath); // 'event' isn't available in this ipcMain.on handler scope
      //   } catch (writeError) {
      //     console.error('Error writing WAV file:', writeError);
      //     // Optionally, send error to renderer:
      //     // event.sender.send('save-error', (writeError as Error).message);
      //   }
      // } else {
      //   console.log("No audio data to save.");
      // }

      // Note: File saving is currently handled by SIGINT in setupAudioCaptureLogic.
      // If stopCapture should also trigger saving, that logic needs to be invoked here.
      console.log("Audio capture stopped via IPC.");
    } catch (e) {
      const error = e as Error;
      console.error('Error stopping capture:', error);
      // Consider sending an error back to renderer if stopCapture can fail
      // event.sender.send('stop-capture-error', error.message);
    }
  });

  ipcMain.handle('request-permissions', async (_event, deviceType: DeviceType): Promise<PermissionResult> => {
    try {
      console.log(`Received request-permissions for ${deviceType} from renderer.`);
      const permissions = await audioManager.requestPermissions(deviceType);
      console.log(`Permissions after request for ${deviceType}:`, permissions);
      return permissions;
    } catch (e) {
      const error = e as Error;
      console.error(`Error requesting permissions for ${deviceType}:`, error);
      throw error; // Re-throw to be caught by the invoke call in renderer
    }
  });
}

// function createWavFile(rawData: Buffer, sampleRate: number, numChannels: number, bitsPerSample: number) {
//   const dataSize = rawData.length;
//   const headerSize = 44;
//   const wavBuffer = Buffer.alloc(headerSize + dataSize);

//   // RIFF header
//   wavBuffer.write('RIFF', 0);
//   wavBuffer.writeUInt32LE(36 + dataSize, 4); // File size - 8
//   wavBuffer.write('WAVE', 8);

//   // fmt chunk
//   wavBuffer.write('fmt ', 12);
//   wavBuffer.writeUInt32LE(16, 16); // fmt chunk size
//   wavBuffer.writeUInt16LE(3, 20); // Format: IEEE float (3)
//   wavBuffer.writeUInt16LE(numChannels, 22);
//   wavBuffer.writeUInt32LE(sampleRate, 24);
//   const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
//   wavBuffer.writeUInt32LE(byteRate, 28);
//   wavBuffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
//   wavBuffer.writeUInt16LE(bitsPerSample, 34);

//   // data chunk
//   wavBuffer.write('data', 36);
//   wavBuffer.writeUInt32LE(dataSize, 40);

//   // Copy the raw data
//   rawData.copy(wavBuffer, headerSize);

//   return wavBuffer;
// }