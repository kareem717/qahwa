import React from "react";
import { getClient } from "../lib/api";
import { toast } from "sonner";
import { fullNoteCollection } from "../lib/collections/notes";
import { useLiveQuery } from "@tanstack/react-db";
import { useOptimisticMutation } from "@tanstack/react-db";
import { noteIdStore, DEFAULT_NOTE_ID, setNoteId } from "./use-note-id";
import { useStore } from "@tanstack/react-store";

type MicAudioRecorderState = {
  stream: MediaStream | null;
  audioCtx: AudioContext | null;
  source: MediaStreamAudioSourceNode | null;
  workletNode: AudioWorkletNode | null;
  onData: ((data: ArrayBuffer) => void) | null;
};

// Contents of your pcm-processor.js as a string
export const pcmProcessorCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    // The number of samples to buffer before sending (e.g., 512 samples)
    // Default AudioWorkletProcessor process block is 128 samples.
    // So, this will accumulate 4 blocks before sending.
    this._bufferSize = 512;
  }

  process(inputs, outputs, parameters) {
    // inputs[0] is an array of channels (Float32Array)
    // inputs[0][0] is the data for the first channel
    const inputChannel = inputs[0]?.[0];

    if (inputChannel && inputChannel.length > 0) {
      // Append new audio data to our internal buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this._buffer.push(inputChannel[i]);
      }

      // Process and send data in chunks of _bufferSize
      while (this._buffer.length >= this._bufferSize) {
        // Take the first _bufferSize samples for processing
        const processChunk = this._buffer.slice(0, this._bufferSize);

        // Convert Float32 [-1, 1] to 16-bit PCM
        const pcm16 = new Int16Array(this._bufferSize);
        for (let j = 0; j < this._bufferSize; j++) {
          const s = Math.max(-1, Math.min(1, processChunk[j]));
          pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF; // 16-bit signed integer
        }

        // Post the ArrayBuffer containing PCM data.
        // The second argument [pcm16.buffer] makes it a transferable object,
        // which is more efficient as it transfers ownership without copying.
        this.port.postMessage(pcm16.buffer, [pcm16.buffer]);

        // Remove the processed chunk from the beginning of the buffer
        this._buffer.splice(0, this._bufferSize);
      }
    }
    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
