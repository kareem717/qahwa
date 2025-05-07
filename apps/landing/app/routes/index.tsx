// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold mb-3 text-gray-800">Note</h1>
        <p className="text-xl text-gray-600">
          Best way to take notes.
        </p>
      </header>
    </div>
  )
}