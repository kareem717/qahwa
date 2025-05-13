import React from "react";
import { cn } from "@note/ui/lib/utils";
import { AudioLines, Square } from "lucide-react";
import { Button } from "@note/ui/components/button";
import { useAudioTranscription } from "../lib/context/audio-transcription-context";

interface RecorderButtonProps extends React.ComponentPropsWithoutRef<"div"> {}

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AudioWave({ level }: { level: number }) {
  const base = [1, 0.7, 1.3];
  return (
    <div className="flex h-4 w-6 items-end gap-[2px]">
      {base.map((b, i) => (
        <span
          key={i}
          className={cn(
            `block w-[3px] rounded bg-green-500`,
            `animate-wave${i + 1}`,
          )}
          style={{ height: `${Math.max(0.5, b * (0.75 + level * 1.25))}rem` }}
        />
      ))}
    </div>
  );
}

export function RecorderButton({ className, ...props }: RecorderButtonProps) {
  const {
    mic,
    system,
    startSystemRecording,
    stopSystemRecording,
    pauseSystemRecording,
    resumeSystemRecording,
    startMicRecording,
    stopMicRecording,
    pauseMicRecording,
    resumeMicRecording,
    clearTranscript,
  } = useAudioTranscription();

  const [isTranscriptOpen, setIsTranscriptOpen] = React.useState(false);
  const [expandStage, setExpandStage] = React.useState<
    "pill" | "width" | "full"
  >("pill");
  const transcriptRef = React.useRef<HTMLDivElement>(null);

  // Merge and sort transcripts
  const mergedTranscriptLog = React.useMemo(() => {
    return [...system.transcriptLog, ...mic.transcriptLog].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }, [system.transcriptLog, mic.transcriptLog]);

  React.useEffect(() => {
    if (isTranscriptOpen) {
      setExpandStage("width");
      const timeout = setTimeout(() => setExpandStage("full"), 180);
      return () => clearTimeout(timeout);
    } else {
      setExpandStage("pill");
    }
  }, [isTranscriptOpen]);

  React.useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [mergedTranscriptLog.length]);

  // Copy merged transcript as plain text
  const handleCopyTranscript = () => {
    const text = mergedTranscriptLog
      .map(
        (e) =>
          `[${formatTimestamp(e.timestamp)}] ${e.source === "mic" ? "You" : "Them"}: ${e.text}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  // Download merged transcript as .txt
  const handleDownloadTranscript = () => {
    const text = mergedTranscriptLog
      .map(
        (e) =>
          `[${formatTimestamp(e.timestamp)}] ${e.source === "mic" ? "You" : "Them"}: ${e.text}`,
      )
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    // saveAs(blob, `transcript-${new Date().toISOString()}.txt`);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center transition-all",
        expandStage === "pill" && "h-10 w-24 rounded-full p-2",
        expandStage === "width" &&
          "h-10 w-[520px] rounded-full p-2 transition-[width] duration-200",
        expandStage === "full" &&
          "bg-accent border-accent-foreground/10 h-[520px] w-[520px] rounded-2xl border p-0 shadow-2xl transition-[height] duration-200",
        className,
      )}
      aria-expanded={isTranscriptOpen}
      aria-label="Recorder and transcript"
      {...props}
    >
      {/* Transcript window overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col transition-opacity duration-300",
          expandStage === "full"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        role="region"
        aria-label="Live transcript"
      >
        <div className="border-border flex items-center justify-between border-b px-4 pt-4 pb-2">
          <span className="text-lg font-semibold">Live Transcription</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearTranscript}
              aria-label="Clear transcript"
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyTranscript}
              aria-label="Copy transcript"
            >
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadTranscript}
              aria-label="Download transcript"
            >
              Download
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close transcript"
              onClick={() => setIsTranscriptOpen(false)}
            >
              <span className="text-xl">×</span>
            </Button>
          </div>
        </div>
        <div
          className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4"
          ref={transcriptRef}
        >
          {mergedTranscriptLog.length > 0 ? (
            <div className="flex w-full flex-col gap-3">
              {mergedTranscriptLog.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex max-w-[80%] flex-col",
                    item.source === "mic"
                      ? "items-end self-end"
                      : "items-start self-start",
                    "animate-fadein",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-md p-2 shadow",
                      item.source === "mic"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 text-xs",
                        item.source === "mic" ? "text-right" : "text-left",
                        "text-muted-foreground",
                      )}
                    >
                      {item.source === "mic" ? "You" : "Them"} ·{" "}
                      {formatTimestamp(item.timestamp)}
                    </div>
                    <p className="text-sm whitespace-pre-line">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No transcript yet.</p>
          )}
        </div>
        {/* Controls for both sources */}
        <div className="border-border flex items-center justify-between gap-4 border-t px-4 pt-2 pb-2">
          {/* System controls */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">System</span>
            {system.isRecording && <AudioWave level={system.audioLevel} />}
            {system.isRecording ? (
              system.isPaused ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={resumeSystemRecording}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pauseSystemRecording}
                >
                  Pause
                </Button>
              )
            ) : null}
            {system.isRecording ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopSystemRecording}
              >
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={startSystemRecording}
              >
                Start
              </Button>
            )}
          </div>
          {/* Mic controls */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">Mic</span>
            {mic.isRecording && <AudioWave level={mic.audioLevel} />}
            {mic.isRecording ? (
              mic.isPaused ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={resumeMicRecording}
                >
                  Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={pauseMicRecording}>
                  Pause
                </Button>
              )
            ) : null}
            {mic.isRecording ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopMicRecording}
              >
                Stop
              </Button>
            ) : (
              <Button size="sm" variant="default" onClick={startMicRecording}>
                Start
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Pill controls */}
      <div
        className={cn(
          "flex items-center gap-2 transition-opacity duration-200",
          expandStage !== "pill"
            ? "pointer-events-none opacity-0"
            : "opacity-100",
        )}
      >
        {system.isRecording && !isTranscriptOpen && (
          <AudioWave level={system.audioLevel} />
        )}
        <Button
          variant="ghost"
          aria-label="Show transcript"
          onClick={() => setIsTranscriptOpen(true)}
        >
          {system.isRecording ? (
            <AudioLines className="size-4 text-green-500" />
          ) : (
            <AudioLines className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          aria-label={system.isRecording ? "Stop recording" : "Start recording"}
          onClick={
            system.isRecording ? stopSystemRecording : startSystemRecording
          }
        >
          {system.isRecording ? (
            <Square className="size-4 fill-current" />
          ) : (
            <span className="text-xs text-green-500">Resume</span>
          )}
        </Button>
      </div>
    </div>
  );
}
