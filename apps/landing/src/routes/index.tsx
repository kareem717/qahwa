import { createFileRoute, Link } from '@tanstack/react-router'
import { WaitlistForm } from '@note/landing/components/waitlist-form'
import { LoginButton } from '@note/landing/components/auth/login-button'
import { useSession, signOut } from '../lib/auth-client'
import { Button, buttonVariants } from '@note/ui/components/button'


export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { data, isPending } = useSession()

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
      <div className="flex flex-col items-center justify-center gap-4">
        {isPending ? <p>Loading...</p> : data?.session ?
          <Button onClick={() => signOut()}>Sign out</Button> :
          <Link to="/sign-in" className={buttonVariants()}>Sign in</Link>
        }
      </div>
    </div>
  )
}