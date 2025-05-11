import React from "react";
import { Button } from "@note/ui/components/button";
// import { RealtimeTranscriber } from "assemblyai"; // Removed SDK
import { getClient } from "../lib/api";

export function AudioTap() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState<string>("");
  const socketRef = React.useRef<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = React.useState<string>("disconnected");

  // Clean up WebSocket on component unmount
  React.useEffect(() => {
    return () => {
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
        console.log("AudioTap unmounting, sending terminate_session and closing WebSocket.");
        socketRef.current.send(JSON.stringify({ terminate_session: true }));
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, []);

  async function toggleRecording() {
    if (isRecording) {
      // Currently recording, so stop
      console.log("Stopping audio capture...");
      window.electronSystemAudio.stopCapture();

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log("Sending terminate_session message to WebSocket.");
        socketRef.current.send(JSON.stringify({ terminate_session: true }));
        // The server should close the connection after this, triggering 'onclose'.
        // We can also explicitly call socketRef.current.close() if needed,
        // but AssemblyAI docs imply SessionTerminated leads to closure.
      } else {
        console.warn("Attempted to stop recording, but WebSocket was not open.");
      }
      setIsRecording(false);
      // setSocketStatus("disconnected"); // Actual closure handled by onclose
    } else {
      // Currently not recording, so start
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
        console.log("Cleaning up existing WebSocket before starting new session.");
        socketRef.current.close(); // Ensure old connection is closed
        socketRef.current = null;
      }

      setSocketStatus("connecting");
      console.log("Attempting to establish WebSocket connection...");

      try {
        const client = await getClient();
        const response = await client.transcription.token.$get();
        const { token } = await response.json();

        if (!token) {
          console.error("Failed to retrieve temporary token.");
          setSocketStatus("error");
          return;
        }

        const sampleRate = 48000; // Corrected: This MUST match the output of AudioManager.mm
        const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${token}`;

        const newSocket = new WebSocket(wsUrl);
        socketRef.current = newSocket;

        newSocket.onopen = () => {
          console.log("WebSocket connection opened successfully.");
          setSocketStatus("connected");
          setIsRecording(true); // Set recording true only after socket is open

          console.log("Starting audio capture after WebSocket open...");
          window.electronSystemAudio.startCapture((data) => {
            if (newSocket.readyState === WebSocket.OPEN) {
              // TODO: Ensure 'data' is in the correct binary format (e.g., Int16Array for pcm_s16le)
              // For now, just log and attempt to send.
              // console.log("Received audio data from electronSystemAudio, attempting to send via WebSocket.", data);
              try {
                // IMPORTANT: Data format needs to be correct.
                // If `data` is ArrayBuffer of Float32, it needs conversion to Int16Array.
                // For pcm_s16le, audio data should be Int16Array.
                // Example conversion (if data is ArrayBuffer of Float32):
                // const float32View = new Float32Array(data);
                // const pcm16Data = new Int16Array(float32View.length);
                // for (let i = 0; i < float32View.length; i++) {
                //   pcm16Data[i] = Math.max(-1, Math.min(1, float32View[i])) * 32767;
                // }
                // newSocket.send(pcm16Data.buffer);

                // console.log("Sending audio data chunk via WebSocket."); // Simplified log
                newSocket.send(data); // Assuming `data` is already in correct binary format for now
              } catch (sendError) {
                console.error("Error sending audio data via WebSocket:", sendError);
              }
            } else {
              // console.log("Audio data received, but WebSocket is not open. State:", newSocket.readyState);
            }
          });
        };

        newSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string);
            // console.log("WebSocket message received:", message);

            if (message.message_type === "SessionBegins") { // Or SessionInformation, check docs
              console.log("Session has begun:", message);
            } else if (message.message_type === "PartialTranscript") {
              console.log("Partial Transcript:", message.text);
              // setTranscript((prev) => prev + message.text + " "); // Append if desired
            } else if (message.message_type === "FinalTranscript") {
              console.log("Final Transcript:", message.text);
              setTranscript((prev) => prev + message.text + " ");
            } else if (message.message_type === "SessionTerminated") {
              console.log("SessionTerminated message received from server.");
              // Server will close the connection.
            } else if (message.error) { // Check for error messages from AssemblyAI
              console.error("AssemblyAI WebSocket Error:", message.error);
            }
          } catch (e) {
            console.error("Error parsing WebSocket message or non-JSON message:", event.data, e);
          }
        };

        newSocket.onerror = (errorEvent) => {
          console.error("WebSocket error:", errorEvent);
          setSocketStatus("error");
          setIsRecording(false); // Stop recording on error
        };

        newSocket.onclose = (closeEvent) => {
          console.log(
            `WebSocket connection closed: Code ${closeEvent.code}, Reason: ${closeEvent.reason}, WasClean: ${closeEvent.wasClean}`
          );
          setSocketStatus("disconnected");
          setIsRecording(false); // Ensure recording state is reset
          socketRef.current = null; // Clear the ref
        };

      } catch (error) {
        console.error("Failed to set up WebSocket connection:", error);
        setSocketStatus("error");
        setIsRecording(false);
      }
    }
  }

  return (
    <div>
      <Button onClick={toggleRecording} disabled={socketStatus === "connecting"}>
        {isRecording ? "Stop AudioTap" : (socketStatus === "connecting" ? "Connecting..." : "Start AudioTap")}
      </Button>
      <div>Status: {socketStatus}</div>
      <div>Transcript: {transcript}</div>
    </div>
  );
}