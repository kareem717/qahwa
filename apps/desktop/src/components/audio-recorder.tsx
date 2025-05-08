import { env } from "@/env"
import React, { useState, useRef, useEffect } from 'react';
import {
  RealtimeTranscriber,
  RealtimeTranscript
} from "assemblyai";
import { Button } from "./ui/button";
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

// Define the message structure
interface Message {
  id: string;
  text: string;
  isFinal: boolean;
}

export function AudioRecorder() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const socketRef = useRef<RealtimeTranscriber | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Ref for scrolling

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleRecording = async () => {
    if (isLoading) {
      return;
    }

    if (isRecording) {
      setIsLoading(true);
      // Stop recording
      if (recorderRef.current) {
        recorderRef.current.stopRecording(() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          console.log("Stopped recording");
        });
      }
      if (socketRef.current) {
        console.log("Closing real-time transcript connection");
        await socketRef.current.close();
        socketRef.current = null;
      }
      setIsRecording(false);
      // Clear messages on stop
      setMessages([]);
      setIsLoading(false);
    } else {
      // Start recording
      setIsLoading(true);
      // Reset messages at the start
      setMessages([]);
      try {
        const token = await fetch(env.VITE_PUBLIC_BACKEND_URL + '/token')
          .then(res => res.json())
          .then(data => data.token);

        const rt = new RealtimeTranscriber({
          token: token,
          sampleRate: 16_000, // Ensure sample rate matches recorder
          endUtteranceSilenceThreshold: 700,
  
        });
        socketRef.current = rt;

        rt.on("open", ({ sessionId }) => {
          console.log(`Session opened with ID: ${sessionId}`);
        });
        rt.on("error", (error) => {
          console.error("Error:", error);
          // Handle error appropriately, maybe stop recording
          toggleRecording(); // Attempt to stop/cleanup on error
        });
        rt.on("close", (code, reason) =>
          console.log("Session closed:", code, reason)
        );
        rt.on("transcript", (transcriptData: RealtimeTranscript) => {
          const text = transcriptData.text;
          if (!text) {
            return;
          }

          if (transcriptData.message_type === "PartialTranscript") {
            console.log("Partial:", text);
            setMessages(prevMessages => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (lastMessage && !lastMessage.isFinal) {
                // Update the last partial message
                return prevMessages.map((msg, index) =>
                  index === prevMessages.length - 1 ? { ...msg, text: text } : msg
                );
              } else {
                // Add a new partial message
                const newId = crypto.randomUUID();
                return [...prevMessages, { id: newId, text: text, isFinal: false }];
              }
            });
          } else if (transcriptData.message_type === "FinalTranscript") {
            console.log("Final:", text);
            setMessages(prevMessages => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (lastMessage && !lastMessage.isFinal) {
                // Finalize the last message (which was partial)
                return prevMessages.map((msg, index) =>
                  index === prevMessages.length - 1 ? { ...msg, text: text, isFinal: true } : msg
                );
              } else {
                // Add a new final message (if no partial preceded it)
                const newId = crypto.randomUUID();
                return [...prevMessages, { id: newId, text: text, isFinal: true }];
              }
            });
          }
        });

        console.log("Connecting to real-time transcript service");
        await rt.connect();

        console.log("Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const recorderInstance = new RecordRTC(stream, {
          type: "audio",
          mimeType: "audio/webm;codecs=pcm", // Important for AssemblyAI
          recorderType: StereoAudioRecorder,
          timeSlice: 250, // Send data every 250ms
          desiredSampRate: 16000,
          numberOfAudioChannels: 1,
          bufferSize: 4096, // Smaller buffer for lower latency
          audioBitsPerSecond: 128000,
          ondataavailable: async (blob) => {
            // If the socket exists, assume it's connected (cleanup logic sets it null)
            if (socketRef.current) {
              const buffer = await blob.arrayBuffer();
              socketRef.current.sendAudio(buffer);
            } else {
              // If socket is null, stop the recorder
              console.log("Socket closed, stopping recorder from ondataavailable");
              recorderRef.current?.stopRecording();
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
              }
            }
          },
        });
        recorderRef.current = recorderInstance;

        console.log("Starting recording");
        recorderInstance.startRecording();
        setIsRecording(true);
        setIsLoading(false);

      } catch (error) {
        console.error("Failed to start recording:", error);
        // Clean up potentially opened socket
        if (socketRef.current) {
          await socketRef.current.close();
          socketRef.current = null;
        }
        setIsLoading(false);
        setIsRecording(false);
      }
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return isRecording ? "Stopping..." : "Starting...";
    }
    return isRecording ? 'Stop Recording' : 'Start Recording';
  };

  return <div>
    <Button onClick={toggleRecording} disabled={isLoading}>
      {getButtonText()}
    </Button>
    {/* Message display area */}
    <div className="mt-4 h-64 overflow-y-auto p-2 border rounded flex flex-col space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-2 rounded-lg max-w-[75%] self-end ${msg.isFinal ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 opacity-70'}`}
        >
          {msg.text}
        </div>
      ))}
      {/* Empty div to target for scrolling */}
      <div ref={messagesEndRef} />
    </div>
  </div>
}