`;

async function startMicAudioCapture(
  onDataCallback: (data: ArrayBuffer) => void,
): Promise<MicAudioRecorderState> {
  const state: MicAudioRecorderState = {
    stream: null,
    audioCtx: null,
    source: null,
    workletNode: null,
    onData: onDataCallback,
  };

  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  state.audioCtx = new AudioContext();
  state.source = state.audioCtx.createMediaStreamSource(state.stream);
  // Create a Blob from the worklet code string
  const blob = new Blob([pcmProcessorCode], {
    type: "application/javascript",
  });
  // Create an object URL from the Blob
  const workletURL = URL.createObjectURL(blob);

  // Add the module using the object URL
  await state.audioCtx.audioWorklet.addModule(workletURL);
  state.workletNode = new AudioWorkletNode(state.audioCtx, "pcm-processor");
  state.source.connect(state.workletNode);
  state.workletNode.connect(state.audioCtx.destination);
  state.workletNode.port.onmessage = (event) => {
    if (state.onData) {
      state.onData(event.data as ArrayBuffer);
    }
  };

  return state;
}

function stopMicAudioCapture(state: MicAudioRecorderState) {
  if (state.workletNode) {
    state.workletNode.port.onmessage = null; // Clear the handler
    state.workletNode.disconnect();
  }
  if (state.source) {
    state.source.disconnect();
  }
  if (state.stream) {
    for (const track of state.stream.getTracks()) {
      track.stop();
    }
  }
  if (state.audioCtx && state.audioCtx.state !== "closed") {
    state.audioCtx.close();
  }

  // Reset state fields
  state.stream = null;
  state.audioCtx = null;
  state.source = null;
  state.workletNode = null;
  state.onData = null;
}

// --- Helper Functions for useTranscript ---

async function getAssemblyAiToken() {
  const client = await getClient();
  const tokenResponse = await client.note.transcribe.$get();
  const { token } = await tokenResponse.json();
  if (!token) {
    throw new Error("Failed to retrieve AssemblyAI token.");
  }
  return token;
}

type WebSocketSetupOptions = {
  url: string;
  onOpen: () => void;
  onMessage: (event: MessageEvent) => void;
  onError: (event: Event) => void;
  onClose: (event: CloseEvent) => void;
};

function setupWebSocket(options: WebSocketSetupOptions): WebSocket {
  const socket = new WebSocket(options.url);
  socket.onopen = options.onOpen;
  socket.onmessage = options.onMessage;
  socket.onerror = options.onError;
  socket.onclose = options.onClose;
  return socket;
}

function closeAndClearWebSocket(
  socketRef: React.MutableRefObject<WebSocket | null>,
) {
  if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
    try {
      socketRef.current.send(JSON.stringify({ terminate_session: true }));
      socketRef.current.close();
    } catch (e) {
      // Handle error silently
    }
  }
  socketRef.current = null; // Clear the ref
}

function cleanupAudioIpc(
  audioIpcCleanupRef: React.MutableRefObject<(() => void) | null>,
) {
  if (audioIpcCleanupRef.current) {
    audioIpcCleanupRef.current();
    audioIpcCleanupRef.current = null;
  }
}

export function useTranscript() {
  const noteId = useStore(noteIdStore, (state) => state.noteId);

  const internalNoteIdRef = React.useRef(noteId);
  const transcriptRef = React.useRef<typeof transcript>([]);

  const isCreatingNoteRef = React.useRef(false);
  const pendingTranscriptEntriesRef = React.useRef<typeof transcript>([]);

  React.useEffect(() => {
    internalNoteIdRef.current = noteId;
    if (noteId !== DEFAULT_NOTE_ID) {
      isCreatingNoteRef.current = false;
      pendingTranscriptEntriesRef.current = [];
    }
  }, [noteId]);

  const liveQueryCollection = React.useMemo(() => {
    return fullNoteCollection(noteId);
  }, [noteId]);

  const { data } = useLiveQuery(
    (query) =>
      query
        .from({ noteCollection: liveQueryCollection }) // Use memoized collection for live query
        .select("@transcript", "@id")
        .keyBy("@id"),
    [liveQueryCollection], // Depend on the collection instance
  );

  const transcript = data[0]?.transcript ?? [];

  React.useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const [partialTranscript, setPartialTranscript] = React.useState<{
    them: string;
    me: string;
  }>({ them: "", me: "" });

  const { mutate } = useOptimisticMutation({
    mutationFn: async ({ transaction }) => {
      const { changes } = transaction.mutations[0];

      const api = await getClient();
      const payload = {
        id:
          internalNoteIdRef.current === DEFAULT_NOTE_ID
            ? undefined
            : internalNoteIdRef.current,
        transcript: changes.transcript,
      };
      const response = await api.note.$put({
        // @ts-expect-error - TODO: fix this
        json: payload,
      });

      if (!response.ok) {
        if (internalNoteIdRef.current === DEFAULT_NOTE_ID) {
          isCreatingNoteRef.current = false; // Reset on creation failure
        }
        throw new Error("Error upserting note");
      }

      const { note } = await response.json();

      if (internalNoteIdRef.current === DEFAULT_NOTE_ID && note && note.id) {
        const newNoteId = note.id;
        setNoteId(newNoteId); // This updates internalNoteIdRef via its own useEffect.
        await fullNoteCollection(newNoteId).invalidate(); // This will update transcriptRef via useLiveQuery and its useEffect.
        isCreatingNoteRef.current = false; // Mark creation as finished. IMPORTANT: Do this after setNoteId & invalidate.
      } else {
        if (note?.id) {
          await fullNoteCollection(note.id).invalidate();
        } else if (internalNoteIdRef.current !== DEFAULT_NOTE_ID) {
          await fullNoteCollection(internalNoteIdRef.current).invalidate();
        }
        if (internalNoteIdRef.current !== DEFAULT_NOTE_ID) {
          isCreatingNoteRef.current = false;
        }
      }
    },
  });

  // Effect to flush pending entries once note ID is established and transcript is updated
  // This useEffect MUST be defined AFTER 'mutate' is defined.
  React.useEffect(() => {
    const currentActualNoteId = internalNoteIdRef.current;
    if (
      currentActualNoteId !== DEFAULT_NOTE_ID &&
      pendingTranscriptEntriesRef.current.length > 0
    ) {
      const entriesToFlush = [...pendingTranscriptEntriesRef.current];
      pendingTranscriptEntriesRef.current = []; // Clear buffer immediately

      mutate(() => {
        const collectionForFlush = fullNoteCollection(currentActualNoteId);
        const noteToUpdate = collectionForFlush.state.get(
          String(currentActualNoteId),
        );
        if (noteToUpdate) {
          collectionForFlush.update(noteToUpdate, (draft) => {
            draft.transcript = [
              ...(transcriptRef.current ?? []),
              ...entriesToFlush,
            ];
          });
        } else {
          if ((transcriptRef.current ?? []).length === 0) {
            collectionForFlush.insert([
              {
                id: currentActualNoteId,
                transcript: entriesToFlush,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: DEFAULT_NOTE_ID,
                title: "",
                userNotes: "",
                generatedNotes: "",
              },
            ]);
          }
        }
      });
    }
  }, [mutate]);

  const handleTranscriptChange = React.useCallback(
    (
      newTranscriptEntries: {
        timestamp: string;
        content: string;
        sender: "me" | "them";
      }[],
    ) => {
      const currentNoteIdVal = internalNoteIdRef.current;

      if (currentNoteIdVal === DEFAULT_NOTE_ID) {
        if (isCreatingNoteRef.current) {
          pendingTranscriptEntriesRef.current.push(...newTranscriptEntries);
          return; // Don't call mutate for these entries yet
        }

        isCreatingNoteRef.current = true;
        mutate(() => {
          const collectionForInsert = fullNoteCollection(DEFAULT_NOTE_ID); // Operate on TEMP_ID collection
          collectionForInsert.insert([
            {
              id: DEFAULT_NOTE_ID,
              transcript: newTranscriptEntries,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: DEFAULT_NOTE_ID,
              title: "",
              userNotes: "",
              generatedNotes: "",
            },
          ]);
        });
      } else {
        mutate(() => {
          const collectionForUpdate = fullNoteCollection(currentNoteIdVal);
          const noteToUpdate = collectionForUpdate.state.get(
            String(currentNoteIdVal),
          );
          if (noteToUpdate) {
            collectionForUpdate.update(noteToUpdate, (draft) => {
              draft.transcript = [
                ...(transcriptRef.current ?? []),
                ...newTranscriptEntries,
              ];
            });
          }
        });
      }
    },
    [mutate],
  ); // Dependencies: mutate (stable), refs are accessed directly.

  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);

  // Refs
  const systemSocketRef = React.useRef<WebSocket | null>(null);
  const micSocketRef = React.useRef<WebSocket | null>(null);
  const audioIpcCleanupRef = React.useRef<(() => void) | null>(null); // To store cleanup from startCapture
  const micRecorderRef = React.useRef<MicAudioRecorderState | null>(null);

  // --- Main Recording Logic ---
  const stopRecording = React.useCallback(() => {
    setIsLoading(false);
    setIsRecording(false);

    window.electronSystemAudio.stopCapture();
    cleanupAudioIpc(audioIpcCleanupRef);
    closeAndClearWebSocket(systemSocketRef);
    closeAndClearWebSocket(micSocketRef);
    setPartialTranscript({ them: "", me: "" });

    // Reset creation-specific state
    isCreatingNoteRef.current = false;
    pendingTranscriptEntriesRef.current = [];
  }, []);

  const startRecording = React.useCallback(async () => {
    if (isRecording || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Get AssemblyAI Tokens
      const token = await getAssemblyAiToken();
      const systemToken = token; // Assuming same token for now
      const micToken = token; // Assuming same token for now

      // 2. Setup WebSockets
      const sampleRate = 48000; // Target sample rate for osx-audio
      const systemWsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${systemToken}`;
      const micWsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${micToken}`;

      let isSystemReady = false;
      let isMicReady = false;

      const checkAndStartElectronCapture = async () => {
        const currentPerms = await window.electronSystemAudio.getPermissions();

        // Check microphone permission first
        switch (currentPerms.microphone) {
          case "authorized":
            break;
          case "denied":
            toast.error("Microphone permission denied");
            stopRecording();
            return;
          case "not_determined": {
            const micPerms =
              await window.electronSystemAudio.requestPermissions("microphone");
            if (micPerms.microphone !== "authorized") {
              toast.error("Microphone permission required");
              stopRecording();
              return;
            }
            break;
          }
          case "restricted":
            toast.error("Microphone permission restricted");
            stopRecording();
            return;
        }

        // Check system audio permission
        switch (currentPerms.audio) {
          case "authorized":
            break;
          case "denied":
            toast.error(
              "Screen recording permission denied. Please enable it in System Preferences > Security & Privacy > Screen Recording to capture system audio.",
            );
            stopRecording();
            return;
          case "not_determined": {
            const audioPerms =
              await window.electronSystemAudio.requestPermissions("audio");
            if (audioPerms.audio !== "authorized") {
              toast.error(
                "Screen recording permission is required for system audio capture. Please enable it in System Preferences > Security & Privacy > Screen Recording.",
              );
              stopRecording();
              return;
            }
            break;
          }
          case "restricted":
            toast.error(
              "Screen recording permission is restricted by system policy.",
            );
            stopRecording();
            return;
        }

        if (isSystemReady && isMicReady) {
          try {
            const handleSystemData = (data: ArrayBuffer) => {
              if (systemSocketRef.current?.readyState === WebSocket.OPEN) {
                systemSocketRef.current.send(data);
              }
            };
            const handleMicData = (data: ArrayBuffer) => {
              if (micSocketRef.current?.readyState === WebSocket.OPEN) {
                micSocketRef.current.send(data);
              }
            };

            const cleanupElectronAndMic = () => {
              window.electronSystemAudio.startCapture(handleSystemData);
              startMicAudioCapture(handleMicData)
                .then((recorderState) => {
                  micRecorderRef.current = recorderState;
                })
                .catch((error) => {
                  console.log("Failed to start microphone capture.", error);
                  toast.error("Failed to start microphone capture.");
                  stopRecording(); // Critical failure, stop everything
                  throw error;
                });

              return () => {
                if (micRecorderRef.current) {
                  stopMicAudioCapture(micRecorderRef.current);
                  micRecorderRef.current = null;
                }
              };
            };
            audioIpcCleanupRef.current = cleanupElectronAndMic();

            setIsLoading(false);
            setIsRecording(true);
          } catch (error) {
            console.error("Failed to start audio capture8.", error);
            toast.error("Failed to start audio capture.");
            stopRecording();
            throw error;
          }
        }
      };

      // System WebSocket Handlers
      systemSocketRef.current = setupWebSocket({
        url: systemWsUrl,
        onOpen: async () => {
          isSystemReady = true;
          await checkAndStartElectronCapture();
        },
        onMessage: (event) => {
          try {
            const message = JSON.parse(event.data as string);
            console.log("message", message);
            switch (message.message_type) {
              case "SessionBegins":
                break;
              case "PartialTranscript":
                setPartialTranscript((prev) => ({
                  ...prev,
                  them: message.text,
                }));
                break;
              case "FinalTranscript":
                if (message.text) {
                  setPartialTranscript((prev) => ({ ...prev, them: "" }));
                  handleTranscriptChange([
                    {
                      content: message.text,
                      sender: "them",
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }
                break;
              case "SessionTerminated":
                stopRecording();
                break;
              case "error":
                toast.error(`System Transcription Error: ${message.error}`);
                stopRecording();
                break;
            }
          } catch (e) {
            // Handle error silently
          }
        },
        onError: () => {
          toast.error("System connection error.");
          stopRecording();
        },
        onClose: (closeEvent) => {
          if (isRecording && closeEvent.code !== 1000) {
            stopRecording();
          }
        },
      });

      // Mic WebSocket Handlers
      micSocketRef.current = setupWebSocket({
        url: micWsUrl,
        onOpen: async () => {
          isMicReady = true;
          await checkAndStartElectronCapture();
        },
        onMessage: (event) => {
          try {
            const message = JSON.parse(event.data as string);
            switch (message.message_type) {
              case "SessionBegins":
                break;
              case "PartialTranscript":
                setPartialTranscript((prev) => ({ ...prev, me: message.text }));
                break;
              case "FinalTranscript":
                if (message.text) {
                  setPartialTranscript((prev) => ({ ...prev, me: "" }));
                  handleTranscriptChange([
                    {
                      content: message.text,
                      sender: "me",
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }
                break;
              case "SessionTerminated":
                stopRecording();
                break;
              case "error":
                toast.error(`Mic Transcription Error: ${message.error}`);
                stopRecording();
                break;
            }
          } catch (e) {
            // Handle error silently
          }
        },
        onError: () => {
          toast.error("Mic connection error.");
          stopRecording();
        },
        onClose: (closeEvent) => {
          if (isRecording && closeEvent.code !== 1000) {
            stopRecording();
          }
        },
      });
    } catch (error) {
      console.error("Failed to start rechording.", error);
      toast.error(
        `Error starting recording: ${error instanceof Error ? error.message : String(error)}`,
      );
      stopRecording(); //TODO: remove this
      throw error;
    }
  }, [isRecording, isLoading, stopRecording, handleTranscriptChange]);

  // Effect for automatic cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopRecording();
      if (micRecorderRef.current) {
        stopMicAudioCapture(micRecorderRef.current);
        micRecorderRef.current = null;
      }
    };
  }, [stopRecording]); // Dependency on stopRecording

  return {
    transcript,
    partialTranscript,
    isRecording, // Use the combined state
    isLoading, // Use the combined state
    startRecording,
    stopRecording,
  };
}
