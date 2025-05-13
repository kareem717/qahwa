import React from "react"
import { getClient } from "../lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { NOTE_QUERY_KEY } from "./use-note"
import { toast } from "sonner"

type MicAudioRecorderState = {
  stream: MediaStream | null;
  audioCtx: AudioContext | null;
  source: MediaStreamAudioSourceNode | null;
  workletNode: AudioWorkletNode | null;
  onData: ((data: ArrayBuffer) => void) | null;
};

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

  try {
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
    const workletPath = new URL(
      "/pcm-processor.js",
      window.location.origin,
    ).toString();
    await state.audioCtx.audioWorklet.addModule(workletPath);
    state.workletNode = new AudioWorkletNode(state.audioCtx, "pcm-processor");
    state.source.connect(state.workletNode);
    state.workletNode.connect(state.audioCtx.destination);
    state.workletNode.port.onmessage = (event) => {
      if (state.onData) {
        state.onData(event.data as ArrayBuffer);
      }
    };
  } catch (error) {
    console.error("Error starting mic audio capture:", error);
    // Perform cleanup if any part of the start failed
    stopMicAudioCapture(state);
    throw error; // Re-throw the error to be handled by the caller
  }
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
    state.stream.getTracks().forEach((track) => track.stop());
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
  const tokenResponse = await client.transcription.token.$get();
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

function closeAndClearWebSocket(socketRef: React.MutableRefObject<WebSocket | null>) {
  if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
    try {
      socketRef.current.send(JSON.stringify({ terminate_session: true }));
      socketRef.current.close();
      console.log("WebSocket closed and ref cleared.");
    } catch (e) {
      console.error("Error closing WebSocket:", e);
    }
  }
  socketRef.current = null; // Clear the ref
}

function cleanupAudioIpc(audioIpcCleanupRef: React.MutableRefObject<(() => void) | null>) {
  if (audioIpcCleanupRef.current) {
    audioIpcCleanupRef.current();
    audioIpcCleanupRef.current = null;
    console.log("Cleaned up audio IPC listeners.");
  }
}

export type UseTranscriptProps = {
  transcript?: {
    timestamp: string
    text: string
    sender: "me" | "them"
    // channel: "system" | "mic"
  }[]
  id?: number
}

