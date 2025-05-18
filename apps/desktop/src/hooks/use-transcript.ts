import React from "react"
import { getClient } from "../lib/api"
import { toast } from "sonner"
import { fullNoteCollection } from "../lib/collections/notes"
import { useLiveQuery } from "@tanstack/react-db";
import { useOptimisticMutation } from "@tanstack/react-db";
import { noteIdStore, DEFAULT_NOTE_ID, setNoteId } from "./use-note-id";
import { nanoid } from "nanoid"
import { useStore } from "@tanstack/react-store";

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

  const { data } = useLiveQuery((query) =>
    query
      .from({ noteCollection: liveQueryCollection }) // Use memoized collection for live query
      .select("@transcript", "@id")
      .keyBy("@id"),
    [liveQueryCollection] // Depend on the collection instance
  );

  const transcript = data[0]?.transcript ?? []

  React.useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const [partialTranscript, setPartialTranscript] = React.useState<{
    them: string
    me: string
  }>({ them: "", me: "" })

  const { mutate } = useOptimisticMutation({
    mutationFn: async ({ transaction }) => {
      const fnId = nanoid()
      console.debug(`[useOptimisticMutation - ${fnId}] Called with noteId: ${internalNoteIdRef.current} at ${new Date().toISOString()}`)
      const { changes, original } = transaction.mutations[0]!

      const api = await getClient()
      const payload = {
        id: internalNoteIdRef.current === DEFAULT_NOTE_ID ? undefined : internalNoteIdRef.current,
        transcript: changes.transcript as any,
      }
      console.debug(`[useOptimisticMutation - ${fnId}] Sending payload to API, payload: ${JSON.stringify(payload)} at ${new Date().toISOString()}`)
      const response = await api.note.$put({
        json: payload
      })

      if (!response.ok) {
        console.error("Error upserting note", response)
        if (internalNoteIdRef.current === DEFAULT_NOTE_ID) {
          isCreatingNoteRef.current = false; // Reset on creation failure
        }
        throw new Error("Error upserting note")
      }

      const { note } = await response.json()
      console.debug(`[useOptimisticMutation - ${fnId}] API response: ${JSON.stringify(note)} at ${new Date().toISOString()}`)

      if (internalNoteIdRef.current === DEFAULT_NOTE_ID && note && note.id) {
        const newNoteId = note.id
        console.debug(`[useOptimisticMutation - ${fnId}] Setting internal note id to: ${newNoteId} at ${new Date().toISOString()}`)
        // Order: Set ID, then invalidate, then allow useEffect to flush.
        setNoteId(newNoteId) // This updates internalNoteIdRef via its own useEffect.
        // This will also trigger the flushing useEffect if pending entries exist.
        await fullNoteCollection(newNoteId).invalidate() // This will update transcriptRef via useLiveQuery and its useEffect.
        console.debug(`[useOptimisticMutation - ${fnId}] Invalidated new collection for id: ${newNoteId}. isCreatingNoteRef will be set to false. at ${new Date().toISOString()}`)
        isCreatingNoteRef.current = false; // Mark creation as finished. IMPORTANT: Do this after setNoteId & invalidate.
        // Pending entries will be handled by the useEffect watching noteId and transcript.
      } else {
        if (note && note.id) {
          console.debug(`[useOptimisticMutation - ${fnId}] Invalidating existing collection for id ${note.id} at ${new Date().toISOString()}`)
          await fullNoteCollection(note.id).invalidate();
        } else if (internalNoteIdRef.current !== DEFAULT_NOTE_ID) {
          console.debug(`[useOptimisticMutation - ${fnId}] Invalidating existing collection for id ${internalNoteIdRef.current} (from ref) as note ID was not in response at ${new Date().toISOString()}`)
          await fullNoteCollection(internalNoteIdRef.current).invalidate();
        }
        // If it was an update (not creation), ensure isCreatingNoteRef is false.
        if (internalNoteIdRef.current !== DEFAULT_NOTE_ID) {
          isCreatingNoteRef.current = false;
        }
      }
    },
  })

  // Effect to flush pending entries once note ID is established and transcript is updated
  // This useEffect MUST be defined AFTER 'mutate' is defined.
  React.useEffect(() => {
    const currentActualNoteId = internalNoteIdRef.current;
    if (currentActualNoteId !== DEFAULT_NOTE_ID && pendingTranscriptEntriesRef.current.length > 0) {
      const entriesToFlush = [...pendingTranscriptEntriesRef.current];
      pendingTranscriptEntriesRef.current = []; // Clear buffer immediately

      console.debug(`[useEffect - Flush] Flushing ${entriesToFlush.length} pending entries for note ${currentActualNoteId}. Base transcriptRef: ${JSON.stringify(transcriptRef.current)}`);

      mutate(() => {
        const collectionForFlush = fullNoteCollection(currentActualNoteId);
        const noteToUpdate = collectionForFlush.state.get(String(currentActualNoteId));
        if (noteToUpdate) {
          collectionForFlush.update(noteToUpdate, (draft) => {
            // Ensure we are building on the most recent transcript from the live query
            draft.transcript = [...(transcriptRef.current ?? []), ...entriesToFlush];
            console.debug(`[useEffect - Flush] Updated note optimistically for ID: ${currentActualNoteId}. New draft.transcript: ${JSON.stringify(draft.transcript)}`);
          });
        } else {
          console.warn(`[useEffect - Flush] Note ${currentActualNoteId} not found for appending buffered entries. This might indicate a timing issue or that the note was deleted. Entries will be lost if not handled. Attempting to insert if transcriptRef is empty.`);
          // Fallback: if transcriptRef is empty and note doesn't exist, maybe it was the first entry that failed to get in before invalidation picked it up.
          if ((transcriptRef.current ?? []).length === 0) {
            collectionForFlush.insert([{
              id: currentActualNoteId,
              transcript: entriesToFlush,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: DEFAULT_NOTE_ID,
              title: "",
              userNotes: "",
              generatedNotes: ""
            }]);
            console.debug(`[useEffect - Flush] Fallback: Inserted entries for ${currentActualNoteId} as transcriptRef was empty.`);
          } else {
            console.error(`[useEffect - Flush] Fallback failed: Note ${currentActualNoteId} not found and transcriptRef was not empty. Entries lost: ${JSON.stringify(entriesToFlush)}`);
          }
        }
      });
    }
    // Depend on noteId (to trigger when it changes from TEMP) and transcript (to ensure transcriptRef is updated from liveQuery)
    // mutate is stable and included as a dependency for the mutate call.
  }, [noteId, transcript, mutate]);

  const handleTranscriptChange = React.useCallback((newTranscriptEntries: {
    timestamp: string
    text: string
    sender: "me" | "them"
  }[]) => {
    const fnId = nanoid()
    const currentNoteIdVal = internalNoteIdRef.current;
    console.debug(`[handleTranscriptChange - ${fnId}] Called with noteId: ${currentNoteIdVal}, isCreatingNote: ${isCreatingNoteRef.current} at ${new Date().toISOString()}`)

    if (currentNoteIdVal === DEFAULT_NOTE_ID) {
      if (isCreatingNoteRef.current) {
        pendingTranscriptEntriesRef.current.push(...newTranscriptEntries);
        console.debug(`[handleTranscriptChange - ${fnId}] Buffered ${newTranscriptEntries.length} entries as note creation is in progress. Buffer size: ${pendingTranscriptEntriesRef.current.length} at ${new Date().toISOString()}`);
        // UI for partials could be updated here from pendingTranscriptEntriesRef if needed
        return; // Don't call mutate for these entries yet
      } else {
        isCreatingNoteRef.current = true;
        console.debug(`[handleTranscriptChange - ${fnId}] Initiating note creation with ${newTranscriptEntries.length} entries at ${new Date().toISOString()}`);
        mutate(() => {
          const collectionForInsert = fullNoteCollection(DEFAULT_NOTE_ID); // Operate on TEMP_ID collection
          console.debug(`[handleTranscriptChange - ${fnId}] Inserting temp note optimistically with ID: ${DEFAULT_NOTE_ID} at ${new Date().toISOString()}`);
          collectionForInsert.insert([{
            id: DEFAULT_NOTE_ID,
            transcript: newTranscriptEntries,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: DEFAULT_NOTE_ID,
            title: "",
            userNotes: "",
            generatedNotes: "",
          }]);
        });
      }
    } else {
      // Standard update: noteId is a real ID
      console.debug(`[handleTranscriptChange - ${fnId}] Updating existing note ${currentNoteIdVal} with ${newTranscriptEntries.length} entries at ${new Date().toISOString()}`);
      mutate(() => {
        const collectionForUpdate = fullNoteCollection(currentNoteIdVal);
        const noteToUpdate = collectionForUpdate.state.get(String(currentNoteIdVal));
        if (noteToUpdate) {
          console.debug(`[handleTranscriptChange - ${fnId}] Updating note: Base transcript from transcriptRef: ${JSON.stringify(transcriptRef.current)} at ${new Date().toISOString()}`);
          collectionForUpdate.update(noteToUpdate, (draft) => {
            draft.transcript = [...(transcriptRef.current ?? []), ...newTranscriptEntries];
            console.debug(`[handleTranscriptChange - ${fnId}] Updated note optimistically for ID: ${currentNoteIdVal}. New draft.transcript: ${JSON.stringify(draft.transcript)} at ${new Date().toISOString()}`);
          });
        } else {
          console.warn(`[handleTranscriptChange - ${fnId}] Note with ID ${currentNoteIdVal} not found in collection for update. Current transcriptRef: ${JSON.stringify(transcriptRef.current)} at ${new Date().toISOString()}`);
          // Potentially insert if note disappeared but we have an ID? Or rely on sync to fix.
          // For now, just log. If this happens, it implies a desync not handled by current optimistic flow.
        }
      });
    }
  }, [mutate]); // Dependencies: mutate (stable), refs are accessed directly.

  const [isLoading, setIsLoading] = React.useState(false)
  const [isRecording, setIsRecording] = React.useState(false)

  // Refs
  const systemSocketRef = React.useRef<WebSocket | null>(null)
  const micSocketRef = React.useRef<WebSocket | null>(null)
  const audioIpcCleanupRef = React.useRef<(() => void) | null>(null); // To store cleanup from startCapture
  const micRecorderRef = React.useRef<MicAudioRecorderState | null>(null);


  // --- Main Recording Logic ---
  const stopRecording = React.useCallback(() => {
    console.log("Stopping recording...");
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
    console.log("Cleared pending transcript entries and creation state.");

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
                  console.debug("Calling handleTranscriptChange for system audio with full msg", new Date().toISOString())
                  handleTranscriptChange([{ text: message.text, sender: "them", timestamp: new Date().toISOString() }])
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
                  console.debug("Calling handleTranscriptChange for mic audio with full msg", new Date().toISOString())
                  handleTranscriptChange([{ text: message.text, sender: "me", timestamp: new Date().toISOString() }])
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
  }, [isRecording, isLoading, stopRecording, audioIpcCleanupRef, systemSocketRef, micSocketRef, micRecorderRef]);

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
    transcript,
    partialTranscript,
    isRecording, // Use the combined state
    isLoading,   // Use the combined state
    startRecording,
    stopRecording
  }
}
