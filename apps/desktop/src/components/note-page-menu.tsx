import React from "react";
import { motion } from "framer-motion";
import { AudioLines, ChevronUp, Loader2, Sparkles, Square } from "lucide-react";
import { cn } from "@qahwa/ui/lib/utils";
import { Button } from "@qahwa/ui/components/button";
import { useTranscript } from "../hooks/use-transcript";
import { nanoid } from "nanoid";
import { useNoteGenerator } from "../hooks/use-note-generator";
import { toast } from "sonner";
import { setNoteEditorMode } from "../hooks/use-note-editor";
import { useStore } from "@tanstack/react-store";
import { noteEditorModeStore } from "../hooks/use-note-editor";

function TranscriptItem({
  sender,
  text,
  type = "full",
}: { sender: "me" | "them"; text: string; type?: "full" | "partial" }) {
  return (
    <div
      className={cn(
        sender === "me"
          ? type === "full"
            ? "self-end bg-accent"
            : "self-end bg-accent/50"
          : type === "full"
            ? "self-start bg-primary text-primary-foreground"
            : "self-start bg-primary/50 text-primary-foreground",
        "rounded-md p-2",
      )}
    >
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function NotePageMenuButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  const [menu, setMenu] = React.useState<"closed" | "transcript">("closed");
  const transcriptContainerRef = React.useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = React.useState(false);
  const {
    isRecording,
    startRecording,
    stopRecording,
    transcript,
    isLoading,
    partialTranscript,
  } = useTranscript();
  const { canGenerate, isGenerating, generate } = useNoteGenerator();
  const { mode } = useStore(noteEditorModeStore, (store) => store);

  // Auto-scroll to bottom when new transcript items appear
  React.useEffect(() => {
    // Only scroll if we're not handling a user scroll and the container exists
    if (transcriptContainerRef.current && !userScrolled) {
      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        if (transcriptContainerRef.current) {
          transcriptContainerRef.current.scrollTop =
            transcriptContainerRef.current.scrollHeight;
        }
      });
    }
  }, [userScrolled]);

  // Force scroll to bottom when transcript menu is first opened
  React.useEffect(() => {
    if (menu === "transcript" && transcriptContainerRef.current) {
      // Short delay to ensure content has rendered
      setTimeout(() => {
        if (transcriptContainerRef.current) {
          transcriptContainerRef.current.scrollTop =
            transcriptContainerRef.current.scrollHeight;
          setUserScrolled(false); // Reset user scrolled state when opening
        }
      }, 100);
    }
  }, [menu]);

  // Handle scroll events to detect user interaction
  function handleScroll() {
    if (transcriptContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        transcriptContainerRef.current;
      // If scrolled near bottom (within 20px), consider it "at bottom"
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;

      // If scrolled up, mark as user scrolled
      if (!isAtBottom) {
        setUserScrolled(true);
      } else {
        // If scrolled to bottom, re-enable auto-scrolling
        setUserScrolled(false);
      }
    }
  }

  function handleGenerate() {
    if (canGenerate) {
      return generate();
    }

    toast.error("Unable to generate qahwa");
  }

  return (
    <motion.div
      className={cn(
        "bg-background shadow-lg rounded-full flex flex-col items-center w-min fixed z-40 bottom-6 left-1/2 -translate-x-1/2 gap-4",
        className,
      )}
      {...props}
      animate={
        menu !== "closed"
          ? {
              width: "fit-content",
              borderRadius: "var(--radius)",
            }
          : {}
      }
      transition={{
        duration: 0.05,
        ease: "linear",
        borderRadius: {
          delay: menu !== "closed" ? 0 : 0.05,
        },
      }}
    >
      <div
        className={cn(
          "transition-opacity duration-50 h-full max-h-[400px] overflow-y-auto",
          menu === "transcript" ? "opacity-100" : "opacity-0",
          menu === "closed" ? "hidden" : "flex flex-col",
        )}
      >
        {menu === "transcript" ? (
          <>
            <div className="text-sm font-medium p-3 text-muted-foreground">
              Transcript
            </div>
            <div
              ref={transcriptContainerRef}
              onScroll={handleScroll}
              className="overflow-y-auto p-2 border-y h-full flex flex-col gap-2 w-full"
            >
              {transcript ? (
                transcript.map((item) => (
                  <TranscriptItem
                    key={nanoid()}
                    sender={item.sender}
                    text={item.content}
                  />
                ))
              ) : (
                <p className="text-sm">No transcript</p>
              )}
              {partialTranscript.me && (
                <TranscriptItem
                  sender="me"
                  text={partialTranscript.me}
                  type="partial"
                />
              )}
              {partialTranscript.them && (
                <TranscriptItem
                  sender="them"
                  text={partialTranscript.them}
                  type="partial"
                />
              )}
            </div>
          </>
        ) : null}
      </div>
      <div className="flex justify-center items-center gap-1 [&>*]:rounded-full p-2">
        {/* Always presesnt */}
        <Button
          variant="ghost"
          onClick={() => setMenu(menu === "closed" ? "transcript" : "closed")}
        >
          {isRecording ? (
            <AudioLines className="size-4 text-green-500" />
          ) : (
            <AudioLines className="size-4" />
          )}
          <ChevronUp
            className={cn(
              "ml-2 h-4 w-4 flex-shrink-0 transition-transform duration-200",
              menu === "transcript" && "rotate-180",
            )}
          />
        </Button>
        <Button
          variant="ghost"
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
        <Button
          variant="ghost"
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          Generate qahwa
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            setNoteEditorMode(mode === "generated" ? "user" : "generated")
          }
        >
          {mode === "generated" ? "User Notes" : "Generated Notes"}
        </Button>
      </div>
    </motion.div>
  );
}
