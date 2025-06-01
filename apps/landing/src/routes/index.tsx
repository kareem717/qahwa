import { createFileRoute } from "@tanstack/react-router";
import { Typewriter } from "@note/ui/components/ui/typewriter";
import { AppleIcon, WindowsIcon, XIcon } from "../components/icons";
import { Button } from "@note/ui/components/button";
import { toast } from "sonner";
import { DownloadLink } from "../components/download-link";
import { QahwaIcon } from "@note/ui/components/icons";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-between h-screen relative p-4 container mx-auto">
      <header className="w-full font-bold text-2xl tracking-wide">
        <QahwaIcon className="size-7" />
      </header>
      <section className="flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold mb-3">qahwa.</h1>
        <div className="text-xl text-muted-foreground flex items-center gap-1">
          <span>AI assistant and note compiler for</span>
          <Typewriter
            text={["sales calls", "standups", "lectures", "meetings"]}
            speed={70}
            className="text-primary"
            waitTime={1500}
            deleteSpeed={40}
            cursorChar={"_"}
          />
        </div>
        <div className="flex flex-col items-center justify-center mt-8 w-xs mx-auto gap-4">
          {/* <h2 className="text-xl font-medium">download</h2> */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <DownloadLink platform="darwin/arm64">
              <AppleIcon className="size-5" />
            </DownloadLink>
            <Button onClick={() => toast.info("Coming soon...")}>
              <WindowsIcon className="size-5" />
            </Button>
          </div>
        </div>
      </section>
      <footer className="flex items-center justify-between gap-4 w-full px-4">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Fundlevel
        </p>
        <a
          href="https://x.com/bootbig76"
          target="_blank"
          rel="noopener noreferrer"
        >
          <XIcon className="size-4" />
        </a>
      </footer>
    </div>
  );
}
