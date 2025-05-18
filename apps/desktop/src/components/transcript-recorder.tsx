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

interface TranscriptRecorderProps extends React.ComponentPropsWithoutRef<"div"> {
  noteId: number
}


export function TranscriptRecorder({ className,noteId, ...props }: TranscriptRecorderProps) {
  const {
    isRecording,
    startRecording,
    stopRecording,
    transcript,
    isLoading,
    partialTranscript
  } = useTranscript(noteId);
  // const [debouncedTranscript] = useDebounce(transcript, 1000)
  // // console.log("Debounced transcript", debouncedTranscript)
  // const isFirstRender = React.useRef(true)
  // // React Query
  // const queryClient = useQueryClient()
  // const { mutateAsync: upsertNote } = useMutation({
  //   mutationFn: async () => {
  //     const api = await getClient()
  //     // Only send transcript if it has content
  //     const transcriptToSend = transcript?.length ? transcript : undefined;
  //     if (!id && !transcriptToSend) {
  //       console.log("Skipping upsert: No ID and no transcript content.");
  //       return { note: { id: undefined } }; // Return dummy response if nothing to save
  //     }
  //     const response = await api.note.$put({
  //       json: {
  //         id: id ?? undefined,
  //         transcript: transcriptToSend,
  //       },
  //     })
  //     return await response.json()
  //   },
  //   onMutate: () => {
  //     if (debouncedTranscript?.length || id) { // Only show toast if something is being saved
  //       toast.success("Saving transcript...")
  //     }
  //   },
  //   onSuccess: ({ note }) => {
  //     if (note.id) { // Check if an ID was returned (meaning save happened)
  //       toast.success("Transcript saved")
  //       setNote(note)
  //       queryClient.invalidateQueries({ queryKey: [NOTE_QUERY_KEY, note.id] })
  //     }
  //   },
  //   onError: () => {
  //     toast.error("Failed to save transcript")
  //   },
  // })

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
              <p className="text-sm">No tradfnscript</p>
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
