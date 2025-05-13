import { createFileRoute } from '@tanstack/react-router'
import { Typewriter } from '@note/ui/components/ui/typewriter'
import { XIcon } from '../components/icons'
import { DownloadTeaser } from '../components/download-teaser'
export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-between h-screen relative p-4 container mx-auto">
      <header className="w-full font-bold text-2xl tracking-wide">text.</header>
      <section className="flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold mb-3">note.</h1>
        <p className="text-xl text-muted-foreground flex items-center gap-1">
          <span>AI note compiler for</span>
          <Typewriter
            text={[
              "sales calls",
              "standups",
              "lectures",
              "meetings"
            ]}
            speed={70}
            className="text-primary"
            waitTime={1500}
            deleteSpeed={40}
            cursorChar={"_"}
          />
        </p>
        <div className="grid grid-cols-2 gap-2 w-xs mx-auto mt-12">
          <DownloadTeaser>
            MAC
          </DownloadTeaser>
          <DownloadTeaser>
            WINDOWS
          </DownloadTeaser>
        </div>
      </section>
      <footer className="flex items-center justify-between gap-4 w-full px-4">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} the text company.
        </p>
        <a href="https://x.com/bootbig76" target="_blank" rel="noopener noreferrer">
          <XIcon className="size-4" />
        </a>
      </footer>
    </div>
  )
}