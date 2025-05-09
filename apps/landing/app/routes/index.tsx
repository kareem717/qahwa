// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { WaitlistForm } from '@note/landing/components/waitlist-form'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold mb-3">Note</h1>
        <p className="text-xl text-muted-foreground">
          Best way to take notes.
        </p>
      </header>
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-xl">
          Get notified when we launch.
        </p>
        <WaitlistForm />
      </div>
    </div>
  )
}