import React from "react";
import { cn } from "@note/ui/lib/utils";
import { AudioLines, Loader2, Square } from "lucide-react";
import { Button } from "@note/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@note/ui/components/dropdown-menu"
import { useTranscript } from "../hooks/use-transcript";


function TranscriptItem({ sender, text, type = "full" }: { sender: "me" | "them", text: string, type?: "full" | "partial" }) {
  return (
    <div className={cn(
      sender === "me" ? (
        type === "full"
          ? "self-end bg-accent"
          : "self-end bg-accent/50"
      ) : (
        type === "full"
          ? "self-start bg-primary text-primary-foreground"
          : "self-start bg-primary/50 text-primary-foreground"
      ),
      "rounded-md p-2"
    )}>
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function TranscriptRecorder({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const {
    isRecording,
    startRecording,
    stopRecording,
    transcript,
    isLoading,
    partialTranscript
  } = useTranscript();

  return (
    <div
      className={cn("rounded-full w-40 bg-accent p-4 border border-accent-foreground/10 flex items-center justify-center gap-2", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
          >
            {isRecording ? (
              <AudioLines className="size-4 text-green-500" />
            ) :
              <AudioLines className="size-4" />
            }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="w-md h-96 overflow-y-auto">
          <div className="flex flex-col gap-2 w-full">
            {transcript ? (
              transcript.map((item) => (
                <TranscriptItem key={item.text} sender={item.sender} text={item.text} />
              ))
            ) : (
              <p className="text-sm">No transcript</p>
            )}
            {partialTranscript.me && (
              <TranscriptItem sender="me" text={partialTranscript.me} type="partial" />
            )}
            {partialTranscript.them && (
              <TranscriptItem sender="them" text={partialTranscript.them} type="partial" />
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        // className="w-full h-full"
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isRecording ? (
          <Square className="size-4 fill-current" />
        ) : (
          <span className="text-xs text-green-500">Resume</span>
        )}
      </Button>
    </div>
  );
}