export function useTranscript(initialData?: UseTranscriptProps) {
  // State
  const [data, setData] = React.useState<UseTranscriptProps>({
    transcript: initialData?.transcript ?? [],
    id: initialData?.id ?? undefined,
  })
  const [partialTranscript, setPartialTranscript] = React.useState<{
    them: string
    me: string
  }>({ them: "", me: "" })
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRecording, setIsRecording] = React.useState(false)

  // Refs
  const systemSocketRef = React.useRef<WebSocket | null>(null)
  const micSocketRef = React.useRef<WebSocket | null>(null)
  const audioIpcCleanupRef = React.useRef<(() => void) | null>(null); // To store cleanup from startCapture
  const micRecorderRef = React.useRef<MicAudioRecorderState | null>(null);

  // React Query
  const queryClient = useQueryClient()
  const { mutateAsync: upsertNote } = useMutation({
    mutationFn: async () => {
      const api = await getClient()
      // Only send transcript if it has content
      const transcriptToSend = data.transcript?.length ? data.transcript : undefined;
      if (!data.id && !transcriptToSend) {
        console.log("Skipping upsert: No ID and no transcript content.");
        return { note: { id: undefined } }; // Return dummy response if nothing to save
      }
      const response = await api.note.$put({
        json: {
          id: data.id ?? undefined,
          transcript: transcriptToSend,
        },
      })
      return await response.json()
    },
    onMutate: () => {
      if (data.transcript?.length || data.id) { // Only show toast if something is being saved
        toast.success("Saving transcript...")
      }
    },
    onSuccess: ({ note }) => {
      if (note.id) { // Check if an ID was returned (meaning save happened)
        toast.success("Transcript saved")
        setData((prev) => ({
          ...prev,
          id: note.id,
        }))
        queryClient.invalidateQueries({ queryKey: [NOTE_QUERY_KEY, note.id] })
      }
    },
    onError: () => {
      toast.error("Failed to save transcript")
    },
  })

  // --- Main Recording Logic ---

  const stopRecording = React.useCallback(() => {
    console.log("Stopping recording...");
    setIsLoading(false); // Ensure loading is false when stopped
    setIsRecording(false); // Set recording state immediately

    // 1. Stop native audio capture in main process
    window.electronSystemAudio.stopCapture();

    // 2. Clean up IPC listeners
    cleanupAudioIpc(audioIpcCleanupRef);

    // 3. Close System Audio WebSocket
    closeAndClearWebSocket(systemSocketRef);
    console.log("System audio WebSocket resources actioned.");

    // 4. Close Mic Audio WebSocket
    closeAndClearWebSocket(micSocketRef);
    console.log("Mic audio WebSocket resources actioned.");

    // 5. Reset partial transcripts
    setPartialTranscript({ them: "", me: "" });

  }, [audioIpcCleanupRef, systemSocketRef, micSocketRef]);

  const startRecording = React.useCallback(async () => {
    if (isRecording || isLoading) {
      console.log("Recording is already in progress or loading.");
      return;
    }

    setIsLoading(true);
    console.log("Starting recording process...");

    try {
      // 1. Get AssemblyAI Tokens
      const token = await getAssemblyAiToken();
      const systemToken = token; // Assuming same token for now
      const micToken = token;    // Assuming same token for now
      console.log("AssemblyAI token retrieved.");

      // 2. Setup WebSockets
      const sampleRate = 48000; // Target sample rate for osx-audio
      const systemWsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${systemToken}`;
      const micWsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${micToken}`;

      let isSystemReady = false;
      let isMicReady = false;

      const checkAndStartElectronCapture = () => {
        if (isSystemReady && isMicReady) {
          console.log("Both WebSockets ready. Starting Electron capture...");
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
                .then(recorderState => {
                  micRecorderRef.current = recorderState;
                })
                .catch(error => {
                  console.error("Failed to start mic audio capture:", error);
                  toast.error("Failed to start microphone capture.");
                  stopRecording(); // Critical failure, stop everything
                });

              return () => {
                if (micRecorderRef.current) {
                  stopMicAudioCapture(micRecorderRef.current);
                  micRecorderRef.current = null;
                }
                // No need to call window.electronSystemAudio.stopCapture() here,
                // as it's handled by the main stopRecording function.
              };
            };
            // Store the cleanup function that only stops the mic.
            // The main electron capture is stopped by stopRecording.
            audioIpcCleanupRef.current = cleanupElectronAndMic();

            console.log("Electron capture started, listening for audio data.");
            setIsLoading(false);
            setIsRecording(true);

          } catch (error) {
            console.error("Error starting Electron audio capture:", error);
            toast.error("Failed to start audio capture.");
            stopRecording();
          }
        }
      };

      // System WebSocket Handlers
      systemSocketRef.current = setupWebSocket({
        url: systemWsUrl,
        onOpen: () => {
          console.log("System audio WebSocket opened.");
          isSystemReady = true;
          checkAndStartElectronCapture();
        },
        onMessage: (event) => {
          try {
            const message = JSON.parse(event.data as string);
            switch (message.message_type) {
              case "SessionBegins":
                console.log("System audio session began.");
                break;
              case "PartialTranscript":
                setPartialTranscript((prev) => ({ ...prev, them: message.text }));
                break;
              case "FinalTranscript":
                if (message.text) {
                  setPartialTranscript((prev) => ({ ...prev, them: "" }));
                  setData((prev) => ({
                    ...prev,
                    transcript: [...(prev.transcript ?? []), { text: message.text, sender: "them", timestamp: new Date().toISOString() }],
                  }));
                  upsertNote();
                }
                break;
              case "SessionTerminated":
                console.log("System audio session terminated by AssemblyAI.");
                stopRecording();
                break;
              case "error":
                console.error("System audio WebSocket error:", message.error);
                toast.error(`System Transcription Error: ${message.error}`);
                stopRecording();
                break;
            }
          } catch (e) {
            console.error("Error parsing system audio WebSocket message:", event.data, e);
          }
        },
        onError: (errorEvent) => {
          console.error("System audio WebSocket error:", errorEvent);
          toast.error("System connection error.");
          stopRecording();
        },
        onClose: (closeEvent) => {
          console.log(`System audio WebSocket closed: ${closeEvent.code} ${closeEvent.reason}`);
          // If the WebSocket closes unexpectedly and we are still "recording", stop everything.
          // However, normal closure is handled by stopRecording.
          // Check if it was an unexpected closure.
          if (isRecording && closeEvent.code !== 1000) { // 1000 is normal closure
            console.warn("System audio WebSocket closed unexpectedly.");
            stopRecording();
          }
        }
      });

      // Mic WebSocket Handlers
      micSocketRef.current = setupWebSocket({
        url: micWsUrl,
        onOpen: () => {
          console.log("Mic audio WebSocket opened.");
          isMicReady = true;
          checkAndStartElectronCapture();
        },
        onMessage: (event) => {
          // console.log("Mic message:", event.data);
          try {
            const message = JSON.parse(event.data as string);
            switch (message.message_type) {
              case "SessionBegins":
                console.log("Mic audio session began.");
                break;
              case "PartialTranscript":
                setPartialTranscript((prev) => ({ ...prev, me: message.text }));
                break;
              case "FinalTranscript":
                if (message.text) {
                  setPartialTranscript((prev) => ({ ...prev, me: "" }));
                  setData((prev) => ({
                    ...prev,
                    transcript: [...(prev.transcript ?? []), { text: message.text, sender: "me", timestamp: new Date().toISOString() }],
                  }));
                  upsertNote();
                }
                break;
              case "SessionTerminated":
                console.log("Mic audio session terminated by AssemblyAI.");
                stopRecording();
                break;
              case "error":
                console.error("Mic audio WebSocket error:", message.error);
                toast.error(`Mic Transcription Error: ${message.error}`);
                stopRecording();
                break;
            }
          } catch (e) {
            console.error("Error parsing mic audio WebSocket message:", event.data, e);
          }
        },
        onError: (errorEvent) => {
          console.error("Mic audio WebSocket error:", errorEvent);
          toast.error("Mic connection error.");
          stopRecording();
        },
        onClose: (closeEvent) => {
          console.log(`Mic audio WebSocket closed: ${closeEvent.code} ${closeEvent.reason}`);
          if (isRecording && closeEvent.code !== 1000) {
            console.warn("Mic audio WebSocket closed unexpectedly.");
            stopRecording();
          }
        }
      });

    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error(`Error starting recording: ${error instanceof Error ? error.message : String(error)}`);
      stopRecording();
    }
  }, [isRecording, isLoading, upsertNote, stopRecording, audioIpcCleanupRef, systemSocketRef, micSocketRef, micRecorderRef]);

  // Effect for automatic cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopRecording();
      // Ensure mic recorder is stopped on unmount if active
      if (micRecorderRef.current) {
        stopMicAudioCapture(micRecorderRef.current);
        micRecorderRef.current = null;
      }
    };
  }, [stopRecording]); // Dependency on stopRecording


  return {
    transcript: data.transcript,
    partialTranscript,
    isRecording, // Use the combined state
    isLoading,   // Use the combined state
    startRecording,
    stopRecording,
    transcriptId: data.id // Expose the ID
  }
}
